require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const fsp = require('node:fs/promises')
const path = require('node:path');
const database = require('./handler/cDatabase');
const { loadFiles } = require('./handler/bHelper');

class AETools {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.MessageContent, 
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers,
            ]
        });

        this.settings = {
            reset_db: false, // c
            deploy_commands: true, // c
            cycle_fissure: false,
            cycle_db: false,
            anti_crash: true, // c
            fetch_guilds: false, // c
        }
    }

    async start() {
        if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });
        if (this.settings.deploy_commands) await this.deploy();

        await this.client.login(process.env.TOKEN)
    	this.client.user.setPresence({ activities: [{ name: 'Zloosh 👒', type: ActivityType.Watching }], status: 'dnd' });
        console.log(`[EVENT] Online.`)
    }

    async startDatabase() {
        await database.authenticate();
        database.defineModels();
        await database.syncDatabase(this.reset_db);
    }

    async createCommands() {
        this.client.treasury = await loadFiles('src/departments/treasury');
        this.client.farmer = await loadFiles('src/departments/farmer');
        this.client.button = await loadFiles('src/events', (fl) => fl.startsWith('btn-'));
        console.log(`[EVENT] Loaded all commands`);
    }

    async createListeners() {
        const eventsPath = [path.join(process.cwd(), 'src/handler/eInteraction.js'), path.join(process.cwd(), 'src/handler/eMessage.js')];
        await eventsPath.map(file => {
            const event = require(file);
            const callback = (...args) => event.listen(this.client, ...args);
            this.client[event.once ? 'once' : 'on'](event.name, callback);
            console.log(`[EVENT] Loaded ${event.name} listener.`);
        });

        if (this.settings.anti_crash) {
            process.on('uncaughtException', (err) => {
                console.log(`[anti crash] :: ${err.name}\n${err.message}`)
            });
            console.log(`[anti crash] :: Startup\nNow active`)
        }
    }

    async deploy() {
        const commands = [];
        const departmentsFolder = path.join(process.cwd(), 'src/departments');
        const commandFolders = fs.readdirSync(departmentsFolder);
        
        for (const dept of commandFolders) {
            const commandsPath = path.join(departmentsFolder, dept);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "execute" property.`);
                }
            }
        }
        const rest = new REST().setToken(process.env.TOKEN);
    
        (async () => {
            try {
                console.log(`Started refreshing ${commands.length} application (/) commands.`);
    
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID),
                    { body: commands },
                );
    
                console.log(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (err) {
                // deployment error
            }
        })();
    }

}

module.exports = new AETools;