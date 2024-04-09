require('dotenv').config()
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger.js');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const commands = [];
const treasuryFolder = path.join(__dirname, '..', 'treasury');

for (const file of fs.readdirSync(treasuryFolder)) {
	const filePath = path.join(treasuryFolder, file);
	if (!filePath.endsWith(".js")) continue;
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	}
}

const farmerFolder = path.join(__dirname, '..', 'farmers');

for (const file of fs.readdirSync(farmerFolder)) {
	const filePath = path.join(farmerFolder, file);
	if (!filePath.endsWith(".js")) continue;
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		logger.info(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENTID, process.env.MAINGUILDID),
			{ body: commands },
		);

		logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (err) {
		logger.info(err.title, 'Deploy js failed')
	}
})();