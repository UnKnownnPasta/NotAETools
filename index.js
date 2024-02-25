const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config()
const path = require('node:path')
const fs = require('node:fs')
const { loadFiles, info, refreshFissures,warn } = require('./scripts/utility.js')
const { loadAllRelics, getAllClanData, getAllUserData, sqlInit } = require('./scripts/dbcreate.js');

process.on('uncaughtException', (err) => {
	warn(`anti crash`, err.name, err)
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
	await loadAllRelics(client);
	await getAllUserData(client);
	await refreshFissures(client);
	await getAllClanData(client);
	intrv_count++
	if (intrv_count%12 == 0) info(`INTRVL`, `${intrv_count} intervals done.`)
}, 50_000);

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
	client.SQL = await sqlInit();
	await loadAllRelics(client);
	await getAllUserData(client);
	await refreshFissures(client);
	await getAllClanData(client);
	await client.login(process.env.TOKEN);
	await client.guilds.fetch();
	info(`${client.user.username}`, `Online at ${new Date().toLocaleString()}; Cached ${client.guilds.cache.size} guilds.\n-----`);
	client.user.setPresence({ activities: [{ name: 'my creator 👒', type: ActivityType.Watching }], status: 'dnd' })
})();