import { Events } from 'discord.js';
import boxCacheManager from '../managers/boxCacheManager.js';
import relicCacheManager from '../managers/relicCacheManager.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.MessageDelete,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} message 
     * @param {import('discord.js').Client} client
     */
    async execute(client, message) { // id defined
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
    }
}