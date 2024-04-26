const { loadFiles } = require("../../utils/generic");
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const logger = require("../../utils/logger");

class AllHandles {
    constructor() {
        this.client = null;
        this.treasury = null;
        this.farmer = null;
        this.buttons = null;
        this.commandDepartments = new Map();
    }

    setClient(client) {
        this.client = client;
    }

    async reloadTreasury() {
        if (this.client) {
            this.treasury = await loadFiles('core/departments/treasury');
            this.treasury.forEach(command => {
                this.commandDepartments.set(command.name, 'treasury')
            });
        }
    }

    async reloadFarmer() {
        if (this.client) {
            this.farmer = await loadFiles('core/departments/farmer');
            this.farmer.forEach(command => {
                this.commandDepartments.set(command.name, 'farmer')
            });
        }
    }

    async reloadButtons() {
        if (this.client) {
            this.buttons = await loadFiles('core/interactions');
            this.buttons.forEach(command => {
                this.commandDepartments.set(command.name, 'buttons')
            });
        }
    }
    
    getDepartment(dep) {
        const condition = this.commandDepartments.get(dep)
        return this[condition];
    }

    loadAll() {
        this.reloadButtons()
        this.reloadFarmer()
        this.reloadTreasury()
    }
    
    async deployCommands() {
        const commands = [];
        const departmentsFolder = path.join(__dirname, '..', 'departments');
        const commandFolders = fs.readdirSync(departmentsFolder);

        for (const dept of commandFolders) {
            const commandsPath = path.join(departmentsFolder, dept);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if (!command.hasOwnProperty('execute')) logger.warn(`The command at ${filePath} is missing a required "execute" property.`);
                if ('data' in command && command.type === 'slash') {
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
}

module.exports = new AllHandles();
