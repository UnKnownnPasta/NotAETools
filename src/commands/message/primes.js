import { EmbedBuilder, Message } from "discord.js";
import boxCacheManager from "../../managers/boxCacheManager.js";
import entityClassifierInstance from "../../services/nlp.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import { range } from "../../services/utils.js";
import jsonExports from '../../other/botConfig.json' with { type: 'json' };
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

	primeEmbed.setTitle(`[ ${primeData.fullForm}${primePart.x2 ? " X2" : ""} ]`);
	primeEmbed.setFooter({
		text: `${primePart.stock}${boxCache ? ` (+${boxCache})` : ""}x in stock${breaker}${primePart.color} part`,
	});
	primeEmbed.setDescription("```ml\n" + relicString.join("\n") + "\n```");
	primeEmbed.setTimestamp();
	primeEmbed.setColor(hex_codes[`relic__${primePart.color}`] || "#FFFFFF");
	return primeEmbed;
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

    entityStocks.push(prime.stock || 0); // Ignore box

    const boxCacheStr = boxCache ? `(+${boxCache})` : "";
    const stockStr = `${prime.stock}`.padEnd(2);
		boxCacheStr ? boxCounter++ : null;

    return `${stockStr}${boxCacheStr.padEnd(5)}│ ${prime.item} {${prime.color}}`.trim();
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
	execute: async (message) => {
		const entity = entityClassifierInstance.classifyEntity(message.content.slice(2).trim());

		if (entity.detail == "unknown") {
			const setEmbed = createSetEmbed(entity);
			message.reply({ embeds: [setEmbed] });
		} else {
			const primeEmbed = createPrimeEmbed(entity);
			message.reply({ embeds: [primeEmbed] });
		}
	},
};
