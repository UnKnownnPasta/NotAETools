const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
const path = require('node:path')
const fs = require('node:fs')
const { loadFiles, info, refreshFissures,warn } = require('./scripts/utility.js')
const { loadAllRelics, getAllClanData, getAllUserData } = require('./scripts/dbcreate.js');

process.on('uncaughtException', (err) => {
	warn(`anti crash`, err.stack, err)
});

// Initialize client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

let intrv_count = 0
setInterval(async () => {
	await loadAllRelics();
	await getAllUserData();
	await refreshFissures(client);
	intrv_count++
	if (intrv_count%20 == 0) info(`INTRVL`, `${intrv_count} intervals done.`)
}, 300_000);
setInterval(async () => {
	await getAllClanData();
	intrv_count++
}, 250_000);

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
	await client.login(process.env.TOKEN);
	await client.guilds.fetch();
	info(`${client.user.username}`, `Online at ${new Date().toLocaleString()}; Cached ${client.guilds.cache.size} guilds.\n-----`);
	refreshFissures(client)
})();