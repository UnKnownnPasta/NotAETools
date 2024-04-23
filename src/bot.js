require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') })

const { InteractionCreateListener, MessageCreateListener } = require('./core/managers/discordEvents.js')
const GoogleSheetManager = require('./core/managers/googleFetch.js')
const Database = require('./database/init.js')

const { GatewayIntentBits, Client } = require('discord.js')

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

        this.constructManagers()
    }

    async constructManagers() {
        // Creating database
        await Database.authenticate();
        Database.defineModels();
        await Database.syncDatabase(true);

        // Logging in
        this.client.login(process.env.TOKEN)
        console.log('logged in')

        // Event Listeners
        this.intListen = new InteractionCreateListener(this.client)
        this.msgListen = new MessageCreateListener(this.client)

        // Updating database
        await GoogleSheetManager.startAsync();
    }
}

module.exports = new AETools()
