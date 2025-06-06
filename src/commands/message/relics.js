import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import relicCacheManager from '../../managers/relicCacheManager.js';
import entityClassifierInstance from '../../services/nlp.js';
import boxCacheManager from '../../managers/boxCacheManager.js';
import jsonExports from '../../other/botConfig.json' with { type: 'json' };
import { range } from '../../services/utils.js';
const { breaker, hex_codes } = jsonExports;
const stringRange = ["C ", "C ", "C ", "UC", "UC", "RA"];

export function constructEmbed(relicName) {
  const relicData = relicCacheManager.relicCache.relics.find(i => i.name == relicName);

  if (!relicData) return null;

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
    const itemStr = `${reward.item}${reward.x2 ? " X2" : ""}`;
    const rangeStr = reward.item == "Forma" ? "" : `{${range(reward.stock + reward.box)}}`;
    const stockStr = reward.item == "Forma" ? "".padEnd(2) : `${reward.stock}`.padEnd(2);
    const boxStr = reward.box ? `(+${reward.box})`.padEnd(5) : "".padEnd(5);
    
    reward.box ? boxCounter++ : null;
    const formattedLine = `${stringRange[index]} │ ${stockStr}${boxStr}│ ${itemStr} ${rangeStr}`;

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
    .setTitle(`[ ${relicName} Relic ] {${relicData.tokens}}`)
    .setDescription('```ml\n' + embedLogic.join("\n") + '\n```')
    .setFooter({ text: `${relicData.vaulted ? 'Vaulted' : 'Unvaulted' } relic${breaker}${colorRange} relic` })
    .setColor(hex_codes[`relic__${colorRange}`] || "#FFFFFF")
    .setTimestamp();
  return embed;
}

/** @type {import('../../other/types').Command} */
export default {
  name: "relics",
  enabled: true,
  trigger: "message",
  /** @param {import('discord.js').Message} message */
  execute: async (message) => {
    const args = message.content.slice(2).trim();
    const entity = entityClassifierInstance.classifyEntity(args);
    const relicEmbed = constructEmbed(entity.fullForm)
    if(!relicEmbed) return;

    const searchSoupRelic = new ButtonBuilder()
      .setCustomId(`searchsoup-relic-${entity.fullForm}`)
      .setLabel('🔎 Soup Store')
      .setStyle(ButtonStyle.Secondary);
    const soupButtonRelic = new ActionRowBuilder().addComponents(searchSoupRelic);
    
    message.reply({ embeds: [relicEmbed], components: [soupButtonRelic] });
  }
}