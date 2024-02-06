const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const chalk = require('chalk')
require('dotenv').config()

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages
    ] 
});

// Message Command for treasury
client.treasury = new Collection()
const msgFolder = path.join(__dirname, './treasury/messagetype');

for (const file of fs.readdirSync(msgFolder)) {
    const filePath = path.join(msgFolder, file);
    const command = require(filePath);
    if ('execute' in command) {
        client.msgcommands.set(command.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "execute" property.`);
    }
}
console.log(chalk.bgBlackBright('[INFO]') + ' All message commands loaded')