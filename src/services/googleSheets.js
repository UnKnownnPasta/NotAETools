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
import entityClassifierInstance from "./nlp.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..');
import crypto from "node:crypto";

const googleSheets = async ({ spreadsheetId, range }) => {
	return google.sheets("v4").spreadsheets.values.get({
		auth: process.env.GOOGLE_APIKEY,
		spreadsheetId: spreadsheetId,
		range: range,
	});
};

function searchForDrops(htmlText, searchString) {
	let count = 0;
	let position = 0;

	while (position !== -1) {
		position = htmlText.indexOf(searchString, position);

		if (position !== -1) {
			count++;
			position += searchString.length;
			if (count > 5) return false;
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
	const specialID = crypto.randomBytes(20).toString('hex');
	console.time(`google::fetchData [${specialID}]`);
	console.log(`@time ${new Date().toLocaleString()} fetchData() started`);

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
	if (msg) await msg.edit({ content: `\`\`\`[1/4] Fetching data...\`\`\`` });

	stockValues["Venka Blades"] = stockValues["Venka Blade"] || 0;
	delete stockValues["Venka Blade"];

	try {
			const url = "https://warframe-web-assets.nyc3.cdn.digitaloceanspaces.com/uploads/cms/hnfvc0o3jnfvc873njb03enrf56.html";
			const response = await axios.get(url);

			const htmlText = response.data;
			const extractedHtml = htmlText.match(/<h3 id="relicRewards">.*?(?=<h3 id="keyRewards">)/s)?.[0] || "";
			const $ = cheerio.load(extractedHtml);
			const tables = $("table tbody tr");

			if (msg) await msg.edit({ content: `\`\`\`[2/4] Processing data...\`\`\`` });
			
			const relicRewards = processTables($, tables, msg);
			if (msg) await msg.edit({ content: `\`\`\`[3/4] Processing data...\nDONE Creating Records...\`\`\`` });
			const PrimeData = processRelics(relicRewards, stockValues, tokenValues, htmlText, msg);
			if (msg) await msg.edit({ content: `\`\`\`DONE Processing data...\nDONE Creating Records...\nUpdating DB...\`\`\`` });

			await fs.promises.writeFile(path.join(__dirname, '..', 'data', 'relicsdb.json'), JSON.stringify(PrimeData)).then(async () => {
				await relicCacheManager.setRelicCache();
				await relicCacheManager.setSoupCache();
				await entityClassifierInstance.updateLocalData();
			});

			if (msg) {
				await msg.edit({ content: `\`\`\`DONE Processing data...\nDONE Creating Records...\nDONE Updating DB... ✅\`\`\`` });
				ogmsg.react('✔');

				setTimeout(async () => {
					await msg.delete();
				}, 2_000);
			}
	} catch (error) {
			console.error("Error fetching relic rewards:", error);
			if (msg) {
					await msg.edit({ content: `Couldn't update database. Error: ${error.message}` });
					ogmsg.react('❌');
			}
			return [];
	} finally {
			console.timeEnd(`google::fetchData [${specialID}]`);
	}
}

/**
 * 
 * @param {import('cheerio').CheerioAPI} $ 
 * @param {import('cheerio').Cheerio<Element>} data 
 * @param {*} msg 
 * @returns 
 */
function processTables($, data) {
	const relicRewards = [];
	let currentRelic = { rewards: [] };
	const dataSet = data.toArray();

	for (let i = 0; i < dataSet.length; i++) {
			const row = dataSet[i];
			const columns = $(row).find("td");
			const textName = $(row).find("th").text().trim();

			if ($(row).hasClass("blank-row")) {
					if (currentRelic.rewards.length > 0) {
							relicRewards.push(currentRelic);
							currentRelic = { rewards: [] };
					}
					continue;
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
	}

	if (currentRelic.rewards.length > 0) {
			relicRewards.push(currentRelic);
	}

	return relicRewards;
}

function processRelics(relicRewards, stockValues, tokenValues, htmlText) {
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
									color: (rewardName.includes("Forma") ? 'GREEN' : range(parseInt(stock) || 0)),
									rarity: parseFloat(reward.value),
									relicFrom: trueName,
							})
					};

					allPrimeData.push(...currentRewards);
					allRelicData.push({
							name: trueName,
							rewards: currentRewards.sort((a, b) => orderToSortBy.indexOf(a.rarity) - orderToSortBy.indexOf(b.rarity)),
							tokens: tokenValues[trueName],
							vaulted: searchForDrops(htmlText, `${trueName.trim()} Relic`),
					});
			}
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

export async function getAllClanData(clan=undefined) {
	if (!clan) {
			return await Promise.all(Object.entries(spreadsheet.farmer.ranges.resource).map(async (key) => {
					const clandata = await googleSheets({
							spreadsheetId: spreadsheet.farmer.id,
							range: spreadsheet.farmer.resourceName + key[1]
					})
					if (!clandata) return { clan: key[0], resource: {} };
	
					let localist = {};
					await Promise.all(clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' }))
					return { clan: key[0], resource: localist };
			}))
			.then(async (results) => {
					return results.filter(res => res);
			})
			.catch(error => {
					logger.error(error, 'Error fetching sheet values for clans');
			});
	} else {
			const clandata = await googleSheets({
					spreadsheetId: spreadsheet.farmer.id,
					range: spreadsheet.farmer.resourceName + spreadsheet.farmer.ranges.resource[clan]
			})
			if (!clandata) return { clan: clan, resource: {} };

			let localist = {};
			 clandata.data.values.map(x => localist[x[0]] = { amt: x[1], short: x[2] ?? '0' })
			return { clan: clan, resource: localist };
	}
}

export async function getAllLeaderboardData() {
	try {
		const re = await googleSheets({
			spreadsheetId: '1Mrp2qcFY9CO8V-MndnYCkkVBJ-f_U_zeK-oq3Ncashk',
			range: 'Leaderboard!D29:I'
		});

		const rows = re?.data?.values || [];
		return rows.map((data) => {
			if (!data || data.filter(x => !x).length > 1) return;
			const run = parseInt(data[4], 10) || 0;
			const rad = parseInt(data[3], 10) || 0;
			const merch = parseInt(data[2], 10) || 0;
			const userid = (data[1] || '').replace('ID: ', '');
			return { uid: userid === '' ? '000000' : userid, name: !data[0] ? '#NF!' : data[0], all: run + rad + merch, run, rad, merch };
		}).filter(Boolean);
	} catch (error) {
		console.error('Error fetching leaderboard data:', error);
		return [];
	}
}
