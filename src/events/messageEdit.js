import { Events } from 'discord.js';
import boxCacheManager from '../managers/boxCacheManager.js';
import relicCacheManager from '../managers/relicCacheManager.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.MessageUpdate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} newMessage 
     * @param {import('discord.js').Client} client
     */
    async execute(client, oldMessage, newMessage) {
        if (!client.finishedSequence) return;
        const message = newMessage;
        if (message.author?.bot) return;
        
        if (message.channel.isThread()) {
            const channelID = message.channelId;
        
            for (const channel of boxCacheManager.channelCache) {
                if (channel.id == channelID) {
                    await boxCacheManager.updateCache(channelID);
                }
            }
            for (const channel of relicCacheManager.soupCache) {
                if (channel.id == channelID) {
                    await relicCacheManager.setSoupCache(channelID);
                }
            }
            return;
        }
    }
}