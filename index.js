const path = require("node:path");
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const { Client, GatewayIntentBits, ActivityType, Partials } = require('discord.js');
const fs = require('node:fs')
const { loadFiles, refreshFissures } = require('./scripts/utility.js')
const { getAllBoxData, fetchData } = require('./scripts/dbcreate.js');
const logger = require('./scripts/logger.js');
const { default: mongoose } = require("mongoose");

process.on('uncaughtException', (err) => {
	logger.error(err, `anti crash :: uncaughtException`)
});

// Initialize client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildVoiceStates
    ],
	partials: [
		Partials.Message,
		Partials.User,
		Partials.Channel,
	],
	allowedMentions: { parse: [] },
	presence: { activities: [{ name: 'Zlushiie ❤', type: ActivityType.Watching }], status: 'idle' }
});

client.intrv_count = 0
setInterval(async () => {
	await refreshFissures(client).then(() => {
		client.intrv_count++
		client.fissureLast = new Date().getTime() + 180000
	})
}, 180_000);

// Load all commands
;(async () => {
	[client.treasury, client.farmers, client.buttons] = await Promise.all([
		loadFiles('treasury'), loadFiles('farmers'), loadFiles('events/buttons')
	])
})();
logger.info('[STRTUP] Loaded command files.')

// Load all event listeners
const eventsPath = path.join(__dirname, 'events/listeners');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

eventFiles.forEach(file => {
	const event = require(path.join(eventsPath, file));
	const callback = (...args) => event.listen(client, ...args);
	client[event.once ? 'once' : 'on'](event.name, callback);
	logger.info(`[STRTUP] Loaded ${event.name} listener.`);
});

async function run_mongo() {
	await mongoose.connect(`${process.env.MONGODB_URI}`);
	logger.info("[MONGODB] Successfully connected to MongoDB!");
}

// Login
;(async () => {
	await run_mongo().catch(err => logger.error(err, '[MONGODB] Failed to connect to MongoDB.'));

	client.dofilter = true;
	await client.login(process.env.TOKEN);

	client.fissureLast = new Date().getTime() + 180000
	client.lastboxupdate = new Date().getTime() - 100000

	client.on('ready', async () => {
		logger.info(`[${client.user.username}] Online at ${new Date().toLocaleString()}; Cached ${client.guilds.cache.size} guilds.`);

		const keep_alive = require('./keep_alive.js');

		await client.guilds.fetch({ force: true });
		client.boxData = await getAllBoxData(client)

		console.log('Fetching data..');
		await Promise.all([
			fetchData(),
			refreshFissures(client),
			require('./scripts/deploy.js'),
		])
	})
})();