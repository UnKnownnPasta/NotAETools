const bot = require('./src/bot.js')

// Setup the bot
bot.settings = {
	sync_with_force: false,
	deploy_commands: false,
	cycle_fissure: false,
	cycle_db: false,
	anti_crash: true,
	fetch_guilds: false,
	fissure_interval: 300_000,
	update_interval: 600_000,
}

// Start the bot
;(async () => {
	await bot.start();
})();