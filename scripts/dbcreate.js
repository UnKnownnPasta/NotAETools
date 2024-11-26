const { google } = require('googleapis');
const { spreadsheet, collectionBox, dualitemslist } = require('../data/config.json');
const { titleCase } = require('./utility');
const { Client, ThreadChannel, Message } = require('discord.js');

const logger = require('./logger');
const fs = require('node:fs/promises');
const path = require('node:path');
const axios = require('axios');
const cheerio = require('cheerio');

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

async function searchForDrops(htmlText, searchString) {
    let count = 0;
    let position = 0;

    while (position !== -1) {
        position = htmlText.indexOf(searchString, position);

        if (position !== -1) {
            count++;
            position += searchString.length;
            if (count > 5) return false;
            await new Promise((resolve) => setImmediate(resolve));
        }
    }

    return true;
}


const range = (num) => 
    num >= 0 && num <= 9 ? 'ED'
    : num > 9 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : '';

const normalize = (name) => {
    name = name.replace(/\s+/g, ' ').trim().replace(" Blueprint", "");
    return name.endsWith(" Prime") ? name.replace(" Prime", " Blueprint") : name.replace(" Prime ", " ");
}

async function fetchData(msg, ogmsg) {
    console.time("fetchData");

    const sheetValues = await googleSheets({
        spreadsheetId: spreadsheet.personal.id,
        range: "Sheet2" + "!H2:I",
    }).catch((err) => {
        logger.error(err, "Error fetching items and stock, using google client");
    });

    const sheetValues2 = await googleSheets({
        spreadsheetId: spreadsheet.personal.id,
        range: "Sheet2" + "!A2:C",
    }).catch((err) => {
        logger.error(err, "Error fetching items and stock, using google client");
    });

    const tokenValues = {};
    const values = sheetValues.data.values;
    for (let i = 0; i < values.length; i++) {
        tokenValues[values[i][0]] = parseInt(values[i][1]) || 0;
    }

    const stockValues = {};
    const values2 = sheetValues2.data.values;
    for (let i = 0; i < values2.length; i++) {
        let itemName = normalize(`${values2[i][0] + " " + values2[i][1]}`.replace(" and ", " & ").replace("2X ", "").replace(" Prime Collar", " Prime"));
        const stck = parseInt(values2[i][2]) || 0;
        stockValues[itemName] = dualitemslist.includes(itemName) ? stck / 2 | 0 : stck;
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`[1.5/2] Fetching data...\`\`\`` });
    }

    stockValues["Venka Blades"] = stockValues["Venka Blade"] || 0;
    delete stockValues["Venka Blade"];

    try {
        const url = "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";
        const response = await axios.get(url);

        const htmlText = response.data;
        const extractedHtml = htmlText.match(/<h3 id="relicRewards">.*?<h3 id="keyRewards">/s)?.[0] || "";
        const $ = cheerio.load(extractedHtml);
        const tables = $("table tbody > tr")

        if (msg) {
            await msg.edit({ content: `\`\`\`[2/2] Fetching data...\`\`\`` });
        }

        const relicRewards = await processTables($, tables, msg);
        const allRelicData = await processRelics(relicRewards, stockValues, tokenValues, htmlText, msg);

        await fs.writeFile(path.join(__dirname, '..', 'data', 'RelicData.json'), JSON.stringify(allRelicData))

        if (msg) {
            await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nDONE Updating DB... ✅\`\`\`` });
            ogmsg.react('✔');
        }

        setTimeout(async () => {
            if (msg) {
                await msg.delete();
            }
        }, 4_000);

    } catch (error) {
        console.error("Error fetching relic rewards:", error);
        if (msg) {
            await msg.edit({ content: `Couldn't update database. Error: ${error.message}` });
            ogmsg.react('❌');
        }
        return [];
    } finally {
        console.timeEnd("fetchData");
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function processTables($, data, msg) {
    const relicRewards = [];
    let currentRelic = { rewards: [] };

    await data.each(async (_, row) => {
        const columns = $(row).find("td");
        const textName = $(row).find("th").text().trim();

        if ($(row).hasClass("blank-row")) {
            if (currentRelic.rewards.length > 0) {
                relicRewards.push(currentRelic);
                currentRelic = { rewards: [] };
            }
            await delay(200);
            return;
        }

        if (!currentRelic.name && textName) {
            currentRelic.name = textName;
        }
        if (columns.length >= 2) {
            const reward = {
                name: columns.eq(0).text().trim().replace(" and ", " & ").replace("Kubrow Collar Blueprint", "Blueprint"),
                value: parseFloat(columns.eq(1).text().trim().match(/\((\d+(\.\d+)?)%\)/)?.[1]),
            };
            currentRelic.rewards.push(reward);
        }
        await delay(50);
    });

    if (currentRelic.rewards.length > 0) {
        relicRewards.push(currentRelic);
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`DONE Fetching data...\nCreating Records...\`\`\`` });
    }

    return relicRewards;
}

