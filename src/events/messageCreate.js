import { Events } from 'discord.js';
import entityClassifierInstance from '../services/nlp.js';
import boxCacheManager from '../managers/boxCacheManager.js';
import relicCacheManager from '../managers/relicCacheManager.js';

/** @type {import('../other/types.js').Event} */
export default {
    name: Events.MessageCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} message 
     * @param {import('discord.js').Client} client
     */
    async execute(client, message) {
        if (!client.finishedSequence) return;
        if (message.author.bot) return;
        
        if (message.channel.isThread()) {
            const channelID = message.channelId;
        
            for (const channel of boxCacheManager.channelCache) {
                if (channel.id == channelID) {
                    await boxCacheManager.updateCache(channelID);
                }
            }
            for (const channel of relicCacheManager.soupCache) {
                if (channel.id == channelID) {
                    await relicCacheManager.setCache(channelID);
                }
            }
            return;
        }

        if (!message.content.startsWith(client.prefix)) return;

        const args = message.content.replace(client.prefix, "");
        const request = entityClassifierInstance.classifyEntity(args);
        console.log(request);
        
        const command = client.cmd_handler.find(`${request.category}-message`);

        if (command) {
            command.execute(message, client);
            console.log(`${message.author.username} used ${client.prefix}${command.name} as ${client.prefix}${args}`);
        }
    }
}