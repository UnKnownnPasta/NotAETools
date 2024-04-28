require('dotenv').config({ path: require('node:path').resolve(__dirname, '..', '.env') })

// Circular dependency, has to be fetched seperately
const CollectionBoxFetcher = require('./core/managers/boxFetch.js')
const GoogleSheetManager = require('./core/managers/googleHandle.js')
const Database = require('./database/init.js')
const CommandHandler = require('./core/managers/fileHandler.js')
const FissureManager = require('./core/managers/fissures.js')
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

        this.clearLogs()
        this.constructManagers()
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
        // await CommandHandler.deployCommands();

        // Event Listeners
        this.intListen = new InteractionCreateListener(this.client)
        this.msgListen = new MessageCreateListener(this.client)

        this.client.once(Events.ClientReady, async () => {
            this.client.user.setPresence({ activities: [{ name: 'The Future 🌌', type: ActivityType.Watching }], status: 'dnd' });

            // Fissures
            FissureManager.setClient(this.client);
            await FissureManager.refreshGuilds();
            await FissureManager.syncFissures();

            logger.info({ message: 'logged in as ' + this.client.user.username })
            if (this.resetDB) {
                await Promise.all([GoogleSheetManager.startAsync(), CollectionBoxFetcher(this.client)])
            }
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
}

module.exports = new AETools()
