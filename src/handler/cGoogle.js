const { google } = require('googleapis');
const auth = require('google-auth-library');
const { department, collectionBox } = require('../data/config.json');
const logger = require("../utility/bLog.js");
const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
const database = require('../handler/cDatabase');
const { titleCase } = require('../utility/bHelper.js');

const credentials = {
    client_email: process.env.GOOGLE_EMAIL,
    private_key: process.env.GOOGLE_KEY.replace(/\\n/g, '\n')
};

const client = new auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const googleSheets = google.sheets({ version: 'v4', auth: client });

const range = (num) => 
    num >= 0 && num <= 7 ? 'ED'
    : num > 7 && num <= 15 ? 'RED'
    : num > 15 && num <= 31 ? 'ORANGE'
    : num > 31 && num <= 64 ? 'YELLOW'
    : num > 64 ? 'GREEN' : 'UNKNOWN';

async function getAllPartsStock() {
    const sheetValues = await googleSheets.spreadsheets.values.get({ 
        spreadsheetId: department.treasury.sheetId,
        range: department.treasury.relicName + department.treasury.ranges.relic,
    })
    .catch((err) => {
        logger.error(err, 'Error fetching items and stock, using google client')
    })

    const values = sheetValues.data.values;
    if (values.some(x => x[0] == '#ERROR!')) return logger.warn(`Error fetching items: Items have invalid values (#ERROR!)`);

    const itemStockRegex = /\[(.+?)\]/;
    const itemNameRegex = /(.*?)(?:\s+\[)/

    if (values && values?.length) {
        const allPartsData = []
        await Promise.all(values.map(async (record) => {
            const onlyParts = record.slice(1, 7);
            await Promise.all(onlyParts.map((item) => {
                let itemStock = item.match(itemStockRegex)?.[1]
                let itemName = item.match(itemNameRegex)?.[1]
                
                if (itemStock && !allPartsData.find((itm) => itm.name == itemName)) {
                    allPartsData.push({ name: `${itemName}`, stock: itemStock, color: range(parseInt(itemStock)) })
                }
                return;
            }))
        }));
        
        await database.models.Items.bulkCreate(allPartsData, { updateOnDuplicate: ['stock', 'color'] });
    }
}

async function getAllUserData() {
    const [TreasIDValues, FarmerIDValues] = await Promise.all([
        googleSheets.spreadsheets.values.get({
            spreadsheetId: department.treasury.sheetId,
            range: department.treasury.useridName + department.treasury.ranges.users,
        }),
        googleSheets.spreadsheets.values.get({
            spreadsheetId: department.farmer.sheetId,
            range: department.farmer.useridName + department.farmer.ranges.users,
        })
    ])
    
    const [TreasData, FarmData] = await Promise.all([
        TreasIDValues.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1] }
        }),
        FarmerIDValues.data.values.filter(val => val.length).map((data) => {
            return { uid: data[0], name: data[1], tokens: data[2], bonus: data[3], spent: data[4], left: data[5], playtime: data[6] }
        })
    ])

    await Promise.all([
        database.models.Treasurers.bulkCreate(TreasData, { updateOnDuplicate: ['name'] }),
        database.models.Farmers.bulkCreate(FarmData, { updateOnDuplicate: ['name', 'tokens', 'bonus', 'spent', 'left', 'playtime'] }),
    ]);
}

async function getAllClanData() {
    await Promise.all(Object.entries(department.farmer.ranges.resource).map(async (key) => {
        const clandata = await googleSheets.spreadsheets.values.get({
            spreadsheetId: department.farmer.sheetId,
            range: department.farmer.resourceName + key[1]
        })
        if (!clandata) return {}

        let localist = {};
        await Promise.all(clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' }))
        return { clan: key[0], resource: localist };
    }))
    .then(async (results) => {
        await database.models.Resources.bulkCreate(results.filter(res => res), { updateOnDuplicate: ['resource'] })
    })
    .catch(error => {
        logger.error(error, 'Error fetching clan resources data')
    });
}

async function updateAllRelics() {
    const relicfile = await fs.readFile(path.join(__dirname, '..', 'data', 'Relics.json'))
    const relicdata = await JSON.parse(relicfile)

    const allRelicsData = []
    const getrarity = (percent) => percent == 25.33 ? "Common" : percent == 11 ? "Uncommon" : percent == 2 ? "Rare" : "Unknown"

    await Promise.all(relicdata.map((relic) => {
        let tempobj = {}
        tempobj["relic"] = relic.name
        tempobj["vaulted"] = relic.vaultInfo.vaulted
        tempobj["rewards"] = relic.rewards.sort((a, b) => b.chance - a.chance).map(part => {
            return { "part": part.item.name, "rarity": getrarity(part.chance) }
        })
        allRelicsData.push(tempobj)
    }))

    await database.models.Relics.bulkCreate(allRelicsData, { updateOnDuplicate: ['vaulted', 'rewards'] })
}

/**
 * @param {Client} client 
 */
async function getAllBoxData(client) {
    const boxChannel =  await client.channels.cache.get(collectionBox.testid).threads;
    const boxStock = {}

    const matchAny = (a, b) => a.startsWith(b) || b.startsWith(a)
    
    await Promise.all(Object.entries(collectionBox.testchannels).map(async ([chnl, cid]) => {

        await boxChannel.fetch(cid).then(/*** @param {ThreadChannel} thread */ async (thread) => {

            const messages = await thread.messages.fetch({ limit: thread.messageCount, cache: false })

                await Promise.all(messages.map(async (msg) => {
                    let parts = msg.content
                        .toLowerCase()
                        .replace(/\s+/g, ' ')
                        .replace(/\s*prime\s*/, ' ')
                        .replace(/\(.*?\)/g, "")
                        .replace(/<@!?[^>]+>/g, "")
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

                    parts = newParts.filter(x => /\dx/.test(x) && !/[^\w\s]/.test(x));

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
                    }));

                    await Promise.all(splitByStock.map((part) => {
                        part = part.filter(x => x)
                        let nmIndex = part.indexOf(part.find(element => typeof element === 'number'));

                        if (nmIndex == -1 || part.length < 2 || !part.some(x => typeof x == 'string')) { return; }

                        let updatedAny = false;
                        const boxObj = Object.entries(boxStock);
                        let curPartName = part[~nmIndex & 1].trim()

                        for (const [key, val] of boxObj) {
                            let words = key.split(" ")
                            let x = words[0], y = words.at(-1);
                            let partText = curPartName.split(' ').filter(x => x)

                            if (partText.slice(0, -1).some(n => matchAny(n, x))) {
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
                                else if (matchAny(y, partText.at(-1))) {
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
            else return x.startsWith(splitnm[0])
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
            fixedBoxStock[pind.join(" ")] = Math.floor(stock/2);
        } else {
            fixedBoxStock[pind.join(" ")] = stock;
        }
    }))

    // const newObject = []
    // for (const [key, value] of Object.entries(fixedBoxStock)) {
    //     newObject.push({ name: key, stock: parseInt(value) })
    // }

    await fs.writeFile(path.join(__dirname, '..', 'data', 'BoxData.json'), JSON.stringify(fixedBoxStock))
}

module.exports = { getAllPartsStock, getAllUserData, getAllClanData, updateAllRelics, getAllBoxData }