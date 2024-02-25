const { google } = require('googleapis')
const { spreadsheet, dualitemslist } = require('../data/config.json')
const fs = require('node:fs')

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

async function loadAllRelics(client) {
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
    if (values.some(x => x[0][0] == '#ERROR!' || x[0][1] == '#ERROR!')) return;

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
        await client.SQL.models.Relics.bulkCreate(combedRelicData, { updateOnDuplicate: ["part1", "part2", "part3", "part4", "part5", "part6", ], upsert: true });
        await client.SQL.models.Parts.bulkCreate(pNames, { updateOnDuplicate: ["part"], upsert: true });
        await client.SQL.models.RelicNames.bulkCreate(rNames, { updateOnDuplicate: ["name"], upsert: true });
    }
}

async function getAllUserData(client) {
    // User IDs
    const TreasIDValues = await google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.treasury.id,
        range: spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids,
    });
    const TreasIDs = TreasIDValues.data.values
        .filter(x => x.length !== 0)
        .map(user => { return { "user": user[1], "uid": user[0] } })

    const FarmIDValues = await google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.farmer.id,
        range: spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users,
    });
    const FarmIDs = FarmIDValues.data.values.filter(x => x.length !== 0).map(user => {
        return { "uid": user[0], "name": user[1], "ttltokens": user[2], "bonus": user[3], "spent": user[4], "left": user[5], "playtime": user[6] }
    })

    await client.SQL.models.TreasIDs.bulkCreate(TreasIDs, { updateOnDuplicate: ['user', 'uid'], upsert: true });
    await client.SQL.models.FarmIDs.bulkCreate(FarmIDs, { updateOnDuplicate: ["uid", "name", "ttltokens", "bonus", "spent", "left", "playtime"], upsert: true });
}

function transformArrayToObject(array) {
    const resultObject = {};
  
    array.forEach(element => {
      const { name, amt, short } = element;
      resultObject[name.replace(' ', '')] = { "name": name, "amt": amt, "short": short };
    });
  
    return resultObject;
  }

async function getAllClanData(client) {
    const ClanResources = [];

    const promises = Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
        const clandata = await google.sheets("v4").spreadsheets.values.get({
            auth: process.env.GOOGLEAPIKEY,
            spreadsheetId: spreadsheet.farmer.id,
            range: spreadsheet.farmer.resourceName + key[1],
        });
    
        let localist = [];
        clandata.data.values.forEach(x => localist.push({ name: x[0], amt: x[1], short: x[2] ?? '0' }));
        return { clan: key[0], ...transformArrayToObject(localist) };
    });
    
    await Promise.all(promises)
        .then(async (results) => {
            ClanResources.push(...results);
            await client.SQL.models.Resources.bulkCreate(ClanResources, { updateOnDuplicate: [...Object.keys(client.SQL.models.Resources.getAttributes())] });
        })
        .catch(error => {
            console.error('Error fetching sheet values:', error.message);
        });
}

const { Sequelize } = require('sequelize');
const path = require('node:path');
const { info, warn } = require('./utility');
async function sqlInit() {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(process.cwd(), 'data/database.sqlite'),
        logging: msg => info('SQL', msg)
        // logging: false
    });

    try {
        await sequelize.authenticate();
        info('SQL', 'Connection has been established successfully.');
      } catch (error) {
        warn('SQL', 'Unable to connect to the database:', error);
    }

    require('../models/relics.js')(sequelize);
    require('../models/parts.js')(sequelize);
    require('../models/relicnames.js')(sequelize);
    require('../models/farmerids.js')(sequelize);
    require('../models/resources.js')(sequelize);
    require('../models/treasids.js')(sequelize);
    await sequelize.sync({ force: true });
    return sequelize
}

module.exports = { loadAllRelics, getAllUserData, getAllClanData, sqlInit }