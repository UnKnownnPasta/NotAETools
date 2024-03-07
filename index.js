const bot = require('./src/bot.js')

bot.settings['deploy_commands'] = false;
bot.settings['anti_crash'] = true;

;(async () => {
	await bot.startDatabase();
	await bot.createListeners();
	await bot.createCommands();
	await bot.start();
})()