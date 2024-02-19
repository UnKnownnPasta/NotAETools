const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
const path = require('node:path')
const fs = require('node:fs')
const { loadFiles, info, relicExists, titleCase } = require('./data/scripts/utility.js')

// Initialize client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ] 
});

setInterval(async () => {
	await require('./data/scripts/dbcreate.js').loadAllRelics()
	info('INTRVL', 'Refreshed relic data from google sheets.')
}, 300_000);

// Load all commands
client.treasury = loadFiles('./treasury');
client.farmers = loadFiles('./farmers');
client.buttons = loadFiles('./events/buttons')
info('STRTUP', 'Loaded command files.')

// Load all event listeners
const eventsPath = path.join(__dirname, './events/listeners');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.listen(client, ...args));
	} else {
		client.on(event.name, (...args) => event.listen(client, ...args));
	}
	info('STRTUP', `Loaded ${event.name} listener.`)
}

// Login
;(async () => {
	await client.login(process.env.TOKEN)
	await client.guilds.fetch({ force: true })
	info(`${client.user.username}`, `Online at ${new Date().toLocaleString()}; Cached ${client.guilds.cache.size} guilds.`)
})();