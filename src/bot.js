require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') })

// Circular dependency, has to be fetched seperately
const CollectionBoxFetcher = require('./core/managers/boxFetch.js')
const GoogleSheetManager = require('./core/managers/googleHandle.js')
const Database = require('./database/init.js')
const CommandHandler = require('./core/managers/fileHandler.js')
const FissureManager = require('./core/managers/fissures.js')
const IntervalManager = require('./core/managers/intervals.js')
const { InteractionCreateListener, MessageCreateListener } = require('./core/managers/discordEvents.js')

const { GatewayIntentBits, Client, Events, ActivityType } = require('discord.js')
const logger = require('./utils/logger.js')
const fs = require('node:fs/promises')
const path = require('node:path')

class AETools {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers
            ]
        });
        this.resetDB = true;

        logger.info(`Starting...`)

        this.clearLogs()
        this.constructManagers()
        this.anticrash()
    }

    async constructManagers() {
        // Creating database
        await Database.authenticate();
        Database.defineModels();
        await Database.syncDatabase(this.resetDB);

        // Logging in
        await this.client.login(process.env.DISCORD_TOKEN)

        // Commands
        CommandHandler.setClient(this.client)
        CommandHandler.loadAll()
        await CommandHandler.deployCommands();

        // Event Listeners
        this.intListen = new InteractionCreateListener(this.client)
        this.msgListen = new MessageCreateListener(this.client)

        this.client.once(Events.ClientReady, async () => {
            IntervalManager.setClient(this.client)

            this.client.user.setPresence({ activities: [{ name: 'The Future 🌌', type: ActivityType.Watching }], status: 'dnd' });

            // Fissures
            FissureManager.setClient(this.client);
            await FissureManager.refreshGuilds();
            await FissureManager.syncFissures();

            logger.info({ message: 'logged in as ' + this.client.user.username + ` @ ${new Date()}` })
            if (this.resetDB) {
                await GoogleSheetManager.startAsync()
                await CollectionBoxFetcher(this.client)
            }

            await IntervalManager.startIntervals();
        })
    }

    async clearLogs() {
        await Promise.all([
            fs.truncate(path.join(__dirname, 'storage', 'combined.log'), 0,
                (err, d) => { if (err) logger.error('Unexpected error when clearing Logs') }),
            fs.truncate(path.join(__dirname, 'storage', 'error.log'), 0,
                (err, d) => { if (err) logger.error('Unexpected error when clearing Error Logs') })
        ])
    }

    anticrash() {
        process.on('unhandledRejection', (reason, p) => {
            logger.warn(' [antiCrash] :: Unhandled Rejection/Catch');
            logger.info(reason, p);
        });
        process.on("uncaughtException", (err, origin) => {
            logger.warn(' [antiCrash] :: Uncaught Exception/Catch');
            logger.info(err, origin);
        }) 
        process.on('uncaughtExceptionMonitor', (err, origin) => {
            logger.warn(' [antiCrash] :: Uncaught Exception/Catch (MONITOR)');
            logger.info(err, origin);
        });
    }
}

module.exports = new AETools()
