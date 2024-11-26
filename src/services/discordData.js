import { collectionBox } from '../data/config.json';
import { titleCase } from './utility.mjs';
import { Client, ThreadChannel, Message } from 'discord.js';

import logger from './logger.mjs';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * @param {Client} client 
 */
export async function getAllBoxData(client) {
    let boxID, channelArr;

    if (new Date().getTime() - client.lastboxupdate < 60000) {
        return client.boxData ?? {};
    }

    if (process.env.NODE_ENV === 'development' && process.env.FORCE_BOX === 'true') {
        boxID = collectionBox.testid
        channelArr = collectionBox.testchannels
    } else {
        boxID = collectionBox.id
        channelArr = collectionBox.channels
    }

    const boxChannel =  await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) {
        logger.warn(`No Threads channel found; failed to update box`);
        client.lastboxupdate = new Date().getTime();
        return {}
    }
    const boxStock = {}

    const matchAny = (a, b) => (a??"").startsWith(b??"") || (b??"").startsWith(a??"")
    const arrOfEntries = Object.entries(channelArr)
    
    await Promise.all(arrOfEntries.map(async ([chnl, cid]) => {
        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {
            if (!thread.messageCount) return;
            const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })
            messages.map((msg) => {
                if (msg.content.toLowerCase().includes('banned')) return;

                let parts = msg.content
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/\s*prime\s*/g, ' ')
                    .replace(/\(.*?\)/g, "")
                    .replace(/<@!?[^>]+>/g, "") // mentions regex
                    .replace(/x(\d+)/g, '$1x')
                    .replace(/ and /g, " & ")
                    .replace(/^\s*[-*+]\s+/gm, "") // remove lists from mkdwn
                    .trim()
                    .replace(/\b(\d+)\s*x?\s*\b/g, '$1x ')
                    .replace(/\b(\d+)\s*x?\b\s*(.*?)\s*/g, '$1x $2, ')
                    .split(/(?:(?:, )|(?:\n)|(?:\s(?=\b\d+x?\b)))/);

                let newParts = [];
                for (let i = 0; i < parts.length; i++) {
                    if (/\d+x/.test(parts[i]) && i < parts.length - 1) {
                        newParts.push(parts[i] + parts[i + 1]);
                        i++;
                    } else if (i < parts.length - 1 && parts[i + 1].endsWith('x ')) {
                        newParts.push(parts[i + 1] + parts[i]);
                        i++;
                    } else {
                        newParts.push(parts[i]);
                    }
                }

                parts = newParts.filter(x => /\dx/.test(x));
                if (!parts.length) return;

                const splitByStock = parts
                    .filter(x => x)
                    .map(part => part
                        .split(/(\b\d+\s*x\b|\bx\s*\d+\b)\s*(.*)/)
                        .map(bystock => {
                    let y = bystock
                    if (/\d/.test(bystock)) {
                        let x_replaced = bystock.replace(/(\d+)x/, '$1')
                        y = parseInt(x_replaced)
                        if (isNaN(y)) y = x_replaced;
                    }
                    return y;
                    }))
                    .map(x => x.filter(y => y))

                for (let part of splitByStock) {
                    part = part.filter(x => x)
                    let nmIndex = part.indexOf(part.find(element => typeof element === 'number'));

                    if (nmIndex == -1 || part.length < 2 || !part.some(x => typeof x == 'string')) { continue; }

                    let updatedAny = false;
                    const boxObj = Object.entries(boxStock);
                    let curPartName = part[~nmIndex & 1].trim().replace(" x2", "")

                    for (const [key, val] of boxObj) {
                        let words = key.split(" ")
                        let x = words, y = words.at(-1);
                        let partText = curPartName.split(' ').filter(x => x)

                        if (partText.slice(0, -1).some(n => matchAny(n, words[0]))) {
                            if (partText[0] == 'magnus' && ['bp', 'receiver', 'reciever', 'barrel'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                break;
                            }
                            else if (partText[0] == 'mag' && ['bp', 'neuroptics', 'blueprint', 'systems', 'chassis'].some(nx => nx.startsWith(partText.at(-1)))) {
                                updatedAny = true
                                boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                break;
                            }
                            else if (partText.length <= 2 ? matchAny(y, partText.at(-1) ?? "00") : (matchAny(x.at(-1) ?? "00", partText.at(-1)) && matchAny(x.at(-2) ?? "00", partText.at(-2)) && matchAny(x.at(-3) ?? "00", partText.at(-3) ?? "00") && matchAny(x.at(-4) ?? "00", partText.at(-4) ?? "00"))) {
                                updatedAny = true
                                boxStock[key] += part[nmIndex]
                                break;
                            }
                        }
                    }

                    if (!updatedAny) { boxStock[curPartName] = part[nmIndex] }
                }
            })
        })
    }))

    const fixedBoxStock = {}
    let jsfile;
    try {
        jsfile = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))
    } catch (error) {
        return;
    }
    const partNames = jsfile.partNames;

    await Promise.all(Object.entries(boxStock).map(async ([part, stock]) => {
        const splitnm = titleCase(part).split(" ")
        let pind = partNames.filter(x => {
            if (splitnm[0] == 'Mag') return x.startsWith('Mag ')
            else if (splitnm[0] == 'Magnus') return x.startsWith('Magnus')
            else return splitnm.length > 2 ? (x.startsWith(splitnm[0]) && matchAny(x.split(" ")[1], splitnm[1]) && matchAny(x.split(" ")[2], splitnm[2]) && matchAny(x.split(" ")[3], splitnm[3])) : x.startsWith(splitnm[0])
        })
        .filter(y => y.split(' ').slice(1).some(
            z => splitnm.slice(1).some(p => z === "BP" ? z === p : z.startsWith(p == 'BP' ? 'BP' : p.slice(0, -1)))))

        if (pind.length > 1) {
            let numMatch = 0;
            pind.map(x => {
                x.split(' ').some(y => splitnm.includes(y) ? numMatch++ : false)
                if (numMatch == splitnm.length) {
                    pind = [ x ]
                    return;
                }
            })
        }

        if (!pind.length) return;
        if (pind[0].includes('x2')) {
            fixedBoxStock[pind.join(" ").replace(" x2", "")] = Math.floor(stock/2);
        } else {
            fixedBoxStock[pind.join(" ")] = stock;
        }
    }))

    client.lastboxupdate = new Date().getTime();
    client.boxData = fixedBoxStock;
    return fixedBoxStock;
}

