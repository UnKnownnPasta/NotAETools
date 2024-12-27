import relicCacheManager from '../../managers/relicCacheManager.js';
import entityClassifierInstance from '../../services/nlp.js';

/** @type {import('../../other/types').Command} */
export default {
  name: "relics",
  enabled: true,
  trigger: "message",
  /** @param {import('discord.js').Message} message */
  execute: async (message) => {
    const args = message.content.slice(2).trim();
    const entity = entityClassifierInstance.classifyEntity(args);
    const cacheData = relicCacheManager.searchForCache(entity.fullForm);
    message.reply({ content: `?: ${cacheData}` });
  },
}