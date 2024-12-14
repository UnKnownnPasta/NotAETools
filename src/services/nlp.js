import { titleCase } from "./utils";

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
            warframes: {
                keywords: [],
                details: {}
            },
            weapons: {
                keywords: [],
                details: {}
            }
        };
    }

    loadData() {
        
    }

    classifyEntity(input) {
        const tokens = titleCase(input).toLowerCase().split(/\s+/); // dont 

        let bestMatch = { category: "unknown", entity: "unknown", detail: "unknown", score: 0 };
        if (!tokens.length) return bestMatch;
        if (!this.data.warframes.keywords.length || !this.data.weapons.keywords.length) return bestMatch;

        this.data.forEach(dataItem => {
            for (let cat in dataItem) {
                const keywords = dataItem[cat].keywords;

                keywords.forEach((keyword) => {
                    tokens.forEach((token) => {
                        const score = similarity(keyword, token);
                        if (score > bestMatch.score && score > 0.6) {
                            bestMatch.category = cat;
                            bestMatch.entity = keyword.charAt(0).toUpperCase() + keyword.slice(1);
                            bestMatch.score = score;

                            const details = dataItem[cat].details[keyword] || [];
                            const detailMatch = details
                                .map((d) => ({
                                    detail: d,
                                    score: Math.max(
                                        ...tokens.map((t) => similarity(d.toLowerCase(), t))
                                    ),
                                }))
                                .sort((a, b) => b.score - a.score)[0];

                            if (detailMatch && detailMatch.score > 0.6) {
                                bestMatch.detail = detailMatch.detail;
                            }
                        }
                    });
                });
            }
        });

        return { category: bestMatch.category, entity: bestMatch.entity, detail: bestMatch.detail };
    }
}

const EntityClassifierInstance = new EntityClassifier();

export { EntityClassifierInstance };