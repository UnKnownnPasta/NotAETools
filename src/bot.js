require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const path = require('node:path');
const database = require('./handler/cDatabase');
const { loadFiles } = require('./handler/bHelper');
const FissureManager = require('./handler/cFissures.js')
const { getAllPartsStock, getAllUserData, getAllClanData, updateAllRelics } = require('./handler/cGoogle.js')
const logger = require('./handler/bLog.js');
const cDeploy = require('./handler/cDeploy.js');
const { resetDB } = require('./handler/cGoogle.js');

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

            await this.refreshDB();

            await this.client.login(process.env.DISCORD_TOKEN)

            if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });
            if (this.settings.cycle_fissure) await this.cycleFissures();
            if (this.settings.deploy_commands) await this.deploy();

            this.client.user.setPresence({
                activities: [{ name: "Zloosh 👒", type: ActivityType.Watching }],
                status: "dnd",
            });

            logger.info(`Logged in to Discord\n  U/N: ${this.client.user?.tag ?? this.client.user.username}\n  @ ${new Date()}\n`)
            
            if (!this.settings.fetch_guilds) logger.warn(`Guilds could potentially be uncached as fetch_guilds is false; This may conflict with Fissures not being able to load the channel to send fissures in.`);
            else logger.warn(`Recached all Guilds. Current cache size: ${this.client.guilds.cache.size}`);
        }, 2500);
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
        this.client.treasury = loadFiles('departments/treasury');
        this.client.farmer = loadFiles('departments/farmer');
        this.client.button = loadFiles('events', (fl) => fl.startsWith('btn-'));
        logger.info("Loaded commands")
    }

    async cycleFissures() {
        if (!this.settings.cycle_fissure) return;
        const fissureInstance = new FissureManager(this.client);
        await fissureInstance.updateFissure()

        setInterval(async () => {
            await fissureInstance.updateFissure()
        }, this.settings.fissure_interval);

        logger.info("Fissure cycle active!")
    }

    async refreshDB() {
        if (!this.settings.cycle_db) return;

        if (this.settings.sync_with_force) {
            logger.warn("Resetting Tables \`FarmIDs\` \`TreasIDs\`")
            logger.warn("Resetting Tables \`Resources\`")
            logger.warn("Resetting Tables \`RelicNames\` \`Relics\` \`Parts\`")
            await resetDB();
        }

        setInterval(async () => {
            try {
                await Promise.all([getAllPartsStock(), getAllUserData(), getAllClanData(), updateAllRelics()]).then(() => {
                    logger.info("Interval: Updated database")
                })
            } catch (error) {
                logger.error(error, `bot/database: [Error]: Error on updating database in interval`)
            }
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