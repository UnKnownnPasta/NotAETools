const { Client, GatewayIntentBits } = require("discord.js");

class BotConst {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.MessageContent, 
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMembers
            ],
        });

        // Initialize feature flags
        this.settings = {
            database_reset: true,
            database_cycle: true,
            anti_crash: true,
            fissure_cycle: true,
            loggers: true
        };
    }

    setCredentials(token, prefix) {
        this.token = token;
        this.prefix = prefix || "++";
    }

    async setupHandlers() {
        client.treasury = await loadFiles('./treasury');
        client.farmers = await loadFiles('./farmers');
        client.buttons = await loadFiles('./events/buttons')
        const eventsPath = path.join(__dirname, './events/listeners');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
        
        eventFiles.forEach(file => {
            const event = require(path.join(eventsPath, file));
            const callback = (...args) => event.listen(client, ...args);
            client[event.once ? 'once' : 'on'](event.name, callback);
            info('STRTUP', `Loaded ${event.name} listener.`);
        });
    }

    async setupDatabase() {

    }

    enable(feature) {
        if (this.features.hasOwnProperty(feature)) {
            this.features[feature] = true;
            console.log(`${feature} enabled`);
        }
    }

    disable(feature) {
        if (this.features.hasOwnProperty(feature)) {
            this.features[feature] = false;
            console.log(`${feature} disabled`);
        }
    }

    init() {
        if (!this.token) {
            console.error("Bot token not set. Use setCredentials() to set the credentials.");
            return;
        }

        this.setupHandlers();
        this.setupDatabase();

        this.client.login(this.token);
    }
}

// Example usage
const myBot = new MyBot();
myBot.setCredentials("YOUR_DISCORD_BOT_TOKEN", "!");
myBot.enableFeature("database"); // Enable database feature
myBot.start();
