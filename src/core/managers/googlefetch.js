require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') })

const { google } = require('googleapis');
const auth = require('google-auth-library');
const { departments } = require('../../configs/config.json');
const fs = require('node:fs/promises');
const path = require('node:path');
const database = require('../../database/init.js');
const { stockRanges } = require('../../utils/generic.js');

class GoogleSheetFetcher {
    constructor() {
        const credentials = {
            client_email: process.env.GOOGLE_EMAIL,
            private_key: process.env.GOOGLE_KEY.replace(/\\n/g, '\n')
        };
        
        const google_client = new auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        
        this.googleSheets = google.sheets({ version: 'v4', auth: google_client });
    }

    async getPrimeParts() {
        const sheetValues = await googleSheets.spreadsheets.values.get({ 
            spreadsheetId: departments.treasury.google.sheetId,
            range: departments.treasury.google.relicSheetName + departments.treasury.google.ranges.relic,
        })
        .catch((err) => {
            return Promise.reject(0)
        })
    
        const values = sheetValues.data.values;
        if (values.some(x => x[0] == '#ERROR!')) return logger.warn(`Error fetching items: Items have invalid values (#ERROR!)`);
    
        const itemStockRegex = /\[(.+?)\]/;
        const itemNameRegex = /(.*?)(?:\s+\[)/
    
        if (values && values?.length) {
            try {
                const allPartsData = []
                await Promise.all(values.map(async (record) => {
                    const onlyParts = record.slice(1, 7);
                    await Promise.all(onlyParts.map((item) => {
                        let itemStock = item.match(itemStockRegex)?.[1]
                        let itemName = item.match(itemNameRegex)?.[1]
                        
                        if (itemStock && !allPartsData.find((itm) => itm.name == itemName)) {
                            allPartsData.push({ name: `${itemName}`, stock: itemStock, color: stockRanges(parseInt(itemStock)) })
                        }
                        return;
                    }))
                }));
                
                await database.models.Parts.bulkCreate(allPartsData, { updateOnDuplicate: ['stock', 'color'] });
                return Promise.resolve(1)
            } catch (error) {
                return Promise.reject(0)
            }
        }
    }

    async getClanResources() {
        await Promise.all(Object.entries(departments.farmer.google.ranges.resource).map(async (key) => {
            const clandata = await googleSheets.spreadsheets.values.get({
                spreadsheetId: departments.farmer.google.sheetId,
                range: departments.farmer.google.resourceSheetName + key[1]
            })
            if (!clandata) return {}
    
            let localist = {};
            await Promise.all(clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' }))
            return { clan: key[0], resource: localist };
        }))
        .then(async (results) => {
            await database.models.Clans.bulkCreate(results.filter(res => res), { updateOnDuplicate: ['resource'] })
            return Promise.resolve(1)
        })
        .catch(error => {
            return Promise.reject(0)
        });
    }

    async getAllRelics() {
        try {
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
        } catch (error) {
            return Promise.reject(0)
        }
        return Promise.resolve(1)
    }

    async startAsync() {
        return await Promise.all([this.getAllRelics(), this.getClanResources(), this.getPrimeParts()])
    }
}

module.exports = new GoogleSheetFetcher();
