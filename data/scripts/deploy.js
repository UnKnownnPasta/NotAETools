require('dotenv').config()
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { info, alert } = require('../utility.js')

const commands = [];
const treausryFolder = path.join(process.cwd(), './treasury');

for (const file of fs.readdirSync(treausryFolder)) {
	const filePath = path.join(treausryFolder, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
	try {
		alert(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationGuildCommands(process.env.CLIENTID, process.env.MAINGUILDID),
			{ body: commands },
		);

		alert(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (infoor) {
		info(infoor.title, 'Deploy js failed')
	}
})();