const { REST, Routes } = require('discord.js');
const { clientId, guildId } = require('../configs/config.json');
const fs = require('node:fs');
const path = require('node:path');
const { err, success } = require('../functions/utils')

const commands = [];
const treausryFolder = path.join(__dirname, '../treasury/slashtype');

for (const file of fs.readdirSync(treausryFolder)) {
	const filePath = path.join(treausryFolder, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	} else {
		success('WARNING', `The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		success('INFO', `Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		success('INFO', `[INFO] Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		err(error)
	}
})();