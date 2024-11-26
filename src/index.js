import dotenv from 'dotenv';
import { resolve, join } from 'node:path';
dotenv.config({ path: join(import.meta.dirname, `../.env.${process.env.NODE_ENV}`) });
import { readdir } from "node:fs/promises";
import { _bool_true } from './services/utils.js';

import { ActivityType, Client, Collection, GatewayIntentBits as GIB, Partials } from 'discord.js';
import CommandHandler from './other/handler.js';

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
        await this.cmd_handler.create();
        await this.loadEvents();
        await this.login(process.env.DISCORD_TOKEN);
    }

    async loadEvents() {
        const eventFiles = join(import.meta.dirname, './events/');
        const events = await readdir(eventFiles);

        for (const file of events) {
            const event = await import(`file://${join(eventFiles, file)}`);

            if (_bool_true(event.default.enabled) || !_bool_true(event.default.disabled)) {
                this[event.default.trigger](event.default.name, (...args) => event.default.execute(this, ...args));
            }
        }
    }

    async intervals() {
        setInterval(() => {
            this.user.setPresence({
                activities: [
                    { name: "Zlushiie 🎅", type: ActivityType.Watching },
                ],
                status: "idle",
            });
        }, 10000);
    }
}

export default new Bot();