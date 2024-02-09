const { Client, Message } = require('discord.js')
const { google } = require('googleapis');
const { err, alert } = require('../../data/utils');
const fs = require('node:fs')
const { spreadsheet, dept } = require('../../configs/config.json')

module.exports = {
    name: ['refresh'], 
    /**
    * Refresh all stored data (relics and userids)
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {
        if (message.member.roles.cache.some(role => role.id == dept.roles.treasuryManager) || message.member.roles.cache.some(role => role.id == dept.roles.treasuryMarketHost)) {
            const m = message.channel.send({ content: `Refreshing..\n[-] Relic Data\n[-] User ids` })
            await this.fetchAllPrimeParts("!A2:H")
            ;(await m).edit({ content: `[+] Relic Data\n[-] User ids` })
            await this.fetchUserIds("!B2:C")
            ;(await m).edit({ content: `Completed.\n[+] Relic Data\n[+] User ids` })
        }
    },

    async fetchUserIds(range) {
        try {
            const response = await google.sheets("v4").spreadsheets.values.get({
                auth: process.env.GOOGLEAPIKEY,
                spreadsheetId: spreadsheet.id,
                range: spreadsheet.useridName + range,
            });

            const values = response.data.values;

            if (values && values.length > 0) {
                await fs.promises.writeFile('./data/userids.json', JSON.stringify(values.filter(x => x.length != 0)))
            } else {
                alert('Google Error', 'Could not fetch any user ids.')
            }
        } catch (error) {
            err(error, `Error fetching userids`);
        }
    },

    async fetchAllPrimeParts(range) {
        try {
            const response = await google.sheets("v4").spreadsheets.values.get({
                auth: process.env.GOOGLEAPIKEY,
                spreadsheetId: spreadsheet.id,
                range: spreadsheet.relicName + range,
            });

            const values = response.data.values;

            if (values && values.length > 0) {
                // Fetch background colors separately
                const backgroundResponse = await google.sheets("v4").spreadsheets.get({
                    auth: process.env.GOOGLEAPIKEY,
                    spreadsheetId: spreadsheet.id,
                    ranges: [spreadsheet.relicName + range],
                    includeGridData: true
                });

                const backgroundGridData = backgroundResponse.data.sheets[0].data[0].rowData;

                const combinedData = values.map((row, rowIndex) => {
                    return row.map((cell, columnIndex) => {
                        const backgroundColor = backgroundGridData[rowIndex]?.values[columnIndex]?.effectiveFormat?.backgroundColor || '';
                        const hexColor = `#${(backgroundColor.red ? Math.round(backgroundColor.red * 100) : 0).toString(16).padStart(2, '0')}${(backgroundColor.green ? Math.round(backgroundColor.green * 100) : 0).toString(16).padStart(2, '0')}${(backgroundColor.blue ? Math.round(backgroundColor.blue * 100) : 0).toString(16).padStart(2, '0')}`;
                        return [cell, hexColor];
                    });
                });

                await fs.promises.writeFile('./data/relicdata.json', JSON.stringify(combinedData));
            } else {
                alert(`Google Error`, `No data found for range ${range}.`);
            }
        } catch (error) {
            err(error, `Error fetching data for range ${range}`);
        }
    }
}