import { Collection, REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { _bool_true } from '../services/utils.js';

/** @typedef {import('./types.js').Command} Command */

export default class CommandHandler {
    constructor(client) {
        this.client = client;
        /** @type {Collection<string, Command>} */
        this.commands = new Collection();
    }

    register(command) {
        this.commands.set(`${command.name}-${command.trigger}`, command);
    }

    find(cmd) {
        const [name, trigger] = cmd.split('-');
        return this.commands.find(command => command.name === name && command.trigger === trigger);
    }

    async createBasic() {
        const commandDirectories = {
            message: join(import.meta.dirname, '../commands/message/'),
            interaction: join(import.meta.dirname, '../commands/interaction/'),
            buttons: join(import.meta.dirname, '../commands/buttons/')
        };

        const interactionCommands = [];

        for (const [type, dirPath] of Object.entries(commandDirectories)) {
            const commandFiles = await readdir(dirPath);

            for (const file of commandFiles) {
                const command = await import(`file://${join(dirPath, file)}`);
                if (!command.default) continue;

                if (_bool_true(command.default.enabled) || !_bool_true(command.default.disabled)) {
                    this.register(command.default);
                    if (type === 'interaction') {
                        interactionCommands.push(command.default);
                    }
                }
            }
        }

        await this.deploy(interactionCommands);        
    }

    async loadEvents() {
        const eventFiles = join(import.meta.dirname, '../events/');
        const events = await readdir(eventFiles);

        for (const file of events) {
            const event = await import(`file://${join(eventFiles, file)}`);
            if (!event.default) continue;
            if (_bool_true(event.default.enabled) || !_bool_true(event.default.disabled)) {
                this.client[event.default.trigger](event.default.name, (...args) => event.default.execute(this.client, ...args));
            }
        }
    }

    async deploy(commandData) {
        if (!commandData.length) return;
        const commands = commandData.map(command => command?.data?.toJSON()).filter(x => x !== undefined);
        const rest = new REST().setToken(process.env.DISCORD_TOKEN);
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.PRIMARY_GUILD_ID),
                { body: commands },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (err) {
            console.error('Deploying application (/) commands failed', err)
        }
    }
}