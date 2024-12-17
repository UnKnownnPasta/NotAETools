import { Events } from 'discord.js';
import entityClassifierInstance from '../services/nlp.js';

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
        if (message.author.bot || !message.content.startsWith(client.prefix)) return;
        
        const args = message.content.replace(client.prefix, "");
        const request = entityClassifierInstance.classifyEntity(args);
        console.log(request);
        
        const command = client.cmd_handler.find(`${request.category}-message`);

        if (command) {
            command.execute(message, client);
            console.log(`${message.author.username} used ${client.prefix}${command.name}`);
        }
    }
}