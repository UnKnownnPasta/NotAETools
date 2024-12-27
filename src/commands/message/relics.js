import { EmbedBuilder } from 'discord.js';
import relicCacheManager from '../../managers/relicCacheManager.js';
import entityClassifierInstance from '../../services/nlp.js';
import boxCacheManager from '../../managers/boxCacheManager.js';

/** @type {import('../../other/types').Command} */
export default {
  name: "relics",
  enabled: true,
  trigger: "message",
  /** @param {import('discord.js').Message} message */
  execute: async (message) => {
    const args = message.content.slice(2).trim();
    const entity = entityClassifierInstance.classifyEntity(args);
    const relicData = relicCacheManager.relicCache.relics.find(i => i.name == entity.fullForm);
    
    if (relicData) {
      const fixedRewardData = [];
      for (const item of relicData.rewards) {
        const res = boxCacheManager.boxCache.find(i => i.item == item);
        fixedRewardData.push({
          ...item,
          stock: parseInt(item.stock) | 0 + parseInt(res?.amount) | 0
        });
      }
      const embed = new EmbedBuilder()
      .setTitle(`[ ${entity.fullForm} ] ${relicData.vaulted ? "V" : "UV"}`)
      .setDescription(fixedRewardData.map(i => `${i.stock}x | ${i.item} ${i.x2 ? "X2" : ""}`).join("\n"));
      message.reply({ embeds: [embed] });
    }
  },
}