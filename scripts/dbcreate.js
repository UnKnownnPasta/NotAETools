const { google } = require('googleapis');
const { spreadsheet, collectionBox, dualitemslist } = require('../data/config.json');
const { titleCase } = require('./utility');
const { Client, ThreadChannel, Message } = require('discord.js');

const logger = require('./logger');
const fs = require('node:fs/promises');
const path = require('node:path');

const farmerdata = async () => {
    const readData = await fs.readFile(path.join(__dirname, '../data/farmers.json'))
    return await JSON.parse(readData)
}

const googleSheets = async ({ spreadsheetId, range }) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheetId,
        range: range,
    });
}

const range = (num) => 
    num >= 0 && num <= 9 ? 'ED'
    : num > 9 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : '';

async function getAllRelics() {
    const sheetValues = await googleSheets({ 
        spreadsheetId: spreadsheet.personal.id,
        range: 'Sheet1' + spreadsheet.personal.ranges.relic,
    })
    .catch((err) => {
        logger.error(err, 'Error fetching items and stock, using google client')
    })

    const values = sheetValues.data.values;
    if (values[0] === "#ERROR!" || values[0]?.[0] === "#ERROR!") return console.log(`Error fetching items: Items have invalid values (#ERROR!)`);

    if (values && values?.length) {
        const allRelicData = [];
        const allRelicNames = [];
        const allPartNames = [];

        for (const row of values) {
            let tokens = parseInt(row[1]);
            if (isNaN(tokens)) tokens = 0;

            const name = row[2];
            const parts = [];
            const rewards = [];
            const vaulted = row[0] === 'TRUE' ? true : false;

            for (const item of row.slice(3)) {
                let [part, stock] = item.split(' | ');
                if (part.endsWith('Prime')) part = part.replace(' Prime', ' BP');
                part = part.replace(' and ', ' & ');
                parts.push(part !== 'Forma' ? part : null);
                if (part !== 'Forma') {
                    allPartNames.push(part)
                }
                if (part.includes('x2')) stock = parseInt(stock) / 2 | 0;
                rewards.push({ item: part, stock: stock, color: part !== 'Forma' ? range(parseInt(stock)) : '' });
            }
            allRelicData.push({ name, parts, rewards, tokens, vaulted });
            allRelicNames.push(name);
        }

        const JSONData = { relicData: allRelicData, relicNames: allRelicNames, partNames: allPartNames }
        await fs.writeFile(path.join(__dirname, '..', 'data', 'RelicData.json'), JSON.stringify(JSONData))
    }
}

async function getAllUserData(key=null) {
    if (!key) return [];

    if (key === 'treasury') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.treasury.id,
            range: spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1] }
        })
        return workOnData;
    } else if (key === 'farmer') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.farmer.id,
            range: spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: data.at(7) ? `${data[6]} (${data[7]})` : data[6] }
        })
        if (!workOnData?.length) return await farmerdata();
        return workOnData;
    } else if (key === 'leaderboard') {
        return await googleSheets({
            spreadsheetId: '1Mrp2qcFY9CO8V-MndnYCkkVBJ-f_U_zeK-oq3Ncashk',
            range: 'Leaderboard!D30:I'
        }).then((re) => {
            return re.data.values.map((data) => {
                if (data.filter(x => !x).length > 1) return;
                const run = isNaN(parseInt(data[4])) ? 0 : parseInt(data[4])
                const rad = isNaN(parseInt(data[3])) ? 0 : parseInt(data[3])
                const merch = isNaN(parseInt(data[2])) ? 0 : parseInt(data[2])
                const userid = data[1].replace('ID: ', '')
                return { uid: userid === '' ? '000000' : userid, name: !data[0] ? '#NF!' : data[0], all: run + rad + merch, run, rad, merch }
            }).filter(x => x)
        })
    } else {
        return undefined;
    }
}

async function getAllClanData(clan=undefined) {
    if (!clan) {
        return await Promise.all(Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
            const clandata = await googleSheets({
                spreadsheetId: spreadsheet.farmer.id,
                range: spreadsheet.farmer.resourceName + key[1]
            })
            if (!clandata) return {}
    
            let localist = {};
            await Promise.all(clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' }))
            return { clan: key[0], resource: localist };
        }))
        .then(async (results) => {
            return results.filter(res => res);
        })
        .catch(error => {
            logger.error(error, 'Error fetching sheet values for clans');
        });
    } else {
        const clandata = await googleSheets({
            spreadsheetId: spreadsheet.farmer.id,
            range: spreadsheet.farmer.resourceName + spreadsheet.farmer.ranges.resource[clan]
        })
        if (!clandata) return {}

        let localist = {};
         clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' })
        return { clan: clan, resource: localist };
    }
}

/**
 * @param {Client} client 
 */
async function getAllBoxData(client) {
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
                    .replace(/<@!?[^>]+>/g, "")
                    .replace(/x(\d+)/g, '$1x')
                    .replace(/ and /g, " & ")
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
    const jsfile = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))
    const partNames = jsfile.partNames;

    await Promise.all(Object.entries(boxStock).map(async ([part, stock]) => {
        const splitnm = titleCase(part).split(" ")
        let pind = partNames.filter(x => {
            if (splitnm[0] == 'Mag') return x.startsWith('Mag ')
            else if (splitnm[0] == 'Magnus') return x.startsWith('Magnus')
            else return splitnm.length > 2 ? (x.startsWith(splitnm[0]) && matchAny(x.split(" ")[1], splitnm[1]) && matchAny(x.split(" ")[2], splitnm[2]) && matchAny(x.split(" ")[3], splitnm[3])) : x.startsWith(splitnm[0])
        })
        .filter(y => y.split(' ').slice(1).some(
            z => splitnm.slice(1).some(p => z === "BP" ? z === p : z.startsWith(p == 'bp' ? 'BP' : p.slice(0, -1)))))

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
    // await fs.writeFile(path.join(__dirname, '..', 'data', 'BoxData.json'), JSON.stringify(fixedBoxStock))
}

const INTACTRELIC = "1193415346229620758"
const RADDEDRELIC = "1193414617490276423"

function parseStringToList(str) {
    // const regex = /\d+x\s*\|\s*[^\|]+?\s*\|\s*\d+\s*ED\s*\|\s*\d+\s*RED\s*\|\s*\d+\s*ORANGE/g;
    const regex = /(\d+x).*( Axi|Meso|Neo|Lith) ([A-Z]\d+)/g;
    const matches = str.matchAll(regex);
    return matches || [];
}

async function retrieveSoupStoreRelics(client) {
    let boxID = '1193067569301684256';

    const boxChannel = await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) return logger.warn(`No Threads channel found; failed to update Soup Store`)

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
    // await fs.writeFile(path.join(__dirname, '..', 'data/SoupData.json'), JSON.stringify(relicsMegaJSON))
}

module.exports = { getAllClanData, getAllUserData, getAllRelics, getAllBoxData, retrieveSoupStoreRelics }