import { EmbedBuilder } from 'discord.js';
import relicCacheManager from '../../managers/relicCacheManager.js';
import entityClassifierInstance from '../../services/nlp.js';
import boxCacheManager from '../../managers/boxCacheManager.js';
const stringRange = ["C ", "C ", "C ", "UC", "UC", "RA"];
import jsonExports from '../../other/botConfig.json' with { type: 'json' };
import { range } from '../../services/utils.js';
const { breaker, hex_codes } = jsonExports;

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
          stock: parseInt(item.stock) | 0,
          box: parseInt(res?.amount) | 0
        });
      }
      const colorRange = range(Math.min(...fixedRewardData.map(i => i.stock + i.box)));
      const embed = new EmbedBuilder()
      .setTitle(`[ ${entity.fullForm} Relic ]`)
      .setDescription('```ml\n' + fixedRewardData.map((i, j) => `${stringRange[j]} | ${i.stock}${i.box ? ` (+${i.box})` : ""} | ${i.item} ${i.x2 ? "X2" : ""} {${range(i.stock + i.box)}}`).join("\n") + '\n```')
      .setFooter({ text: `${relicData.vaulted ? 'Vaulted' : 'Unvaulted' } relic${breaker}${colorRange} relic` })
      .setColor(hex_codes[`relic__${colorRange}`] || "#FFFFFF")
      .setTimestamp();
      message.reply({ embeds: [embed] });
    }
  },
}