async function processRelics(relicRewards, stockValues, tokenValues, htmlText, msg) {
    const newRelicRewards = [];
    const allRelicNames = [];
    const allPartNames = [];
    const orderToSortBy = [25.33, 11, 2];

    for (const relic of relicRewards) {
        const trueName = relic.name.split(" ").slice(0, -2).join(" ");
        if (trueName.includes("Requiem")) continue;
    
        const trueType = relic.name.split(" ").slice(-1)[0];
        allRelicNames.push(trueName);

        if (trueType !== "(Intact)") {
            continue;
        } else {
            const newRewards = [];

            for (const reward of relic.rewards) {
                let rewardName = normalize(reward.name.replace(/\s+/g, " ").replace(" and ", " & ").replace("2X ", ""));
                rewardName = rewardName.endsWith(" Prime") ? rewardName.replace(" Prime", " Blueprint") : rewardName;
                const stock = stockValues[rewardName];

                if (!rewardName.includes("Forma")) 
                    allPartNames.push(rewardName);

                newRewards.push({
                    item: `${rewardName}${dualitemslist.includes(rewardName) ? " x2" : ""}`,
                    stock: stock || (rewardName.includes("Forma") ? null : 0),
                    color: range(parseInt(stock) || 0),
                    rarity: parseFloat(reward.value),
                })
            };

            newRelicRewards.push({
                name: trueName,
                rewards: newRewards.sort((a, b) => orderToSortBy.indexOf(a.rarity) - orderToSortBy.indexOf(b.rarity)),
                tokens: tokenValues[trueName],
                vaulted: await searchForDrops(htmlText, trueName),
                parts: newRewards.map((reward) => reward.item.replace(" x2", "")),
            });
        }
    }

    if (msg) {
        await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nUpdating DB...\`\`\`` });
    }

    return { relicData: newRelicRewards, relicNames: [... new Set(allRelicNames)], partNames: [... new Set(allPartNames)] };
}


async function getAllUserData(key=null) {
    if (!key) return [];

    if (key === 'treasury') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.personal.id,
            range: spreadsheet.personal.ranges.treasury,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { name: data[0], uid: data[1]?.replace("ID: ", "") ?? "0" }
        })
        return workOnData;
    } else if (key === 'farmer') {
        const res = await googleSheets({
            spreadsheetId: spreadsheet.personal.id,
            range: spreadsheet.personal.ranges.farmer,
        })
        const workOnData = res.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: data[6] }
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
            const messages = await thread.messages.fetch({ limit: /*thread.messageCount*/100, cache: false })
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

async function retrieveSoupStoreRelics(client) {
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
                const messages = await thread.messages.fetch({ limit: /*thread.messageCount*/100, cache: false })
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

module.exports = { getAllClanData, getAllUserData, getAllBoxData, retrieveSoupStoreRelics, fetchData }