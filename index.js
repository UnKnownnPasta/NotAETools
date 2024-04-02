const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const path = require('node:path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const fs = require('node:fs')
const { loadFiles, info, refreshFissures, warn } = require('./scripts/utility.js')
const { loadAllRelics, getAllClanData, getAllBoxData } = require('./scripts/dbcreate.js');

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

fs.truncate(path.join(__dirname, 'data/logs.txt'), (err) => {
    if (err) {
        console.log(`[BOT] Doing fresh start`)
    } else {
        console.log('[BOT] Doing clean start');
    }
});

let intrv_count = 0
setInterval(async () => {
	await refreshFissures(client);
	await getAllBoxData(client);
}, 180_000);

setInterval(async () => {
	await loadAllRelics();
	await getAllClanData();
	intrv_count++
	if (intrv_count%30 == 0) info(`INTRVL`, `${intrv_count} intervals done.`)
}, 300_000);

// Load all commands	
;(async () => {
	client.treasury = await loadFiles('./treasury');
	client.farmers = await loadFiles('./farmers');
	client.buttons = await loadFiles('./events/buttons')
})();
info('STRTUP', 'Loaded command files.')

// Load all event listeners
const eventsPath = path.join(__dirname, 'events/listeners');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

eventFiles.forEach(file => {
	const event = require(path.join(eventsPath, file));
	const callback = (...args) => event.listen(client, ...args);
	client[event.once ? 'once' : 'on'](event.name, callback);
	info('STRTUP', `Loaded ${event.name} listener.`);
});

// Login
;(async () => {
	await client.login(process.env.TOKEN);

	client.on('ready', async () => {
		// await client.guilds.fetch({ force: true });
		// require('./scripts/deploy.js');

		client.user.setPresence({ activities: [{ name: 'Ya mom 👒', type: ActivityType.Watching }], status: 'dnd' });
		info(`${client.user.username}`, `Online at ${new Date().toLocaleString()}; Cached ${client.guilds.cache.size} guilds.\n-----`);

		// await loadAllRelics()
		// await refreshFissures(client);
		// await getAllBoxData(client);
	})
})();