import { config } from 'dotenv';
import { resolve } from 'node:path'
config({ path: resolve(import.meta.dirname, './.env') })

import { ActivityType, Client, Collection, GatewayIntentBits as gib } from 'discord.js';
import db from './src/handlers/db.js';
import { readdirSync } from 'node:fs'
import { deploySlashCommands, emitAll, loadAs } from './src/handlers/emitters.js';

class AETools extends Client {
    constructor() {
        super({
            intents: gib.Guilds | gib.MessageContent | gib.GuildMessages | gib.GuildMembers,
            presence: { activities: [{ name: 'You.', type: ActivityType.Watching }], status: 'dnd' },
            partials: [],
            allowedMentions: { repliedUser: false },
        })
        this.departments = readdirSync(resolve(import.meta.dirname, './src/commands/'))
        this.interactions = readdirSync(resolve(import.meta.dirname, './src/interactions/'))
        this.commands = new Collection();
        this.deployables = []

        this.startUp();
    }

    async startUp() {
        // database
        console.log('bot | Starting database');
        await db.connect();

        // commands
        console.log('bot | Loading commands');
        this.setupCommands();
        this.setupInteractions();

        // event listeners
        console.log('bot | Loading events');
        await emitAll(this);

        setTimeout(async () => {
            // deploy slash
            console.log(`loader | Starting deploy of commands..`);
            await this.deploy();
            console.log(`loader:deploy | done`);

            // client on
            console.log('bot | Logging in');
            await this.login(process.env.TOKEN)
        }, 1000);
    }

    async setupCommands() {
        for (const dept of this.departments) {
            const deployWhich = await loadAs(this.commands, dept)
            if (deployWhich.length) this.deployables.push(...deployWhich)
        }
    }
    async setupInteractions() {
        for (const dept of this.interactions) {
            const deployWhich = await loadAs(this.interactions, dept)
            if (deployWhich.length) this.deployables.push(...deployWhich)
        }
    }
    async deploy() {
        if (this.deployables.length) {
            await deploySlashCommands(this.deployables)
        }
    }
}

// start bot
console.log('starting..');
export default new AETools();
