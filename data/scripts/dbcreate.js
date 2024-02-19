const { google } = require('googleapis')
const { spreadsheet, byhex, dualitemslist } = require('../config.json')
const fs = require('node:fs')

async function loadAllRelics() {
    const sheetValues = await google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.id,
        range: spreadsheet.relicName + spreadsheet.ranges.relic,
    });

    const range = (num) => {
        return num >= 0 && num <= 7 ? 'ED'
               : num > 7 && num <= 15 ? 'RED'
               : num > 15 && num <=31 ? 'ORANGE'
               : 'GREEN'
    }

    const values = sheetValues.data.values;
    if (values.some(x => x[0][0] == '#ERROR!' || x[0][1] == '#ERROR!')) return;

    const pnRegex = /(.+?)\[/,
        pcRegex = /\[(.+?)\]/;


    if (values && values.length) {
        const combinedData = values
        .map((row, rowIndex) => {
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
        const pNames = [... new Set(combinedData.map(relic => relic[0].has).flat())]

        fs.writeFileSync('./data/relicdata.json', JSON.stringify({ relicData: combinedData, relicNames: rNames, partNames: pNames }))
    }
}
loadAllRelics()

module.exports = { loadAllRelics }