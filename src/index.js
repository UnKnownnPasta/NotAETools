import dotenv from 'dotenv';
import { join } from 'node:path';
dotenv.config({ path: join(import.meta.dirname, `../.env.${process.env.NODE_ENV}`) });
import { _bool_true } from './services/utils.js';

import { ActivityType, Client, Collection, GatewayIntentBits as GIB, Partials } from 'discord.js';
import CommandHandler from './other/handler.js';
import { getFissures } from './services/warframe.js';
import { start_db } from './services/databaseMerged.js';

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
                    { name: "Zlushiie 🎅", type: ActivityType.Watching },
                ],
                status: "idle",
            },
        });

        this.prefix = "++";
        this.sequence();
    }

    async sequence() {
        this.cmd_handler = new CommandHandler(this);
        await this.cmd_handler.createBasic();
        await this.cmd_handler.loadEvents();
        await start_db();
        await this.login(process.env.DISCORD_TOKEN);
        await this.guilds.fetch({force: true});
        await this.intervals();
    }

    async intervals() {
        await getFissures(this);
        
        // setInterval(async () => {
        //     await getFissures(this);
        // }, 30_000);
    }
}

export default new Bot();