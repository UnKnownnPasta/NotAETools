const bot = require('./src/bot.js')

bot.settings['anti_crash'] = true;
bot.settings['fetch_guilds'] = false;
bot.settings['deploy_commands'] = false;
bot.settings['sync_with_force'] = false;
bot.settings['log_sql'] = (msg) => console.log(`[SQL] ${msg}`);
bot.settings['cycle_fissure'] = false;

;(async () => {
	// Load bot functions
	await bot.startDatabase();
	await bot.createListeners();
	await bot.createCommands();

	// Start the bot
	await bot.start();
})();