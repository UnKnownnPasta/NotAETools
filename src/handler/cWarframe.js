const { google } = require('googleapis')
const { department, dualitemslist } = require('../data/config.json')
const fsp = require('node:fs/promises')
const { warn } = require('./bHelper.js')
const database = require('./cDatabase.js')

// Google fetch func
const googleFetch = async (id, range) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: id,
        range: range,
    });
}

function transformToSequelizeModel(fields) {
    const sequelizeModel = {};

    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (i == 0) {
            sequelizeModel.relic = { name: field.name, tokens: field.tokens, has: field.has };
        } else {
            const partKey = `part${i}`;
            sequelizeModel[partKey] = { name: field.name, count: field.count, type: field.type };
        }
    }

    return sequelizeModel;
}

async function loadAllRelics() {
    const sheetValues = await google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.treasury.id,
        range: spreadsheet.treasury.relicName + spreadsheet.treasury.ranges.relic,
    });

    const range = (num) => {
        return num >= 0 && num <= 7 ? 'ED'
               : num > 7 && num <= 15 ? 'RED'
               : num > 15 && num <=31 ? 'ORANGE'
               : num > 31 && num <=64 ? 'YELLOW'
               : 'GREEN'
    }

    const values = sheetValues.data.values;
    if (values.some(x => x[0][0] == '#ERROR!' || x[0][1] == '#ERROR!')) return warn('RLCERR', 'Error when refreshing relic data', `No data found for treasury relics`);

    const pnRegex = /(.+?)\[/,
        pcRegex = /\[(.+?)\]/;

    // list is like [ [{}, {}], [{}, {}], ... ]
    if (values && values.length) {
        const combinedData = values.map((row, rowIndex) => {
            return row
            .slice(0, 7)
            .map((rw, rwi) => {
                let partName, partCount, partRarity;
                const brckt = rw.match(pcRegex)
                if (rwi == 0) {
                    return { name: row[0], tokens: row[7], has: row.slice(1, 7).map(r => {
                        let temp = r.slice(0, r.indexOf('[')-1)
                        if (dualitemslist.includes(temp)) temp += ' x2'
                        return temp
                    }) }
                }
                if (brckt) {
                    partName = rw.match(pnRegex)[1].trim()
                    if (dualitemslist.includes(partName)) partName += ' x2'
                    partCount = rw.match(pcRegex)[1]
                    partRarity = range(parseInt(partCount))
                } else {
                    partName = rw; partCount = ""; partRarity = "";
                }
                return { name: partName, count: partCount, type: partRarity }
            });
        });

        const rNames = combinedData.map(relic => relic[0].name).map(x => { return { name: x } })
        const pNames = [... new Set(combinedData.map(relic => relic[0].has).flat())].map(relic => { return { part: relic.replace(' x2', '') } })

        const combedRelicData = combinedData.map(x => transformToSequelizeModel(x))
        await database.models.Relics.bulkCreate(combedRelicData);
        await database.models.Parts.bulkCreate(pNames);
        await database.models.RelicNames.bulkCreate(rNames);
    }
}

function uniquify(arr) {
    const tempSet = new Set();
    const newArr = arr.filter(user => {
        if (!tempSet.has(user.uid)) {
            tempSet.add(user.uid);
            return true;
        } else {            
            return false;
        }
    });
    return newArr
}

async function getAllUserData(createdb) {
    // User IDs
    const TreasIDValues = await googleFetch(department.treasury.id, department.treasury.useridName + department.treasury.ranges.users);
    const TreasIDs = TreasIDValues.data.values
    .filter(x => x.length !== 0)
    .map(user => { return { uid: user[0], user: user[1] } });
    const uniqueTreasIDs = uniquify(TreasIDs);

    const FarmerIDValues = await googleFetch(department.farmer.id, department.farmer.useridName + department.farmer.ranges.users);
    const FarmIDs = FarmerIDValues.data.values
    .filter(x => x.length !== 0)
    .map(user => { return { uid: user[0], name: user[1], ttltokens: user[2], bonus: user[3], spent: user[4], left: user[5], playtime: user[6] } });
    const uniqueFarmIDs = uniquify(FarmIDs);

    if (createdb) {
        await database.models.TreasIds.bulkCreate(uniqueTreasIDs);
        await database.models.FarmerIds.bulkCreate(uniqueFarmIDs);
    } else {
        await database.models.TreasIds.bulkUpdateIDs(uniqueTreasIDs);
        await database.models.FarmerIds.bulkUpdateFarmInfo(uniqueFarmIDs);
    }
}

async function getAllClanData(createdb) {
    const promises = Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
        const clandata = await googleFetch(spreadsheet.farmer.id, spreadsheet.farmer.resourceName + key[1]);
        if (!clandata) return {}

        let localist = {};
        clandata.data.values.forEach(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' });
        return { clan: key[0], resource: JSON.stringify(localist) };
    });

    
    await Promise.all(promises)
        .then(async (results) => {
            if (createdb) {
                await database.models.Resources.bulkCreate(results);
            } else {
                await database.models.Resources.bulkUpdateResources(results);
            }
        })
        .catch(error => {
            console.error('Error fetching sheet values:', error.message);
        });
}

module.exports = { loadAllRelics, getAllUserData, getAllClanData }
