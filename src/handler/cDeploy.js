const logger = require("../utility/bLog.js");
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

module.exports = async () => {
    const commands = [];
    const departmentsFolder = path.join(__dirname, '..', 'departments');
    const commandFolders = fs.readdirSync(departmentsFolder);
    
    for (const dept of commandFolders) {
        const commandsPath = path.join(departmentsFolder, dept);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if (!('execute' in command)) logger.warn(`The command at ${filePath} is missing a required "execute" property.`);
            if ('data' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    try {
        logger.info(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.DEV_GUILD_ID),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (err) {
        logger.error(err)
    }
}