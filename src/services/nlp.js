import { isRelicFF, titleCase } from "./utils.js";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

// Function to calculate similarity
function similarity(str1, str2) {
	const editDistance = (a, b) => {
		const dp = Array.from({ length: a.length + 1 }, (_, i) =>
			Array(b.length + 1).fill(0)
		);
		for (let i = 0; i <= a.length; i++) dp[i][0] = i;
		for (let j = 0; j <= b.length; j++) dp[0][j] = j;

		for (let i = 1; i <= a.length; i++) {
			for (let j = 1; j <= b.length; j++) {
				if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
				else
					dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
			}
		}
		return dp[a.length][b.length];
	};
	const maxLen = Math.max(str1.length, str2.length);
	return (
		(maxLen - editDistance(str1, str2)) / maxLen +
		(str1.startsWith(str2) ? 0.3 : -0.1)
	);
}

class EntityClassifier {
	constructor() {
		this.data = {
			status: {
				keywords: ["ed", "red", "orange", "yellow", "green"],
			},
			relics: {
				keywords: ["lith", "meso", "neo", "axi"],
				details: {
					lith: [],
					meso: [],
					neo: [],
					axi: [],
				},
			},
			primes: {
				keywords: [],
				details: {},
			},
		};
	}

	async updateLocalData() {
		console.time("nlp::updateLocalData");
		const parsedData = await JSON.parse(
			readFileSync(join(__dirname, "../data/relicsdb.json"), "utf-8")
		);
		const rdata = parsedData.relics;
		const pdata = parsedData.primes;

		const relicData = { lith: [], meso: [], neo: [], axi: [] };
		for (const r of rdata) {
			const [name, type] = r.name.split(" ");
			relicData[name.toLowerCase()].push(type);
		}
		this.data.relics.details = relicData;

		const deepData__primes = [];
		for (const p of pdata) {
			if (p.item == "Forma") continue;
			const lArray = deepData__primes.find((x) =>x.some((y) => y.split(" ")[0] == p.item.split(" ")[0]));
			if (lArray) {
				lArray.push(p.item);
			} else {
				deepData__primes.push([p.item]);
			}
		}

		let deep__primes_kws = [];
		let deep__primes_details = {};
		for (const group of deepData__primes) {
			const splitItems = group.map((item) => item.split(" "));

			// Find the common prefix
			const commonPrefix = [];
			for (let i = 0; i < splitItems[0].length; i++) {
				const word = splitItems[0][i];
				if (splitItems.every((parts) => parts[i] === word)) {
					commonPrefix.push(word);
				} else {
					break;
				}
			}

			const commonName = commonPrefix.join(" "); // Combine common words for the keyword
			const details = group.map((item) =>
				item.split(" ").slice(commonPrefix.length).join(" ")
			); // Remaining words as details

			deep__primes_kws.push(commonName);
			if (!deep__primes_details[commonName])
				deep__primes_details[commonName] = [];
			deep__primes_details[commonName].push(...new Set(details));
		}
		deep__primes_kws = [...new Set(deep__primes_kws)];

		this.data.primes.keywords = deep__primes_kws;
		this.data.primes.details = deep__primes_details;

		console.timeEnd("nlp::updateLocalData");
	}

