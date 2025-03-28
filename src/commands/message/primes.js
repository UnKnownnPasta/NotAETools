import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, codeBlock } from "discord.js";
import boxCacheManager from "../../managers/boxCacheManager.js";
import entityClassifierInstance from "../../services/nlp.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import { range } from "../../services/utils.js";
import jsonExports from '../../other/botConfig.json' with { type: 'json' };
import { ExtraRowPosition, Pagination } from "pagination.djs";
const { breaker, hex_codes } = jsonExports;

const stringRange = ["C ", "C ", "C ", "UC", "UC", "RA"];

function createPrimeEmbed(primeData) {
	const primeEmbed = new EmbedBuilder();
	/** @type {import('../../other/types').primeItem} */
	const primePart = relicCacheManager.relicCache.primes.find(
		(i) => i.item == primeData.fullForm
	);
	const relicData = primePart.relicFrom.map((relic) => {
		return relicCacheManager.relicCache.relics.find((i) => i.name == relic);
	});
	const boxCache = boxCacheManager.boxCache.find((i) => i.item == primeData.fullForm)?.amount || 0;
	
	const relicString = relicData.map((relic) => {
		const rarity =
			stringRange[
				relic.rewards
					.map((i, x) => (i.item == primeData.fullForm ? x : -1))
					?.filter((x) => x != -1)?.[0] || 0
			];
		return `${rarity} │ ${relic.name.trim()} {${relic.tokens}} {${relic.vaulted ? "V" : "UV"}}`;
	});

	const trueColor = range(primePart.stock + boxCache);
	primeEmbed.setFooter({
		text: `${primePart.stock}${boxCache ? ` (+${boxCache})` : ""}x in stock${breaker}${trueColor} part`,
	});
	primeEmbed.setTitle(`[ ${primeData.fullForm}${primePart.x2 ? " X2" : ""} ]`);
	primeEmbed.setColor(hex_codes[`relic__${trueColor}`] || "#FFFFFF");
	primeEmbed.setTimestamp();

	if (relicString.length > 25) {
		return [primeEmbed, relicString];
	} else {
		primeEmbed.setDescription("```ml\n" + relicString.join("\n") + "\n```");
		return primeEmbed;
	}
}

function createSetEmbed(primeData) {
	const setEmbed = new EmbedBuilder();
	/** @type {import('../../other/types').primeItem} */
	const primeSet = relicCacheManager.relicCache.primes.filter(
		prime => {
			if (primeData.entity == "Mag") return prime.item.split(" ")[0] == "Mag";
			else if (primeData.entity == "Bo") return prime.item.split(" ")[0] == "Bo";
			else return prime.item.startsWith(primeData.entity)
		}
	);

	const entityStocks = [];
	let boxCounter = 0;
	let setDataString = primeSet.map(prime => {
    const boxCache = boxCacheManager.boxCache.find((i) => i.item == prime.item)?.amount || 0;

    entityStocks.push((prime.stock + boxCache) || 0); // Ignore box

    const boxCacheStr = boxCache ? `(+${boxCache})` : "";
    const stockStr = `${prime.stock}`.padEnd(2);
		boxCacheStr ? boxCounter++ : null;

    return `${stockStr}${boxCacheStr.padEnd(5)}│ ${prime.item}${prime.x2 ? " X2" : ""} {${range(prime.stock + boxCache)}}`.trim();
	});

	if (!boxCounter) {
		setDataString = setDataString.map(str => {
			const data = str.split('│');
			return [data[0].trim().padEnd(3), "│", data[1]].join('');
		})
	}

	setEmbed.setTitle(`[ ${primeData.entity} Prime ]`);
	setEmbed.setFooter({
		text: `${Math.min(...entityStocks)}x in stock`,
	});
	setEmbed.setDescription("```ml\n" + setDataString.join("\n") + "\n```");
	setEmbed.setTimestamp();
	setEmbed.setColor(hex_codes[`relic__${range(Math.min(...entityStocks))}`] || "#FFFFFF");
	return setEmbed;
}

/** @type {import('../../other/types').Command} */
export default {
	name: "primes",
	enabled: true,
	trigger: "message",
	/** @param {Message} message */
	execute: async (message) => {
		const entity = entityClassifierInstance.classifyEntity(message.content.slice(2).trim());

		if (entity.detail == "unknown") { // Prime set
			const searchSoupSet = new ButtonBuilder()
				.setCustomId(`searchsoup-set-${entity.entity}`)
				.setLabel('🔎 Soup Store')
				.setStyle(ButtonStyle.Secondary);
			const soupButtonSet = new ActionRowBuilder().addComponents(searchSoupSet);
			const setEmbed = createSetEmbed(entity);
			
			message.reply({ embeds: [setEmbed], components: [soupButtonSet] });
		} else { // Prime part
			const searchSoupPart = new ButtonBuilder()
				.setCustomId(`searchsoup-part-${entity.fullForm}`)
				.setLabel('🔎 Soup Store')
				.setStyle(ButtonStyle.Secondary);
			const soupButtonPart = new ActionRowBuilder().addComponents(searchSoupPart);
			const primeEmbed = createPrimeEmbed(entity);

			if (!Array.isArray(primeEmbed)) {
				message.reply({ embeds: [primeEmbed], components: [soupButtonPart] });
			} else {
				const [baseEmbed, primeDataString] = primeEmbed;
				const embedArray = [];

				for (let i = 0; i < primeDataString.length; i += 25) {
					const embed = new EmbedBuilder(baseEmbed);
					embed.setDescription(codeBlock('ml', primeDataString.slice(i, i + 25).join("\n")));
					embedArray.push(embed);
				}

				const partPagination = new Pagination(message, {
					firstEmoji: "⏮",
					prevEmoji: "◀️",
					nextEmoji: "▶️",
					lastEmoji: "⏭",
					idle: 240_000,
					buttonStyle: ButtonStyle.Secondary,
					loop: true,
				});
				partPagination.setEmbeds(embedArray, (embed, index, array) => {
					return embed.setTitle(`${embed.data.title} (${index + 1}/${array.length})`);
				});
				partPagination.addActionRows([soupButtonPart], ExtraRowPosition.Below);
				partPagination.render();
			}
		}
	},
};
