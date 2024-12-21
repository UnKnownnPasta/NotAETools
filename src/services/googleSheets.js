import { google } from "googleapis";
import axios from "axios";
const cheerio = await import('cheerio');
import jsonExports from '../other/botConfig.json' with { type: 'json' };
const { spreadsheet, dualitemslist } = jsonExports;
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { range } from "./utils.js";
import relicCacheManager from "../managers/relicCacheManager.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');

const googleSheets = async ({ spreadsheetId, range }) => {
	return google.sheets("v4").spreadsheets.values.get({
		auth: process.env.GOOGLE_APIKEY,
		spreadsheetId: spreadsheetId,
		range: range,
	});
};

async function searchForDrops(htmlText, searchString) {
	let count = 0;
	let position = 0;

	while (position !== -1) {
		position = htmlText.indexOf(searchString, position);

		if (position !== -1) {
			count++;
			position += searchString.length;
			if (count > 5) return false;
			await new Promise((resolve) => setImmediate(resolve));
		}
	}

	return true;
}

const normalize = (name) => {
	name = name.replace(/\s+/g, " ").trim().replace(" Blueprint", "");
	return name.endsWith(" Prime")
		? name.replace(" Prime", " Blueprint")
		: name.replace(" Prime ", " ");
};

export async function fetchData(msg, ogmsg) {
	console.time("fetchData");

	// Fetch data from google sheets
	const sheetValues = await googleSheets({
			spreadsheetId: spreadsheet.treasury.database,
			range: spreadsheet.treasury.ranges.relictokenData,
	}).catch((err) => {
			console.error(err, "Error fetching relic tokens, using google client");
	});

	const sheetValues2 = await googleSheets({
			spreadsheetId: spreadsheet.treasury.tracker,
			range: spreadsheet.treasury.ranges.partsData,
	}).catch((err) => {
			console.error(err, "Error fetching items and stock, using google client");
	});

	// Parse data
	const tokenValues = {};
	const values = sheetValues.data.values;
	for (let i = 0; i < values.length; i++) {
			tokenValues[values[i][0]] = parseInt(values[i][1]) || 0;
	}

	const stockValues = {};
	const values2 = sheetValues2.data.values;
	for (let i = 0; i < values2.length; i++) {
			let itemName = normalize(`${values2[i][0] + " " + values2[i][1]}`.replace(" and ", " & ").replace("2X ", "").replace(" Prime Collar", " Prime"));
			const stck = parseInt(values2[i][2]) || 0;
			stockValues[itemName] = dualitemslist.includes(itemName) ? stck / 2 | 0 : stck;
	}

	// Log progress
	if (msg) {
			await msg.edit({ content: `\`\`\`[1.5/2] Fetching data...\`\`\`` });
	}

	stockValues["Venka Blades"] = stockValues["Venka Blade"] || 0;
	delete stockValues["Venka Blade"];

	try {
			const url = "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";
			const response = await axios.get(url);

			const htmlText = response.data;
			const extractedHtml = htmlText.match(/<h3 id="relicRewards">.*?<h3 id="keyRewards">/s)?.[0] || "";
			const $ = cheerio.load(extractedHtml);
			const tables = $("table tbody > tr")

			if (msg) {
					await msg.edit({ content: `\`\`\`[2/2] Fetching data...\`\`\`` });
			}

			const relicRewards = await processTables($, tables, msg);
			const PrimeData = await processRelics(relicRewards, stockValues, tokenValues, htmlText, msg);

			await fs.promises.writeFile(path.join(__dirname, '..', 'data', 'relics.json'), JSON.stringify(PrimeData));
			await relicCacheManager.setCache();

			if (msg) {
				await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nDONE Updating DB... ✅\`\`\`` });
				ogmsg.react('✔');

				setTimeout(async () => {
					await msg.delete();
				}, 4_000);
			}
	} catch (error) {
			console.error("Error fetching relic rewards:", error);
			if (msg) {
					await msg.edit({ content: `Couldn't update database. Error: ${error.message}` });
					ogmsg.react('❌');
			}
			return [];
	} finally {
			console.timeEnd("fetchData");
	}
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function processTables($, data, msg) {
	const relicRewards = [];
	let currentRelic = { rewards: [] };

	await data.each(async (_, row) => {
			const columns = $(row).find("td");
			const textName = $(row).find("th").text().trim();

			if ($(row).hasClass("blank-row")) {
					if (currentRelic.rewards.length > 0) {
							relicRewards.push(currentRelic);
							currentRelic = { rewards: [] };
					}
					await delay(200);
					return;
			}

			if (!currentRelic.name && textName) {
					currentRelic.name = textName;
			}
			if (columns.length >= 2) {
					const reward = {
							name: columns.eq(0).text().trim().replace(" and ", " & ").replace("Kubrow Collar Blueprint", "Blueprint"),
							value: parseFloat(columns.eq(1).text().trim().match(/\((\d+(\.\d+)?)%\)/)?.[1]),
					};
					currentRelic.rewards.push(reward);
			}
			await delay(50);
	});

	if (currentRelic.rewards.length > 0) {
			relicRewards.push(currentRelic);
	}

	if (msg) {
			await msg.edit({ content: `\`\`\`DONE Fetching data...\nCreating Records...\`\`\`` });
	}

	return relicRewards;
}

async function processRelics(relicRewards, stockValues, tokenValues, htmlText, msg) {
	const allRelicData = [];
	const allPrimeData = [];
	const orderToSortBy = [25.33, 11, 2];

	for (const relic of relicRewards) {
			const trueName = relic.name.split(" ").slice(0, -2).join(" ");
			if (trueName.includes("Requiem")) continue;

			const trueType = relic.name.split(" ").slice(-1)[0];
			if (trueType !== "(Intact)") {
					continue;
			} else {
					const currentRewards = [];

					for (const reward of relic.rewards) {
							let rewardName = normalize(reward.name.replace(/\s+/g, " ").replace(" and ", " & ").replace("2X ", ""));
							rewardName = rewardName.endsWith(" Prime") ? rewardName.replace(" Prime", " Blueprint") : rewardName;
							const stock = stockValues[rewardName];

							currentRewards.push({
									item: `${rewardName}`,
									x2: dualitemslist.includes(rewardName),
									stock: stock || (rewardName.includes("Forma") ? null : 0),
									color: range(parseInt(stock) || 0),
									rarity: parseFloat(reward.value),
									relicFrom: trueName,
							})
					};

					allPrimeData.push(...currentRewards);
					allRelicData.push({
							name: trueName,
							rewards: currentRewards.sort((a, b) => orderToSortBy.indexOf(a.rarity) - orderToSortBy.indexOf(b.rarity)),
							tokens: tokenValues[trueName],
							vaulted: await searchForDrops(htmlText, trueName),
					});
			}
	}

	if (msg) {
			await msg.edit({ content: `\`\`\`DONE Fetching data...\nDONE Creating Records...\nUpdating DB...\`\`\`` });
	}

	const filteredAllPrimeData = [];

	for (const part of allPrimeData) {
			const existingPart = filteredAllPrimeData.find(p => p.item === part.item);
			if (existingPart) {
					existingPart.relicFrom.push(part.relicFrom);
			} else {
					filteredAllPrimeData.push({ ...part, relicFrom: [part.relicFrom] });
			}
	}

	return { relics: allRelicData, primes: filteredAllPrimeData };
}