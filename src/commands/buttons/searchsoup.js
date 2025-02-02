import { EmbedBuilder } from 'discord.js';
import relicCacheManager from '../../managers/relicCacheManager.js';

/** @type {import('../../other/types').Command} */
export default {
	name: "searchsoup",
	enabled: true,
	trigger: "button",
	execute: async (client, i) => {
		await i.deferReply();
		const parttoFind = i.customId.split("-")[2];
		const findType = i.customId.split("-")[1];

    if (findType == "part") {
      const part = relicCacheManager.relicCache.primes.find((i) => i.item == parttoFind);
      const hitStrings = [];

      for (const relic of part.relicFrom) {
        const relicData = relicCacheManager.searchForSoupCache(relic);
        if (relicData.length > 0) {
          for (const item of relicData) {
            hitStrings.push(`By __${item[1].author}__ - [Soup Link](${item[1].url}) - ${item[0].amount}x ${item[0].item} (*${item[2].toUpperCase()}*)`);
          }
        }
      }
      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: `Found ${hitStrings.length} relics`, iconURL: i.user.displayAvatarURL() })
        .setColor(`#C2B280`);
      if (hitStrings.length > 0) replyEmbed.setDescription(hitStrings.join("\n"));
      await i.editReply({ embeds: [replyEmbed] });
    } else if (findType == "set") {
      const part = relicCacheManager.relicCache.primes.find((i) => i.item.startsWith(parttoFind));
      const hitStrings = [];

      for (const relic of part.relicFrom) {
        const relicData = relicCacheManager.searchForSoupCache(relic);
        if (relicData.length > 0) {
          for (const item of relicData) {
            hitStrings.push(`By __${item[1].author}__ - [Soup Link](${item[1].url}) - ${item[0].amount}x ${item[0].item} (*${item[2].toUpperCase()}*)`);
          }
        }
      }
      const replyEmbed = new EmbedBuilder()
        .setAuthor({ name: `Found ${hitStrings.length} relics`, iconURL: i.user.displayAvatarURL() })
        .setColor(`#C2B280`);
      if (hitStrings.length > 0) replyEmbed.setDescription(hitStrings.join("\n"));
      await i.editReply({ embeds: [replyEmbed] });
    } else if (findType == "relic") {
      const hitStrings = [];
      const results = relicCacheManager.searchForSoupCache(parttoFind);
      if (results.length > 0) {
        for (const item of results) {
          hitStrings.push(`By __${item[1].author}__ - [Soup Link](${item[1].url}) - ${item[0].amount}x ${item[0].item} (*${item[2].toUpperCase()}*)`);
        }
      }
      const replyEmbed = new EmbedBuilder()
      .setAuthor({ name: `Found ${hitStrings.length} relics`, iconURL: i.user.displayAvatarURL() })
      .setColor(`#C2B280`);
      if (hitStrings.length > 0) replyEmbed.setDescription(hitStrings.join("\n"));
      await i.editReply({ embeds: [replyEmbed] });
    }
	},
};
