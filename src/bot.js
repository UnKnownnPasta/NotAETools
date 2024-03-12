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
const logger = require('./handler/bLog.js')

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
            anti_crash: false,
            fetch_guilds: false,
            fissure_interval: 300_000,
            update_interval: 600_000,
        }
    }

    async start() {
        logger.event("Logging in with following config..");
        Object.entries(this.settings).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        await this.startDatabase();
        await this.createListeners();
        await this.createCommands();

        if (this.settings.deploy_commands) await this.deploy();
        if (this.settings.cycle_fissure) await this.cycleFissures();
        await this.refreshDB();

        await this.client.login(process.env.TOKEN)
        if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });
    	this.client.user.setPresence({ activities: [{ name: 'Zloosh 👒', type: ActivityType.Watching }], status: 'dnd' });
        logger.info(`Online.\n  U/N: ${this.client.user.username}\n  ${new Date().toLocaleDateString()}\n  Loaded with ${this.client.guilds.cache.size} guilds active.\n  @ ${new Date().toLocaleString()}\n`)
        if (!this.settings.fetch_guilds) logger.warn(`Guilds could potentially be uncached as fetch_guilds is false`);
    }

    async startDatabase() {
        logger.info("  [.] Starting up sequelize..")
        await database.authenticate();
        logger.info("  [-] Authenticated")
        database.defineModels();
        await database.syncDatabase(this.settings.sync_with_force);
        logger.info("  [✔] Database up to date!")
    }

    async createCommands() {
        this.client.treasury = await loadFiles('src/departments/treasury');
        this.client.farmer = await loadFiles('src/departments/farmer');
        this.client.button = await loadFiles('src/events', (fl) => fl.startsWith('btn-'));
        logger.info("Loaded commands")
    }

    async cycleFissures() {
        if (!this.settings.cycle_fissure) return;
        setInterval(async () => {
            await refreshFissures(this.client);
        }, this.settings.fissure_interval);
        logger.event("Fissure cycle active!")
    }

    async refreshDB() {
        if (!this.settings.cycle_db) return;
        setInterval(async () => {
            try {
                await getAllUserData();
                await getAllClanData();
                await getAllRelicData();
            } catch (error) {
                logger.error(error.stack)
            }
            logger.event("Interval: Updated database")
        }, this.settings.update_interval);
        logger.event("Database refreshing every interval now.")
    }

    async createListeners() {
        const eventsPath = [path.join(process.cwd(), 'src/handler/eInteraction.js'), path.join(process.cwd(), 'src/handler/eMessage.js')];
        await eventsPath.map(file => {
            const event = require(file);
            const callback = (...args) => event.listen(this.client, ...args);
            this.client[event.once ? 'once' : 'on'](event.name, callback);
            logger.info(`Loaded ${event.name} listener.`);
        });

        if (this.settings.anti_crash) {
            logger.log('anti crash', `active`)
            process.on('uncaughtException', (err) => {
                logger.anticrash(`${err.message}`)
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
                if (!('execute' in command)) logger.warn(`The command at ${filePath} is missing a required "execute" property.`);
                if ('data' in command) {
                    commands.push(command.data.toJSON());
                }
            }
        }
        const rest = new REST().setToken(process.env.TOKEN);
    
        (async () => {
            try {
                logger.event(`Started refreshing ${commands.length} application (/) commands.`);
    
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENTID, process.env.GUILDID),
                    { body: commands },
                );
    
                logger.event(`Successfully reloaded ${data.length} application (/) commands.`);
            } catch (err) {
                console.error(err)
            }
        })();
    }

}

module.exports = new AETools;