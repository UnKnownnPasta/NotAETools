import boxCacheManager from '../../managers/boxCacheManager.js';
import relicCacheManager from '../../managers/relicCacheManager.js';
import { fetchData } from '../../services/googleSheets.js';
import entityClassifierInstance from '../../services/nlp.js';
import { getLimiterStats } from '../../services/limiter.js';
import { getFissures } from '../../services/fissure.js';

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
      case "ping":
        const uptime = process.uptime();
        const hrs = Math.floor(uptime / 3600);
        const mins = Math.floor((uptime % 3600) / 60);
        const secs = Math.floor(uptime % 60);
        message.reply(`Pong! 🏓\nWS: ${client.ws.ping}ms | Uptime: ${hrs}h ${mins}m ${secs}s`);
      break;
      case "limiter":
        const stats = getLimiterStats();
        let statMsg = `Global cooldown: ${stats.globalNextAllowedAt}\nActive buckets: ${stats.activeBuckets.length || 'None'}`;
        if (stats.activeBuckets.length > 0) {
            statMsg += '\n' + stats.activeBuckets.map(b => `- ${b.key}: ${b.resetIn}`).join('\n');
        }
        message.reply(statMsg);
      break;
      case "fissure":
        const fmsg = await message.reply("Updating fissures...");
        try {
            await getFissures(client);
            fmsg.edit("Fissures updated successfully.");
        } catch (e) {
            fmsg.edit(`Error updating fissures: ${e.message}`);
        }
      break;
      case "cache":
        const firstCacheA = relicCacheManager.relicCache.primes.length;
        const firstCacheB = relicCacheManager.relicCache.relics.length;
        const secondCache = boxCacheManager.boxCache.length;
        message.reply(`First cache A: ${firstCacheA} | First cache B: ${firstCacheB} | Second cache: ${secondCache}`);
      break;
      case "google":
        const msg = await message.reply(`Queued.`);
        try {
          await fetchData(msg, message);
        } catch (err) {
          msg.edit(`Error: ${err.message}`);
        }
      break;
      case "search":
        const parsed = request.slice(2).join(" ");
        const entity = entityClassifierInstance.classifyEntity(parsed);
        if (!entity.detail) return message.reply(`Invalid item: ${parsed}`);
        const boxData = boxCacheManager.boxCache.find(i => i.item == `${entity.fullForm}`)?.amount || 0;
        const cacheData = relicCacheManager.relicCache.primes.find(i => i.item == `${entity.fullForm}`)?.stock || 0;
        message.reply(`Describing: ${entity.fullForm}\nBox amount: ${boxData} | Cache amount: ${cacheData}`);
      break;
      case 'refresh':
        const cid = request[3];
        const type = request[2];
        const msg_ = await message.reply(`Refreshing ${type} cache for ${cid}...`);
        try {
          if (type == 'box') {
            if (cid == 'all') {
              for (const stored_id of boxCacheManager.channelCache.map(c => c.id)) {
                await boxCacheManager.updateCache(stored_id);
              }
            } else {
              await boxCacheManager.updateCache(cid);
            }
            msg_.edit(`Box cache for ${cid} updated successfully.`);
          } else if (type == 'relic') {
            if (cid == 'soup') {
              await relicCacheManager.setSoupCache(cid);
            } else if (cid == 'prime') {
              await relicCacheManager.setRelicCache();
            }
            msg_.edit(`Relic cache for ${cid} updated successfully.`);
          }
        } catch (error) {
          msg_.edit(`Error: ${error.message}`);
        }
      break;
      case 'toggle':
        const cmdName = request[2];
        const cmdType = request[3] || 'message'; // Default to message commands if type not specified
        const cmd = client.cmd_handler.find(`${cmdName}-${cmdType}`);
        
        if (!cmd) {
          return message.reply(`Command not found: ${cmdName} (${cmdType})`);
        }

        const currentState = client.cmd_handler.isCommandEnabled(cmdName, cmdType);
        try {
          if (currentState) {
            await client.cmd_handler.disableCommand(cmdName, cmdType);
            message.reply(`Disabled command: ${cmdName} (${cmdType})`);
          } else {
            await client.cmd_handler.enableCommand(cmdName, cmdType);
            message.reply(`Enabled command: ${cmdName} (${cmdType})`);
          }
        } catch (error) {
          message.reply(`Error toggling command: ${error.message}`);
        }
      break;
      default:
        message.reply(`Valid commands: \`memory\`, \`ping\`, \`limiter\`, \`fissure\`, \`cache\`, \`google\`, \`search [name]\`, \`refresh [box|relic] [id|soup|prime]\`, \`toggle [name] [type]\``);
      break;
    }
  },
}