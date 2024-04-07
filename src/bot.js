require('dotenv').config();
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const path = require('node:path');
const database = require('./handler/cDatabase');
const { loadFiles } = require('./utility/bHelper.js');
const FissureManager = require('./handler/cFissures.js')
const logger = require('./utility/bLog.js');
const cDeploy = require('./handler/cDeploy.js');
const { getAllBoxData, getAllPartsStock, getAllUserData, getAllClanData, updateAllRelics } = require('./handler/cGoogle.js');

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

        this.deps = {
            treasury: {},
            farmer: {},
            button: {}
        }
    }

    async start() {
        logger.info("Logging in with following config..");
        Object.entries(this.settings).forEach(([key, value]) => {
            logger.info(`  ${key}: ${value}`);
        });

        setTimeout(async () => {
            logger.info(`Proceeding..`)
            await this.client.login(process.env.TOKEN)
            this.client.once('ready', async () => {
                await this.startDatabase();
                await this.createListeners();
                await this.createCommands();
    
                await this.refreshDB();
    
                if (this.settings.fetch_guilds) await this.client.guilds.fetch({ force: true });
                if (this.settings.cycle_fissure) await this.cycleFissures();
                if (this.settings.deploy_commands) await cDeploy();
    
                this.client.user.setPresence({
                    activities: [{ name: "Zloosh 👒", type: ActivityType.Watching }],
                    status: "dnd",
                });
    
                logger.info(`Logged in to Discord\n  U/N: ${this.client.user?.tag ?? this.client.user.username}\n  @ ${new Date()}\n`)
                
                if (!this.settings.fetch_guilds) logger.warn(`Guilds could potentially be uncached as fetch_guilds is false; This may conflict with Fissures not being able to load the channel to send fissures in.`);
                else logger.warn(`Recached all Guilds. Current cache size: ${this.client.guilds.cache.size}`);
            })
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
        this.deps.treasury = await loadFiles('departments/treasury');
        this.deps.farmer = await loadFiles('departments/farmer');
        this.deps.button = await loadFiles('events', (fl) => fl.startsWith('btn-'));
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
        if (this.settings.sync_with_force) {
            logger.warn("Resetting Tables \`FarmIDs\` \`TreasIDs\`")
            logger.warn("Resetting Tables \`Resources\`")
            logger.warn("Resetting Tables \`RelicNames\` \`Relics\` \`Parts\`")
            let start = new Date().getTime()
            await Promise.all([getAllPartsStock(), getAllUserData(), getAllClanData(), updateAllRelics()])
            let end = new Date().getTime()
            logger.info(`Database Reset timing: ${end - start}ms`);
        }
        if (!this.settings.cycle_db) return;

        setInterval(async () => {
            try {
                await resetDB()
            } catch (error) {
                logger.error(error, `bot/database: [Error]: Error on updating database in interval`)
            }
        }, this.settings.update_interval);

        logger.info("Database refreshing every interval now.")
        await getAllBoxData(this.client)
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

}

module.exports = new AETools;