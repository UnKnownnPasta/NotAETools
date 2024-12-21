import { EmbedBuilder, Message } from "discord.js";
import boxCacheManager from "../../managers/boxCacheManager.js";
import entityClassifierInstance from "../../services/nlp.js";
import relicCacheManager from "../../managers/relicCacheManager.js";

/** @type {import('../../other/types').Command} */
export default {
	name: "primes",
	enabled: true,
	trigger: "message",
	/**
	 *
	 * @param {Message} message
	 */
	execute: async (message) => {
		const entity = entityClassifierInstance.classifyEntity(
			message.content.slice(2).trim()
		);
		const boxEntity = boxCacheManager.boxCache.find(
			(i) => i.item == entity.entity + " " + entity.detail
		);
    /** @type {import('../../other/types').primeItem} */
    const cacheData = relicCacheManager.relicCache.primes.find(i => i.item == entity.entity + " " + entity.detail);

    const resEmbed = new EmbedBuilder()
      .setTitle(entity.entity + " " + entity.detail)
      .addFields(
        { name: "Type", value: cacheData.item, inline: true },
        { name: "Rarity", value: `${cacheData.rarity}`, inline: true },
        { name: "Stock", value: `${cacheData.stock}`, inline: true },
        { name: "Color", value: cacheData.color, inline: true },
        { name: "X2", value: `${cacheData.x2}`, inline: true },
        { name: "Relic", value: `${cacheData.relicFrom.join(", ")}`, inline: true },
      )

    message.reply({ embeds: [resEmbed] });
	},
};
