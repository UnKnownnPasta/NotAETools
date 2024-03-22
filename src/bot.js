require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const path = require('node:path');
const database = require('./handler/cDatabase');
const { loadFiles } = require('./handler/bHelper');
const { refreshFissures } = require('./handler/cCycles');
const { getAllUserData, getAllClanData, getAllRelicData } = require('./handler/cWarframe');
const logger = require('./handler/bLog.js');
const cDeploy = require('./handler/cDeploy.js');

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
        logger.info("Logging in with following config..");
        Object.entries(this.settings).forEach(([key, value]) => {
            logger.info(`  ${key}: ${value}`);
        });

        setTimeout(async () => {
            logger.info(`Proceeding..`)
            await this.startDatabase();
            await this.createListeners();
            await this.createCommands();

            if (this.settings.deploy_commands) await this.deploy();
            if (this.settings.cycle_fissure) await this.cycleFissures();
            await this.refreshDB();

            await this.client.login(process.env.DISCORD_TOKEN)
            if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });

            this.client.user.setPresence({
                activities: [{ name: "Zloosh 👒", type: ActivityType.Watching }],
                status: "dnd",
            });

            logger.info(`Logged in to Discord\n  U/N: ${this.client.user?.tag ?? this.client.user.username}\n  @ ${new Date().toLocaleString()}\n`)
            
            if (!this.settings.fetch_guilds) logger.warn(`Guilds could potentially be uncached as fetch_guilds is false`);
            else logger.warn(`Recached all Guilds. Current cache size: ${this.client.guilds.cache.size}`);
        }, 2000);
    }

    async startDatabase() {
        logger.info("  [.] Starting up sequelize..")
        await database.authenticate();
        logger.info("  [-] Authenticated")
        database.defineModels();
        logger.info("  [^] Synced Database models")
        await database.syncDatabase(this.settings.sync_with_force);
        logger.info("  [#] Database up to date!")
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

        logger.info("Fissure cycle active!")
    }

    async refreshDB() {
        if (!this.settings.cycle_db) return;

        if (this.settings.sync_with_force) {
            logger.warn("Resetting Tables \`FarmIDs\` \`TreasIDs\`")
            await getAllUserData();
            logger.warn("Resetting Tables \`Resources\`")
            await getAllClanData();
            logger.warn("Resetting Tables \`RelicNames\` \`Relics\` \`Parts\`")
            await getAllRelicData();
        }

        setInterval(async () => {
            try {
                await getAllUserData();
                await getAllClanData();
                await getAllRelicData();
            } catch (error) {
                logger.error(error.stack)
            }
            logger.info("Interval: Updated database")
        }, this.settings.update_interval);

        logger.info("Database refreshing every interval now.")
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
            logger.info(`anti crash active`)
            process.on('uncaughtException', (err) => {
                logger.error(`${err.message}`)
                console.error(err)
            });
        }
    }

    async deploy() {
        await cDeploy();
    }

}

module.exports = new AETools;