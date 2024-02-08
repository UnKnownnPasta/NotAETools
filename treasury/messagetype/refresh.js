const { Client, Message } = require('discord.js')
const { google } = require('googleapis');
const { err, alert } = require('../../data/utils');
const fs = require('node:fs')

module.exports = {
    name: ['refresh'], 
    /**
    * Refresh all stored data (relics and userids)
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {

        const m = message.channel.send({ content: `Refreshing..\n[-] Relic Data\n[-] User ids` })
        await fetchAllPrimeParts("!A2:H")
        ;(await m).edit({ content: `[+] Relic Data\n[-] User ids` })
        await fetchUserIds("!B2:C")
        ;(await m).edit({ content: `Completed.\n[+] Relic Data\n[+] User ids` })
    }
}

async function fetchUserIds(range) {
    try {
        const response = await google.sheets("v4").spreadsheets.values.get({
            auth: process.env.GOOGLEAPIKEY,
            spreadsheetId: "1Fv0SCmBalcT-DNo02F4Q1CiX_Np6Q7vsmuVO6c2PiPY",
            range: "Directory" + range,
        });

        const values = response.data.values;

        if (values && values.length > 0) {
            fs.writeFileSync('./data/userids.json', JSON.stringify(values.filter(x => x.length != 0)))
        } else {
            alert('Google Error', 'Could not fetch any user ids.')
        }
    } catch (error) {
        err(error, `Error fetching userids`);
    }
}

async function fetchAllPrimeParts(range) {
    try {
        const response = await google.sheets("v4").spreadsheets.values.get({
            auth: process.env.GOOGLEAPIKEY,
            spreadsheetId: "1Fv0SCmBalcT-DNo02F4Q1CiX_Np6Q7vsmuVO6c2PiPY",
            range: "Tracker - LIVE" + range,
        });

        const values = response.data.values;

        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
          
        function rgbToHex(r, g, b) {
            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }

        if (values && values.length > 0) {
            // Fetch background colors separately
            const backgroundResponse = await google.sheets("v4").spreadsheets.get({
                auth: process.env.GOOGLEAPIKEY,
                spreadsheetId: "14Lxib9u73S8lGJjbWrgiXXhfP3NFyzbH_aqh-gwMyn8",
                ranges: ["relics" + range],
                includeGridData: true
            });

            const backgroundGridData = backgroundResponse.data.sheets[0].data[0].rowData;

            const combinedData = values.map((row, rowIndex) => {
                return row.map((cell, columnIndex) => {
                    const backgroundColor = backgroundGridData[rowIndex]?.values[columnIndex]?.effectiveFormat?.backgroundColor || '';
                    return [cell, rgbToHex(backgroundColor.red ? Math.round(backgroundColor.red * 100) : 0, backgroundColor.green ? Math.round(backgroundColor.green * 100) : 0, backgroundColor.blue ? Math.round(backgroundColor.blue * 100) : 0 )];
                });
            });

            fs.writeFileSync('./data/relicdata.json', JSON.stringify(combinedData))
        } else {
            alert(`Google Error`, `No data found for range ${range}.`);
        }
    } catch (error) {
        err(error, `Error fetching data for range ${range}`);
    }
}