	classifyEntity(input) {
		let bestMatch = {
			category: "unknown",
			entity: "unknown",
			detail: "unknown",
			score: 0,
		};
		if (!input || !this.data.primes.keywords) return bestMatch;
		let tokens = titleCase(input).toLowerCase().split(/\s+/);

		entityLoop: for (let cat in this.data) {
			const keywords = this.data[cat].keywords;

			// Special handling for status
			switch (cat) {
				case "status":
					const statusMatch = keywords.find((keyword) =>
						tokens.some((token) => similarity(keyword, token) > 0.8)
					);

					if (statusMatch) {
						bestMatch = {
							category: cat,
							entity: statusMatch,
							detail: tokens.slice(1).join(" "),
							score: 1, // Status is a definitive match
						};
						break entityLoop;
					}
					break;

				case "relics":
					let rTokens = isRelicFF(input)
					if (!rTokens) continue;
					rTokens = rTokens.toLowerCase().split(/\s+/);
					rTokens.forEach((token) => {
						const relicEntityMatch = keywords.find(
							(keyword) => similarity(keyword, token) > 0.8
						);

						if (relicEntityMatch) {
							const relicDetails =
								this.data[cat].details[relicEntityMatch] || [];
							const relicDetailMatch = relicDetails.find((detail) =>
								rTokens.some(
									(token) => similarity(detail.toLowerCase(), token) > 0.8
								)
							);

							if (relicDetailMatch) {
								bestMatch = {
									category: cat,
									entity:
										relicEntityMatch.charAt(0).toUpperCase() +
										relicEntityMatch.slice(1),
									detail: relicDetailMatch,
									score: 1,
								};
							}
						}
					});
					if (bestMatch.category === "relics") break entityLoop;
					continue;
					break;

				case "primes":
					keywords.forEach((keyword) => {
						const keywordTokens = keyword.toLowerCase().split(/\s+/);

						const keywordScore =
							keywordTokens.reduce((score, kw, kwIndex) => {
								const bestMatch = tokens.map((token, tokenIndex) => {
									const baseSimilarity = similarity(kw, token);
									const positionPenalty = Math.abs(kwIndex - tokenIndex) * 0.08;
									return Math.max(0, baseSimilarity - positionPenalty);
								});
								return score + Math.max(...bestMatch);
							}, 0) / keywordTokens.length;

						if (keywordScore > bestMatch.score && keywordScore > 0.4) {
							bestMatch.category = cat;
							bestMatch.entity =
								keyword.charAt(0).toUpperCase() + keyword.slice(1);
							bestMatch.score = keywordScore;

							const details = this.data[cat].details[keyword] || [];
							const detailMatch = details
								.map((detail) => {
									const detailTokens = detail.toLowerCase().split(/\s+/);
									const detailScore =
										detailTokens.reduce((score, dt) => {
											return (
												score +
												Math.max(
													...tokens.map((token) => similarity(dt, token))
												)
											);
										}, 0) / detailTokens.length;
									return { detail, score: detailScore };
								})
								.sort((a, b) => b.score - a.score)[0];
								
							if (detailMatch && detailMatch.score > 0.4) {
								bestMatch.detail = detailMatch.detail;
							} else {
								bestMatch.detail = "unknown";
							}
						}
					});
					if (bestMatch.category === "primes") break entityLoop;
					break;
			}
		}

		return {
			...bestMatch,
			fullForm: bestMatch.entity + " " + bestMatch.detail,
		};
	}
}

const entityClassifierInstance = new EntityClassifier();

export function extractItems(input) {
	const items = [];
	const parts = input
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/\s*prime\s*/g, ' ')
		.replace(/\(.*?\)/g, "")
		.replace(/<@!?[^>]+>/g, "")
		.replace(/x(\d+)/g, '$1x')
		.replace(/ and /g, " & ")
		.trim()
		.replace(/\b(\d+)\s*x?\s*\b/g, '$1x ')
		.replace(/\b(\d+)\s*x?\b\s*(.*?)\s*/g, '$1x $2, ')
		.split(/(?:(?:, )|(?:\n)|(?:\s(?=\b\d+x?\b)))/);

	const newParts = [];
	for (let i = 0; i < parts.length; i++) {
			if (/\d+x/.test(parts[i]) && i < parts.length - 1) {
					newParts.push(parts[i] + parts[i + 1]);
					i++;
			} else if (i < parts.length - 1 && parts[i + 1].endsWith('x ')) {
					newParts.push(parts[i + 1] + parts[i]);
					i++;
			} else {
					newParts.push(parts[i]);
			}
	}

	const inputParts = newParts.filter(x => /\dx/.test(x));

	// Iterate over each part
	inputParts.forEach((part) => {
			const tokens = part.replace("bp", "Blueprint").replace("rec", "Receiver").replace(/[^0-9 &a-zA-Z]/g, "").trim().split(/\s+/);
			const amountMatch = tokens[0].match(/^(\d+)x$/);
			if (amountMatch) {
					const amount = parseInt(amountMatch[1], 10);
					const itemName = tokens.slice(1).join(" ");
					const classification = entityClassifierInstance.classifyEntity(titleCase(itemName));

					if (classification.category !== "unknown" && classification.entity !== "unknown") {
							items.push({ item: classification.entity + " " + classification.detail, amount });
					}
			}
	});

	return items;
}

export default entityClassifierInstance;
