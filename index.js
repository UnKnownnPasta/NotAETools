const { AETools } = require('./src/bot.js')

const bot = new AETools();
bot.settings['deploy_commands'] = false;
bot.settings['anti_crash'] = false;

;(async () => {
	await bot.startDatabase();
	await bot.createListeners();
	await bot.createCommands();
	await bot.start();
})()