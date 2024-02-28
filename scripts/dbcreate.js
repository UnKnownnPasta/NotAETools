const { google } = require('googleapis')
const { spreadsheet, dualitemslist } = require('../data/config.json')
const fs = require('node:fs/promises')

// Google fetch func
const googleFetch = async (id, range) => {
    return google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: id,
        range: range,
    });
}

async function loadAllRelics() {
    const sheetValues = await googleFetch(spreadsheet.treasury.id, spreadsheet.treasury.relicName + spreadsheet.treasury.ranges.relic)
    if (!sheetValues || !sheetValues?.data) return;

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
        const rNames = combinedData.map(relic => relic[0].name)
        const pNames = [... new Set(combinedData.map(relic => relic[0].has).flat().map(relic => relic.replace(' x2', '')))]

        await fs.writeFile('./data/relicdata.json', JSON.stringify({ relicData: combinedData, relicNames: rNames, partNames: pNames }))
    }
}


async function getAllClanData() {
    // User IDs
    const TreasIDValues = await googleFetch(spreadsheet.treasury.id, spreadsheet.treasury.useridName + spreadsheet.treasury.ranges.ids);
    const TreasIDs = TreasIDValues.data.values.filter(x => x.length !== 0).map(user => { return { id: user[0], name: user[1] } })
    if (!TreasIDs || !TreasIDs?.length) return;

    const FarmIDValues = await googleFetch(spreadsheet.farmer.id, spreadsheet.farmer.userName + spreadsheet.farmer.ranges.users);
    const FarmIDs = FarmIDValues.data.values.filter(x => x.length !== 0).map(user => {
        return { id: user[0], name: user[1], ttltokens: user[2], bonus: user[3], spent: user[4], left: user[5], playtime: user[6] }
    })
    if (!FarmIDs || !FarmIDs?.length) return;

    // Clan Resources
    const ClanResources = [];

    const promises = Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
        const clandata = await googleFetch(spreadsheet.farmer.id, spreadsheet.farmer.resourceName + key[1]);
        if (!clandata) return {}

        let localist = [];
        clandata.data.values.forEach(x => localist.push({ name: x[0], amt: x[1], short: x[2] ?? '0' }));
        return { clan: key[0], resources: localist };
    });
    
    await Promise.all(promises)
        .then(async (results) => {
            if (!results || !results?.length || results.some(x => !Object.keys(x).length)) return;
            ClanResources.push(...results);
            await fs.writeFile('./data/clandata.json', JSON.stringify({ treasuryids: TreasIDs, farmerids: FarmIDs, resources: ClanResources }))            
        })
        .catch(error => {
            console.error('Error fetching sheet values:', error.message);
        });
}

module.exports = { loadAllRelics, getAllClanData }