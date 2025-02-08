import boxCacheManager from '../../managers/boxCacheManager.js';
import relicCacheManager from '../../managers/relicCacheManager.js';

/** @type {import('../../other/types').Command} */
export default {
  name: "utils",
  enabled: true,
  trigger: "message",
  /**
   * @param {import('discord.js').Message} message 
   * @param {import('discord.js').Client} client 
   */
  execute: async (message, client) => {
    if (message.author.id != process.env.OVER_AUTH) return;

    const request = message.content.slice(2).trim().split(" ");
    const command = request[1];

    switch (command) {
      case "memory": 
        const memoryUsage = process.memoryUsage().rss / 1024 / 1024;
        message.reply(`Memory usage: ${memoryUsage.toFixed(2)} MB`);
      break;
      case "cache":
        const firstCache = relicCacheManager.relicCache.length;
        const secondCache = boxCacheManager.boxCache.length;
        message.reply(`First cache: ${firstCache} | Second cache: ${secondCache}`);
      break;
      default:
        message.reply(`Invalid command: ${command}`);
      break;
    }
  },
}