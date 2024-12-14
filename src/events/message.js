import { Events } from 'discord.js';
import { EntityClassifierInstance } from '../services/nlp.js';

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
        const request = args.split(" ")[0]
        
        const command = client.cmd_handler.find(`${request}-message`);

        if (command) {
            command.execute(message, client);
            console.log(`${message.author.username} used ${client.prefix}${command.name}`);
        }
    }
}