const path = require('node:path');
const { google } = require('googleapis');
const auth = require('google-auth-library');
const { departments } = require('../../configs/config.json');
const { dualitemslist } = require('../../configs/commondata.json')
const fs = require('node:fs/promises');
const database = require('../../database/init.js');
const { range } = require('../../utils/generic.js');
const logger = require('../../utils/logger.js');

class GoogleSheetFetcher {
    constructor() {
        if (process.env.GOOGLE_EMAIL !== "") {
            const credentials = {
                client_email: process.env.GOOGLE_EMAIL,
                private_key: process.env.GOOGLE_KEY.replace(/\\n/g, '\n')
            };
    
            const googleClient = new auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
    
            this.googleSheets = google.sheets({ version: 'v4', auth: googleClient });
            this.email_found = true
        } else {
            this.email_found = false
        }
    }

    async getFromSheet({ spreadsheetId, range }) {
        if (this.email_found) {
            return await this.googleSheets.spreadsheets.values.get({ spreadsheetId, range })
        } else {
            return await google.sheets("v4").spreadsheets.values.get({
                auth: process.env.GOOGLE_APIKEY,
                spreadsheetId: spreadsheetId,
                range: range,
            })
        }
    }

    async getPrimeParts() {
        const sheetValues = await this.getFromSheet({
            spreadsheetId: departments.treasury.google.trackerSheetId,
            range: departments.treasury.google.managerSheetName + departments.treasury.google.ranges.manager
        })
        .catch((error) => {
            console.error(error)
            return Promise.reject(0)
        })

        const values = sheetValues.data.values;
        if (values.some(x => x[0] == '#ERROR!')) return console.error('Error fetching items: Items have invalid values (#ERROR!)');

        if (!values || !values?.length) return Promise.reject(0)

        try {
            const allPartsData = []
            let allPrimeSetNames = []
            await Promise.all(values.map(async (record) => {
                let itemStock = record[2]
                let itemName = `${record[0]} ${record[1]}`
                itemName = itemName.replace(" Prime ", " ").replace(" and ", " & ")
                allPrimeSetNames.push(record[0])

                if (dualitemslist.includes(itemName)) itemStock = parseInt(itemStock) / 2 | 0

                allPartsData.push({ name: `${itemName}`, stock: itemStock, color: range(parseInt(itemStock)) })
            }));
            allPrimeSetNames = [...new Set(allPrimeSetNames)].map(y => { return { name: y.replace(" and ", " & ").replace(" Prime", "") } })

            await Promise.all([
                database.models.Parts.bulkCreate(allPartsData, { updateOnDuplicate: ['stock', 'color'] }),
                database.models.SetNames.bulkCreate(allPrimeSetNames, { updateOnDuplicate: ['name'] })
            ])
            return Promise.resolve(1)
        } catch (error) {
            console.error(error)
            return Promise.reject(0)
        }
    }

    async getClanResources() {
        await Promise.all(Object.entries(departments.farmer.google.ranges.resource).map(async (key) => {
            const clandata = await this.getFromSheet({
                spreadsheetId: departments.farmer.google.sheetId,
                range: departments.farmer.google.resourceSheetName + key[1]
            })
            if (!clandata) return {}

            const localist = {};
            await Promise.all(clandata.data.values.map(cell => localist[cell[0]] = { amt: cell[1], short: cell[2] ?? '0' }))
            return { clan: key[0], resource: localist };
        }))
            .then(async (results) => {
                await database.models.Clans.bulkCreate(results.filter(res => res), { updateOnDuplicate: ['resource'] })
                return Promise.resolve(1)
            })
            .catch(error => {
                console.error(error)
                return Promise.reject(0)
            });
    }

    async getAllRelics() {
        try {
            const relicfile = await fs.readFile(path.join(__dirname, '..', '..', 'storage', 'Relics.json'))
            const relicdata = await JSON.parse(relicfile)

            const allRelicsData = []
            const getrarity = (percent) => percent == 25.33 ? 'Common' : percent == 11 ? 'Uncommon' : percent == 2 ? 'Rare' : 'Unknown'

            await Promise.all(relicdata.map((relic) => {
                const tempobj = {}
                tempobj.relic = relic.name
                tempobj.vaulted = relic.vaultInfo.vaulted
                tempobj.rewards = relic.rewards.sort((a, b) => b.chance - a.chance).map(part => {
                    let partItemName = part.item.name
                    partItemName = partItemName.endsWith("Prime Blueprint") ? partItemName : partItemName.replace(" Blueprint", "")
                    return { part: partItemName.replace(" Prime ", " "), rarity: getrarity(part.chance) }
                })
                allRelicsData.push(tempobj)
            }))

            await database.models.Relics.bulkCreate(allRelicsData, { updateOnDuplicate: ['vaulted', 'rewards'] })
        } catch (error) {
            console.error(error)
            return Promise.reject(0)
        }
        return Promise.resolve(1)
    }

    async getAllTokens() {
        const sheetValues = await this.getFromSheet({
            spreadsheetId: departments.treasury.google.sheetId,
            range: departments.treasury.google.relicSheetName + departments.treasury.google.ranges.relic
        })
        .catch((error) => {
            console.error(error)
            return Promise.reject(0)
        })

        const values = sheetValues.data.values;
        if (values.some(x => x.at(-1) === '#ERROR!')) return console.error('Error fetching items: Items have invalid values (#ERROR!)');

        try {
            const allRelicsData = []
            await Promise.all(values.map((record) => {
                const relic = record[0]
                const tokens = record[7]

                allRelicsData.push({ relic: relic, tokens: tokens })
            }));

            await database.models.Tokens.bulkCreate(allRelicsData, { updateOnDuplicate: ['tokens'] });
            return Promise.resolve(1)
        } catch (error) {
            console.error(error)
            return Promise.reject(0)
        }
    }

    async startAsync() {
        const start = new Date().getTime()
        return Promise.allSettled([this.getAllRelics(), this.getClanResources(), this.getPrimeParts(), this.getAllTokens()])
        .then((results) => {
            const end = new Date().getTime()
            const resolvedCount = results.filter(result => result.status === 'fulfilled').length;
            const rejectedCount = results.filter(result => result.status === 'rejected').length;
            logger.info(`Finished Calls in ${end - start}ms - Resolved: ${resolvedCount}, Rejected: ${rejectedCount}`);
        });
    }
}

module.exports = new GoogleSheetFetcher();
