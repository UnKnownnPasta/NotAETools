import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const depEnv = process.env.deploymentEnvironment;
dotenv.config({ path: resolve(__dirname, `../.env${depEnv == "nonlocal" ? "" : (process.env.NODE_ENV == 'production' ? '.production' : '.development')}`) });

import { ActivityType, Client, GatewayIntentBits as GIB, Partials } from 'discord.js';
import { _bool_true } from './services/utils.js';
import CommandHandler from './other/handler.js';
import { getFissures } from './services/fissure.js';
import { start_db } from './services/databaseMerged.js';
import { fetchData } from './services/googleSheets.js';
import boxCacheManager from './managers/boxCacheManager.js';
import relicCacheManager from './managers/relicCacheManager.js';
import entityClassifierInstance from './services/nlp.js';
import "../scripts/server.js"; // server
import './other/crash.js';

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
                    { name: "Zlush 🌠", type: ActivityType.Watching },
                ],
                status: "idle",
            },
        });

        this.prefix = "++";
        this.finishedSequence = false;
        this.sequence();
    }

    async sequence() {
        // Create command handler
        this.cmd_handler = new CommandHandler(this);
        await this.cmd_handler.createBasic();
        await this.cmd_handler.loadEvents();
        
        // Link and update database (mongo & json)
        await fetchData();
        // await start_db();
        await entityClassifierInstance.updateLocalData();


        // Bot online in discord
        await this.login(process.env.DISCORD_TOKEN);
        this.once('ready', async () => {
            console.log(`Ready! Logged in as ${this.user.tag}`);

            await this.guilds.fetch({ force: true });
            await this.startCaching();
            // await getFissures(this);

            this.fissureInterval = setInterval(async () => await getFissures(this), 600_000);
            this.finishedSequence = true;
            console.log("Finished sequence :>");
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