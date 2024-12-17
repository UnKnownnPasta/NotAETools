import { titleCase } from "./utils.js";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

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
                else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
        return dp[a.length][b.length];
    };
    const maxLen = Math.max(str1.length, str2.length);
    return (maxLen - editDistance(str1, str2)) / maxLen;
}

class EntityClassifier {
    constructor() {
        this.data = {
            relics: {
                keywords: ["lith", "meso", "neo", "axi"],
                details: {
                    lith: [], meso: [], neo: [], axi: [],
                }
            },
            primes: {
                keywords: [],
                details: {}
            },
            status: {
                keywords: ['ed', 'red', 'orange', 'yellow', 'green']
            }
        };
    }

    async updateLocalData() {
        const parsedData = await JSON.parse(readFileSync(join(__dirname, '../data/relics.json'), 'utf-8'));
        const rdata = parsedData.relics;
        const pdata = parsedData.primes;

        const relicData = { lith: [], meso: [], neo: [], axi: [] };
        for (const r of rdata) {
            const [name, type] = r.name.split(' ')
            relicData[name.toLowerCase()].push(type);
        }
        this.data.relics.details = relicData;

        const deepData__primes = [];
        for (const p of pdata) {
            if (p.item == 'Forma') continue;
            const lArray = deepData__primes.find(x => x.some(y => y.split(' ')[0] == p.item.split(' ')[0]))
            if (lArray) {
                lArray.push(p.item);
            } else {
                deepData__primes.push([p.item]);
            }
        }
        
        let deep__primes_kws = [];
        let deep__primes_details = {};
        for (const group of deepData__primes) {
            const types = group.map((item) => item.split(' ').slice(-1)[0]); // Get the last word
            const names = group.map((item) => item.split(' ').slice(0, -1).join(' ')); // Everything but the last word
            deep__primes_kws.push(names[0]);
            if (!deep__primes_details[names[0]]) deep__primes_details[names[0]] = [];
            deep__primes_details[names[0]].push(...[... new Set(types)]);
        }
        deep__primes_kws = [...new Set(deep__primes_kws)];
        
        this.data.primes.keywords = deep__primes_kws;
        this.data.primes.details = deep__primes_details;
    }

    classifyEntity(input) {
        const tokens = titleCase(input).toLowerCase().split(/\s+/);
    
        let bestMatch = { category: "unknown", entity: "unknown", detail: "unknown", score: 0 };
    
        for (let cat in this.data) {
            const keywords = this.data[cat].keywords;

            // Special handling for "status"
            if (cat === "status") {
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
                    break;
                }
                continue;
            }

            // Special handling for relics
            if (cat === "relics") {
                tokens.forEach((token) => {
                    const relicEntityMatch = keywords.find(
                        (keyword) => similarity(keyword, token) > 0.8 // Strict match for relic entities
                    );
    
                    if (relicEntityMatch) {
                        const relicDetails = this.data[cat].details[relicEntityMatch] || [];
                        const relicDetailMatch = relicDetails.find((detail) =>
                            tokens.some((token) => similarity(detail.toLowerCase(), token) > 0.8)
                        );
    
                        if (relicDetailMatch) {
                            bestMatch = {
                                category: cat,
                                entity: relicEntityMatch.charAt(0).toUpperCase() + relicEntityMatch.slice(1),
                                detail: relicDetailMatch,
                                score: 1, // Relics are definitive matches
                            };
                        }
                    }
                });
    
                if (bestMatch.category === "relics") {
                    break;
                }
                continue; // Skip further processing for relics
            }
    
            // Process other categories (e.g., primes)
            keywords.forEach((keyword) => {
                const keywordTokens = keyword.toLowerCase().split(/\s+/);
                const keywordScore = keywordTokens.reduce(
                    (score, kw) =>
                        score + Math.max(...tokens.map((token) => similarity(kw, token))),
                    0
                ) / keywordTokens.length;
    
                if (keywordScore > bestMatch.score && keywordScore > 0.4) {
                    bestMatch.category = cat;
                    bestMatch.entity = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                    bestMatch.score = keywordScore;
    
                    // Match specific details (e.g., neuroptics)
                    const details = this.data[cat].details[keyword] || [];
                    const detailMatch = details
                        .map((detail) => {
                            const detailTokens = detail.toLowerCase().split(/\s+/);
                            const detailScore = detailTokens.reduce(
                                (score, dt) =>
                                    score +
                                    Math.max(
                                        ...tokens.map((token) =>
                                            similarity(dt, token) > 0.4 ? similarity(dt, token) : 0
                                        )
                                    ),
                                0
                            ) / detailTokens.length;
                            return { detail, score: detailScore };
                        })
                        .sort((a, b) => b.score - a.score)[0];
    
                    if (detailMatch && detailMatch.score > 0.4) {
                        bestMatch.detail = detailMatch.detail;
                    }
                }
            });
        }
    
        return bestMatch;
    }
}

const entityClassifierInstance = new EntityClassifier();

export default entityClassifierInstance;