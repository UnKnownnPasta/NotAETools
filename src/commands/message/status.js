import { EmbedBuilder } from "discord.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import entityClassifierInstance from "../../services/nlp.js";

/** @type {import('../../other/types').Command} */
export default {
	name: "status",
	enabled: true,
	trigger: "message",
	execute: async (message) => {
    const entity = entityClassifierInstance.classifyEntity(message.content.slice(2).trim());
		const allData = relicCacheManager.relicCache.primes
    .filter(p => p.color == entity.entity.toUpperCase())
    .sort((a, b) => a.stock - b.stock);

    const embed = new EmbedBuilder()
      .setTitle(`[ ${entity.entity.toUpperCase()} Status ]`)
      .setDescription(
        allData
          .map((item, index) => {
            return `${index + 1}. ${item.item} (${item.stock})`;
          })
          .join("\n") || "No data found"
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
	},
};
