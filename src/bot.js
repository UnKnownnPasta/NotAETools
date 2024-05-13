require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') })

// Circular dependency, has to be fetched seperately
const BoxManager = require('./core/managers/boxFetch.js')
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
        this.resetDB = false;

        logger.info(`Starting...`)

        this.client.lastboxupdate = new Date().getTime() - 100000

        this.clearLogs()
        this.constructManagers()
        this.anticrash()
    }

    async constructManagers() {
        try {
            await fs.stat(path.join(__dirname, "storage/database.sqlite"))
        } catch (error) {
            if (error.code === "ENOENT") this.resetDB = true
        }

        // Creating database
        await Database.authenticate();
        Database.defineModels();
        await Database.syncDatabase(this.resetDB);

        // Logging in
        await this.client.login(process.env.DISCORD_TOKEN).catch(err => {
            return console.log(`FATAL: Could not login to discord: ${err.message} \n${err.stack}`)
        })

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
                await BoxManager(this.client)
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
            logger.error(reason, p);
        });
        process.on("uncaughtException", (err, origin) => {
            logger.warn(' [antiCrash] :: Uncaught Exception/Catch');
            logger.error(err, origin);
        }) 
        process.on('uncaughtExceptionMonitor', (err, origin) => {
            logger.warn(' [antiCrash] :: Uncaught Exception/Catch (MONITOR)');
            logger.error(err, origin);
        });
    }
}

module.exports = new AETools()
