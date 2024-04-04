const { google } = require('googleapis');
const auth = require('google-auth-library');
const { department } = require('../data/config.json');
const logger = require('./bLog');
const fs = require('node:fs/promises');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
const database = require('../handler/cDatabase')

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

async function resetDB() {
    let start = new Date().getTime()
    await Promise.all([getAllPartsStock(), getAllUserData(), getAllClanData(), updateAllRelics()])
    let end = new Date().getTime()
    logger.info(`Database Reset timing: ${end - start}ms`);
}

module.exports = { getAllPartsStock, getAllUserData, getAllClanData, updateAllRelics, resetDB }