const { google } = require('googleapis')
const { spreadsheet, byhex } = require('../config.json')
const fs = require('node:fs')

async function loadAllRelics() {
    const sheetValues = await google.sheets("v4").spreadsheets.values.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.id,
        range: spreadsheet.relicName + spreadsheet.ranges.relic,
    });

    const values = sheetValues.data.values;
    if (values.some(x => x[0][0] == '#ERROR!' || x[0][1] == '#ERROR!')) return;

    const cellColors = await google.sheets("v4").spreadsheets.get({
        auth: process.env.GOOGLEAPIKEY,
        spreadsheetId: spreadsheet.id,
        ranges: [spreadsheet.relicName + spreadsheet.ranges.relic],
        includeGridData: true
    });

    if (values && values.length > 0) {
        const backgroundGridData = cellColors.data.sheets[0].data[0].rowData;

        const combinedData = values.map((row, rowIndex) => {
            return row.map((cell, columnIndex) => {
                const backgroundColor = backgroundGridData[rowIndex]?.values[columnIndex]?.effectiveFormat?.backgroundColor || '';
                const hexColor = `#${(backgroundColor.red ? Math.round(backgroundColor.red * 100) : 0).toString(16).padStart(2, '0')}${(backgroundColor.green ? Math.round(backgroundColor.green * 100) : 0).toString(16).padStart(2, '0')}${(backgroundColor.blue ? Math.round(backgroundColor.blue * 100) : 0).toString(16).padStart(2, '0')}`;
                return [cell, hexColor];
            });
        });

        const beautifiedData = combinedData.map(y => {
            y = y.map((x, i) => {
                if (i == 0 || i == 7) {
                    return i == 0 ? { name: y[0][0], tokens: y[7][0] } : undefined;
                }
                let brckt = x[0].indexOf('[') == -1 ? false : x[0].indexOf('[')
                const tillBracket = brckt ? x[0].slice(0, brckt-1) : x[0]
                const fromBracket = brckt ? x[0].slice(brckt+1, -1) : ''
                const rarity = byhex[x[1]]
                return { name: tillBracket, count: fromBracket, type: rarity ?? null }
            })
            return y;
        }).map(x => x.slice(0, 7))

        const rnames = beautifiedData.map(x => { return x[0].name; })
        const pnames = [ ...new Set(beautifiedData
        .map(x => {
            return x.slice(1, 7).map(y => y.name)
        })
        .flat()
        .sort()
        )];

        fs.writeFileSync('./data/relicdata.json', JSON.stringify({ relicData: beautifiedData, relicNames: rnames, partNames: pnames }))
    }
}

module.exports = { loadAllRelics }