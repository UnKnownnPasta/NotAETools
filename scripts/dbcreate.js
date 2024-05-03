const { google } = require('googleapis');
const { spreadsheet, collectionBox, dualitemslist } = require('../data/config.json');
const { titleCase } = require('./utility');
const { Client, ThreadChannel } = require('discord.js');

const logger = require('./logger');
const fs = require('node:fs/promises');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const googleSheets = async ({ spreadsheetId, range }) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheetId,
        range: range,
    });
}

const range = (num) => 
    num >= 0 && num <= 7 ? 'ED'
    : num > 7 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : '';

async function getAllRelics() {
    const sheetValues = await googleSheets({ 
        spreadsheetId: spreadsheet.treasury.id,
        range: spreadsheet.treasury.relicName + spreadsheet.treasury.ranges.relic,
    })
    .catch((err) => {
        logger.error(err, 'Error fetching items and stock, using google client')
    })

    const values = sheetValues.data.values;
    if (values.some(x => x[0] == '#ERROR!')) return logger.warn(`Error fetching items: Items have invalid values (#ERROR!)`);

    const itemStockRegex = /\[(.+?)\]/;
    const itemNameRegex = /(.*?)(?:\s+\[)/

    if (values && values?.length) {
        const allRelicData = []
        await Promise.all(values.map(async (record) => {
            const pushObj = { name: record[0], parts: [], rewards: [], tokens: record[7] }
            await Promise.all(record.slice(1, 7).map((item) => {
                let itemStock = item.match(itemStockRegex)?.[1]
                let itemName = item.match(itemNameRegex)?.[1]?.replace(' and ', ' & ')
                if (dualitemslist.includes(itemName)) itemName += " x2"
                
                pushObj.parts.push(itemName);
                pushObj.rewards.push({ item: itemName ?? "Forma", stock: itemStock ?? "", color: range(parseInt(itemStock ?? 100)) });
                return;
            }))
            allRelicData.push(pushObj)
        }));

        const [onlyRelics, onlyParts] = await Promise.all([
            [... new Set(allRelicData.map(relic => relic.name).flat())],
            [... new Set(allRelicData.map(relic => relic.parts).flat().map(part => part?.replace(" x2", "")))],
        ])
        const JSONData = { relicData: allRelicData, relicNames: onlyRelics, partNames: onlyParts.filter(p => p) }
        
        await fs.writeFile(path.join(__dirname, '..', 'data', 'RelicData.json'), JSON.stringify(JSONData))
        // await database.models.Items.bulkCreate(allRelicData, { updateOnDuplicate: ['stock', 'color'] });
    }
}

async function getAllUserData() {
    const [TreasIDValues, FarmerIDValues] = await Promise.all([
        googleSheets({
            spreadsheetId: spreadsheet.treasury.id,
            range: spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids,
        }),
        googleSheets({
            spreadsheetId: spreadsheet.farmer.id,
            range: spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users,
        })
    ])
    
    const [TreasData, FarmData] = await Promise.all([
        TreasIDValues.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1] }
        }),
        FarmerIDValues.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: (data.at(7) ? `${data[7]} (${data[6]})` : data[6]) }
        })
    ])

    await Promise.all([
        // database.models.Treasurers.bulkCreate(TreasData, { updateOnDuplicate: ['name'] }),
        // database.models.Farmers.bulkCreate(FarmData, { updateOnDuplicate: ['name', 'tokens', 'bonus', 'spent', 'left', 'playtime'] }),
        fs.writeFile(path.join(__dirname, '..', 'data', 'TreasuryData.json'), JSON.stringify(TreasData)),
        fs.writeFile(path.join(__dirname, '..', 'data', 'FarmerData.json'), JSON.stringify(FarmData)),
    ]);
}

async function getAllClanData() {
    await Promise.all(Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
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
        // await database.models.Resources.bulkCreate(results.filter(res => res), { updateOnDuplicate: ['resource'] })
        await fs.writeFile(path.join(__dirname, '..', 'data', 'ClanData.json'), JSON.stringify(results.filter(res => res)))
    })
    .catch(error => {
        logger.error(error, 'Error fetching sheet values for clans');
    });
}

/**
 * @param {Client} client 
 */
async function getAllBoxData(client) {
    let boxID, channelArr;

    if (process.env.NODE_ENV === 'development') {
        boxID = collectionBox.testid
        channelArr = collectionBox.testchannels
    } else {
        boxID = collectionBox.id
        channelArr = collectionBox.channels
    }

    const boxChannel =  await client.channels.cache.get(boxID)?.threads;
    if (!boxChannel) return logger.warn(`No Threads channel found; failed to update box`)
    const boxStock = {}

    const matchAny = (a, b) => (a??"").startsWith(b??"") || (b??"").startsWith(a??"")
    
    await Promise.all(Object.entries(channelArr).map(async ([chnl, cid]) => {

        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {

            const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })

                await Promise.all(messages.map(async (msg) => {
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

                    await Promise.all(splitByStock.map((part) => {
                        part = part.filter(x => x)
                        let nmIndex = part.indexOf(part.find(element => typeof element === 'number'));

                        if (nmIndex == -1 || part.length < 2 || !part.some(x => typeof x == 'string')) { return; }

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
                                    return;
                                }
                                else if (partText[0] == 'mag' && ['bp', 'neuroptics', 'blueprint', 'systems', 'chassis'].some(nx => nx.startsWith(partText.at(-1)))) {
                                    updatedAny = true
                                    boxStock[curPartName] = (boxStock[curPartName] ?? 0) + part[nmIndex]
                                    return;
                                }
                                else if (partText.length <= 2 ? matchAny(y, partText.at(-1) ?? "00") : (matchAny(x.at(-1) ?? "00", partText.at(-1)) && matchAny(x.at(-2) ?? "00", partText.at(-2)) && matchAny(x.at(-3) ?? "00", partText.at(-3) ?? "00") && matchAny(x.at(-4) ?? "00", partText.at(-4) ?? "00"))) {
                                    updatedAny = true
                                    boxStock[key] += part[nmIndex]
                                    return;
                                }
                            }
                        }

                        if (!updatedAny) { boxStock[curPartName] = part[nmIndex] }
                    }))
                }))
            //}) // async msg
        })
    }))

    const fixedBoxStock = {}
    const jsfile = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))
    const partNames = [... new Set(jsfile.relicData.map(x => x.parts).flat().filter(x => x))]

    await Promise.all(Object.entries(boxStock).map(async ([part, stock]) => {
        const splitnm = titleCase(part).split(" ")
        let pind = partNames.filter(x => {
            if (splitnm[0] == 'Mag') return x.startsWith('Mag')
            else if (splitnm[0] == 'Magnus') return x.startsWith('Magnus')
            else return splitnm.length > 2 ? (x.startsWith(splitnm[0]) && matchAny(x.split(" ")[1], splitnm[1]) && matchAny(x.split(" ")[2], splitnm[2]) && matchAny(x.split(" ")[3], splitnm[3])) : x.startsWith(splitnm[0])
        })
        .filter(y => y.split(' ').slice(1).some(
            z => splitnm.slice(1).some(p => z.startsWith(p == 'bp' ? 'BP' : p.slice(0, -1)))))
            
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

    await fs.writeFile(path.join(__dirname, '..', 'data', 'BoxData.json'), JSON.stringify(fixedBoxStock))
}

module.exports = { getAllClanData, getAllUserData, getAllRelics, getAllBoxData }