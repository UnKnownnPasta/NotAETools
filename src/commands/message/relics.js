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
        const res = boxCacheManager.boxCache.find(i => i.item == item.item);
        fixedRewardData.push({
          ...item,
          stock: parseInt(item.stock) | 0,
          box: parseInt(res?.amount) | 0
        });
      }

      let boxCounter = 0;
      let embedLogic = fixedRewardData.map((reward, index) => {
        const stockStr = `${reward.stock}`.padEnd(2);
        const boxStr = reward.box ? `(+${reward.box})`.padEnd(5) : "".padEnd(5);
        reward.box ? boxCounter++ : null;
    
        const itemStr = `${reward.item}${reward.x2 ? " X2" : ""}`;
        const formattedLine = `${stringRange[index]} │ ${stockStr}${boxStr}│ ${itemStr} {${range(reward.stock + reward.box)}}`;
    
        return formattedLine;
      });

      if (!boxCounter) {
        embedLogic = embedLogic.map(str => {
          const data = str.split('│');
          return [data[0].trim().padEnd(3), "│ ", data[1].trim().padEnd(3), "│", data[2]].join('');
        })
      }
    
      const colorRange = range(Math.min(...fixedRewardData.filter(i => i.item !== "Forma").map(i => i.stock + i.box)));
      const embed = new EmbedBuilder()
      .setTitle(`[ ${entity.fullForm} Relic ]`)
      .setDescription('```ml\n' + embedLogic.join("\n") + '\n```')
      .setFooter({ text: `${relicData.vaulted ? 'Vaulted' : 'Unvaulted' } relic${breaker}${colorRange} relic` })
      .setColor(hex_codes[`relic__${colorRange}`] || "#FFFFFF")
      .setTimestamp();
      message.reply({ embeds: [embed] });
    }
  },
}