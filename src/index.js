import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
dotenv.config({ path: resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });

import { ActivityType, Client, GatewayIntentBits as GIB, Partials } from 'discord.js';
import { _bool_true } from './services/utils.js';
import CommandHandler from './other/handler.js';
import { getFissures } from './services/fissure.js';
import { start_db } from './services/databaseMerged.js';
import { fetchData } from './services/googleSheets.js';
import boxCacheManager from './managers/boxCacheManager.js';
import relicCacheManager from './managers/relicCacheManager.js';
import entityClassifierInstance from './services/nlp.js';

class Bot extends Client {
    constructor() {
        super({
            intents:
                GIB.Guilds |
                GIB.MessageContent |
                GIB.GuildMessages |
                GIB.GuildMembers |
                GIB.DirectMessages |
                GIB.GuildVoiceStates,
            partials: [Partials.Message, Partials.User, Partials.Channel],
            allowedMentions: { parse: [] },
            presence: {
                activities: [
                    { name: "No-one", type: ActivityType.Watching },
                ],
                status: "idle",
            },
        });

        setInterval(() => {
            const memoryUsage = process.memoryUsage();
            console.log(`Memory Usage: 
                RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
                Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
                Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
                External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB
            `);
        }, 2000);

        this.prefix = "++";
        this.sequence();
    }

    async sequence() {
        // Create command handler
        this.cmd_handler = new CommandHandler(this);
        await this.cmd_handler.createBasic();
        await this.cmd_handler.loadEvents();
        
        // Link and update database (mongo & json)
        // await fetchData();
        // await start_db();
        await entityClassifierInstance.updateLocalData();

        // Bot online in discord
        await this.login(process.env.DISCORD_TOKEN);
        this.once('ready', async () => {
            await this.guilds.fetch({ force: true });
            await this.startCaching();
        });
    }

    async startCaching() {
        boxCacheManager.init(this);
        relicCacheManager.init(this);
        await boxCacheManager.updateCache();
        await relicCacheManager.setCache();
    }
}

export default new Bot();