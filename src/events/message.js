import { Events } from 'discord.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.MessageCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} message 
     * @param {import('discord.js').Client} client
     */
    async execute(client, message) {
        const args = message.content.replace(client.prefix, "");
        const command = client.cmd_handler.find(`${args.split(" ")[0]}-message`);

        if (command) command.execute(message, client);
    }
}