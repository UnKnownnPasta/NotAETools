import { EmbedBuilder } from "discord.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import entityClassifierInstance from "../../services/nlp.js";
import jsonExports from '../../other/botConfig.json' with { type: 'json' };
const { hex_codes, breaker } = jsonExports;
import { Pagination } from 'pagination.djs'
import boxCacheManager from "../../managers/boxCacheManager.js";
import { range } from "../../services/utils.js";

const stockRanges = {
  "ED": "0 - 11",
  "RED": "12 - 23",
  "ORANGE": "24 - 39",
  "YELLOW": "40 - 59",
  "GREEN": "60 - inf",
}

/** @type {import('../../other/types').Command} */
export default {
	name: "status",
	enabled: true,
	trigger: "message",
	execute: async (message) => {
    let [statusType, relicFilter] = message.content.trim().slice(2).split(' ');
    if (!['lith', 'meso', 'neo', 'axi'].includes(relicFilter)) relicFilter = null;
    const entity = entityClassifierInstance.classifyEntity(statusType.trim());
		const entityDataFiltered = relicCacheManager.relicCache.primes
      .map(p => ({
        ...p,
        box: parseInt(boxCacheManager.boxCache.find((i) => i.item == p.item)?.amount || 0)
      }))
      .filter(p => {
        if (p.item == "Forma") return false;
        if (relicFilter && !p.relicFrom.some(x => x.toLowerCase().startsWith(relicFilter))) return false;
        return range(parseInt(p.stock) + p.box) == entity.entity.toUpperCase();
      })
      .sort((a, b) => (a.stock + a.box) - (b.stock + b.box))
      .map(item => `${`[${item.stock + item.box}]`.padEnd(5)}│ ${item.item} ${item.x2 ? "X2" : ""}`);

    const baseEmbed = new EmbedBuilder()
      .setTitle(`[ ${entity.entity.toUpperCase()}${relicFilter ? ` - ${relicFilter.toUpperCase()}` : ''} ]`)
      .setColor(hex_codes[`relic__${entity.entity.toUpperCase()}`] || "#FFFFFF")
      .setTimestamp();

    const paginationFields = [];
    const desc_slice = 15;
    for (let i = 0; i < entityDataFiltered.length; i += desc_slice) {
      paginationFields.push(
        new EmbedBuilder(baseEmbed)
        .setDescription('```ml\n' + entityDataFiltered.slice(i, i + desc_slice).join("\n") + '\n```')
        .setFooter({ text:
          `Parts with ${stockRanges[entity.entity.toUpperCase()]} stock${breaker}${entityDataFiltered.length} results${breaker}Page ${Math.floor(i / desc_slice) + 1}/${Math.ceil(entityDataFiltered.length / desc_slice)}` 
        })
      );
    }

    const pagination = new Pagination(message);
    pagination.setEmbeds(paginationFields);
    pagination.render();
	},
};