const INTACTRELIC = "1193415346229620758"
const RADDEDRELIC = "1193414617490276423"

function parseStringToList(str) {
    const regex = /(\d+x).*( Axi|Meso|Neo|Lith) ([A-Z]\d+)/g;
    const matches = str.matchAll(regex);
    return matches || [];
}

export async function retrieveSoupStoreRelics(client) {
    let boxID = '1193067569301684256';

    const boxChannel = await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) {
        logger.warn(`No Threads channel found; failed to update Soup Store`)
        return [];
    }

    const relicsMegaJSON = []

    const relicStuff = (await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data/RelicData.json')))).relicData
    const positions = ['intact', 'radded']

    await Promise.all(
        [INTACTRELIC, RADDEDRELIC].map(async (RELICSTORE, i) => {
            await boxChannel.fetch(RELICSTORE).then(async (thread) => {
                if (!thread.messageCount) return;
                const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })
                messages.map(/** * @param {Message} msg **/async (msg) => {
                    const Relics = [...parseStringToList(msg.content)].map(x => x[0].replace(/\[0m/g, '').replace(/\[(2;)?34m/g, '').split(/\s*\| /g))
                    if (!Relics.length) return;
                    const authorID = msg.author.id
                    const authorName = msg.author.displayName
                    const authorLink = msg.url

                    const soupInfo = []
                    for (const relic of Relics) {
                        const info = relicStuff.find(x => x.name === relic[1])
                        if (!relic) continue;
                        soupInfo.push({ relic: relic[1], howmany: parseInt(relic[0].replace('x', '')), has: [...new Set(info.parts.filter(x => x).map(y => y.replace(" x2", "")))] })
                    }

                    relicsMegaJSON.push({
                        ID: authorID, link: authorLink, name: authorName, type: positions[i],
                        relics: Relics, parts: soupInfo
                    })
                })
            })
        })
    )

    return relicsMegaJSON;
}