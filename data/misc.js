const { Client, Message } = require("discord.js");
const fs = require('node:fs/promises');
const path = require('node:path');
const { fetchData } = require("../scripts/dbcreate");

module.exports = {
    name: "misc",
    disabled: false,
    /**
     * Fetch warframe's DO data of latest relics and update them
     * @param {Client} client
     * @param {Message} message
     */
    async execute(client, message) {
        let textMessage = `\`\`\`[1/2] Fetching data...\`\`\``;
        const msg = await message.channel.send(textMessage);
        await fetchData(msg, message);
    }
}