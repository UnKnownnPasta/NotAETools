require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })

// Circular dependency, has to be fetched seperately
const CollectionBoxFetcher = require('./core/managers/boxFetch.js')
const { InteractionCreateListener, MessageCreateListener } = require('./core/managers/discordEvents.js')
const GoogleSheetManager = require('./core/managers/googleFetch.js')
const Database = require('./database/init.js')
const CommandHandler = require('./core/managers/fileHandler.js')

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

        this.clearLogs()
        this.constructManagers()
    }

    async constructManagers() {
        // Creating database
        await Database.authenticate();
        Database.defineModels();
        await Database.syncDatabase(false);

        // Logging in
        await this.client.login(process.env.TOKEN)

        // Commands
        CommandHandler.setClient(this.client)
        CommandHandler.loadAll()

        // Event Listeners
        this.intListen = new InteractionCreateListener(this.client)
        this.msgListen = new MessageCreateListener(this.client)

        // Updating database
        this.client.once(Events.ClientReady, async () => {
            this.client.user.setPresence({ activities: [{ name: 'The Future 🌌', type: ActivityType.Watching }], status: 'dnd' });
            logger.info({ message: 'logged in as ' + this.client.user.username })
            // await GoogleSheetManager.startAsync();
            // await CollectionBoxFetcher(this.client);
        })
    }

    async clearLogs() {
        await Promise.all([
            fs.truncate(path.join(__dirname, 'storage', 'combined.log'), 0),
            fs.truncate(path.join(__dirname, 'storage', 'error.log'), 0)
        ])
    }
}

module.exports = new AETools()
