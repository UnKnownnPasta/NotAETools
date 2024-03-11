require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const fsp = require('node:fs/promises')
const path = require('node:path');
const database = require('./handler/cDatabase');
const { loadFiles } = require('./handler/bHelper');
const { refreshFissures } = require('./handler/cCycles');
const { getAllUserData, getAllClanData, getAllRelicData } = require('./handler/cWarframe');

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
            sync_with_force: false,
            deploy_commands: true,
            cycle_fissure: true,
            cycle_db: true,
            anti_crash: false, // true in prod
            fetch_guilds: false,
            log_sql: false,
        }
    }

    async start() {
        console.log(`[EVENT] Logging in with following config..`)
        Object.entries(this.settings).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });
        if (this.settings.deploy_commands) await this.deploy();
        if (this.settings.cycle_fissure) await this.cycleFissures();
        await this.refreshDB();

        await this.client.login(process.env.TOKEN)
    	this.client.user.setPresence({ activities: [{ name: 'Zloosh 👒', type: ActivityType.Watching }], status: 'dnd' });
        console.log(`[EVENT] Online.\n  U/N: ${this.client.user.username}\n  ${new Date().toLocaleDateString()}\n  Loaded with ${this.client.guilds.cache.size} guilds active.\n  @ ${new Date().toLocaleString()}\n`)
        if (!this.settings.fetch_guilds) console.log(`[WARNING] Guilds could potentially be uncached as fetch_guilds is false`);
    }

    async startDatabase() {
        await database.authenticate(this.settings.log_sql);
        database.defineModels();
        await database.syncDatabase(this.settings.sync_with_force);
    }

    async createCommands() {
        this.client.treasury = await loadFiles('src/departments/treasury');
        this.client.farmer = await loadFiles('src/departments/farmer');
        this.client.button = await loadFiles('src/events', (fl) => fl.startsWith('btn-'));
        console.log(`[EVENT] Loaded all commands`);
    }

    async cycleFissures() {
        if (!this.settings.cycle_fissure) return;
        setInterval(async () => {
            await refreshFissures(this.client);
        }, 300_000);
    }

    async refreshDB() {
        if (!this.settings.cycle_db) return;
        setInterval(async () => {
            await getAllUserData();
            await getAllClanData();
            await getAllRelicData();
        }, 60_000);
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
            console.log(`[anti crash] :: Now active`)
            process.on('uncaughtException', (err) => {
                console.log(`[anti crash] :: ${err.message}\n${err.stack}`)
                console.error(err)
            });
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
                console.error(err)
            }
        })();
    }

}

module.exports = new AETools;