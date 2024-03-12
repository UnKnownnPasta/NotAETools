const bot = require('./src/bot.js')

bot.settings['anti_crash'] = true;
bot.settings['fetch_guilds'] = false;
bot.settings['deploy_commands'] = false;
bot.settings['sync_with_force'] = false;
bot.settings['cycle_fissure'] = false;

;(async () => {
	// Start the bot
	await bot.start();
})();