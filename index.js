const bot = require('./src/bot.js')

bot.settings['anti_crash'] = true;
bot.settings['fetch_guilds'] = false;
bot.settings['deploy_commands'] = false;

;(async () => {
	await bot.startDatabase();
	await bot.createListeners();
	await bot.createCommands();
	await bot.start();
})()