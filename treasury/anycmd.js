const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require("discord.js");
const fs = require("node:fs/promises");
const { Pagination } = require("pagination.djs");
const { filterRelic, titleCase } = require("../scripts/utility.js");
const path = require("node:path");

const range = (num) => {
    return num >= 0 && num <= 7 ? 'ED'
           : num > 7 && num <= 15 ? 'RED'
           : num > 15 && num <=31 ? 'ORANGE'
           : num > 31 && num <=64 ? 'YELLOW'
           : 'GREEN'
}

const codeObj = {
    "ED": 0,
    "RED": 1,
    "ORANGE": 2,
    "YELLOW": 3,
    "GREEN": 4,
}

const uncodeObj = {
    0: "ED",
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN"
}

const hex = {
    "ED": "#351c75",
    "RED": "#990000",
    "ORANGE": "#b45f06",
    "YELLOW": "#bf9000",
    "GREEN": "#38761d",
}

const stockRanges = {
    "ED": "0 - 7",
    "RED": "8 - 15",
    "ORANGE": "16 - 31",
    "YELLOW": "32 - 64",
    "GREEN": "64 - inf",
}

module.exports = {
    name: "anycmd",
    /**
     * ++ Commands manager
     * @param {Message} message 
     */
    async execute(client, message, msg_unfiltered, command_type) {
        const [fetchRelicData, fetchCollectionBox] = await Promise.all([
            fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')),
            fs.readFile(path.join(__dirname, '..', 'data', 'BoxData.json'))
        ]);

        const [relic_data, collection_box] = await Promise.all([
            JSON.parse(fetchRelicData), JSON.parse(fetchCollectionBox)
        ])

        const word = titleCase(msg_unfiltered.replace(/\s*(-)(b|box)?\s*.*?$/, ""));
        let hasdashb = msg_unfiltered.match(/-(?:b|box)/, "") !== null
        // let hasdashr = msg_unfiltered.match(/-(?:r)/, "") !== null
        const wordToUpper = word.toUpperCase()

        switch (command_type) {
            case "status":
            const statusParts = []

            await Promise.all(relic_data.relicData.map(async (relic) => {
                const relicRewards = relic.rewards;
                await Promise.all(relicRewards.map((part) => {
                    if (part.item === "Forma") return;
                    let partStock = parseInt(part.stock)
                    let partColor = part.color
                    if (hasdashb) {
                        partStock = partStock + (collection_box[part.item] ?? 0)
                        partColor = range(partStock)
                    }
                    if (partColor === wordToUpper) {
                        statusParts.push({ s: partStock, i: part.item })
                    }
                }))
            }))

            const sortedParts = [... new Set(statusParts.sort((a, b) => a.s - b.s).map((part) => {
                return `${`[${part.s}]`.padEnd(5)}| ${part.i}`
                })
            )]

            const embedsArrStatus = []
            for (let i = 0; i < sortedParts.length; i += 15) {
                embedsArrStatus.push(
                    new EmbedBuilder()
                    .setTitle(`[ ${wordToUpper} ]`)
                    .setDescription(codeBlock('ml', sortedParts.slice(i, i + 15).join('\n')))
                    .setColor(hex[wordToUpper])
                    .setTimestamp()
                )
            }

            const statusPagination = new Pagination(message, {
                firstEmoji: "⏮",
                prevEmoji: "◀️",
                nextEmoji: "▶️",
                lastEmoji: "⏭",
                idle: 240_000,
                buttonStyle: ButtonStyle.Secondary,
                loop: true,
            });

            statusPagination.setEmbeds(embedsArrStatus, (embed, index, array) => {
                return embed.setFooter({
                    text: `${hasdashb ? `Updated from box  • ` : `Stock from Tracker  • `} ${stockRanges[word.toUpperCase()]} stock  •  Page ${index + 1}/${array.length}  `,
                });
            });
            statusPagination.render();
                break;
        
            case "part":
            if (!relic_data.partNames.some(part => part.startsWith(word))) return;

            const partRarities = ["C", "C", "C", "UC", "UC", "RA"];
            const partRelics = [];
            let realName = ""
            let realStock = 0
            let realColor = ""
            let extraCount = ""

            await Promise.all(relic_data.relicData.map((relic) => {
                const partIndex = relic.parts.findIndex((part) => part?.startsWith(word))
                if (partIndex === -1) return;
                realName = relic.rewards[partIndex].item
                realStock = relic.rewards[partIndex].stock
                realColor = relic.rewards[partIndex].color
                if (hasdashb) extraCount = `(+${collection_box[realName] ?? 0})`;
                partRelics.push({ r: relic.name, t: relic.tokens, c: partRarities[partIndex] })
            }))

            const sortedRelics = partRelics.sort((a, b) => parseInt(b.t) - parseInt(a.t)).map((part) => {
                return `${part.c.padEnd(2)} | ${part.r} {${part.t}}`
            })

            const embedsParts = new EmbedBuilder()
                .setTitle(`[ ${realName} ]`)
                .setDescription(codeBlock('ml', sortedRelics.join('\n')))
                .setColor(hex[realColor])
                .setFooter({ 
                    text: `${hasdashb ? `Updated from box  • ` : `Stock from Tracker  • `} ${realStock}${extraCount}x of part in stock  •  ${sortedRelics.length} results`
                })

            await message.reply({ embeds: [embedsParts] })
                break;

            case "prime":
            const setName = word.replace("Prime", "").trim() + " ";

            const setParts = []
            await Promise.all(relic_data.relicData.map((relic) => {
                const partExistsIndex = relic.parts.findIndex(part => part?.startsWith(setName))
                if (partExistsIndex === -1) return;

                const partOfSet = relic.rewards[partExistsIndex]
                if (setParts.some((rec) => rec.n === partOfSet.item)) return;

                let stockOfSetPart = parseInt(partOfSet.stock);
                let extraStock = 0;
                let colorOfPart = partOfSet.color
                if (hasdashb) {
                    extraStock = collection_box[partOfSet.item] ?? 0
                    colorOfPart = range(stockOfSetPart + extraStock)
                }

                setParts.push({ s: stockOfSetPart, ex: extraStock, n: partOfSet.item, c: colorOfPart })
            }))

            let colorOfParts = []
            let stockOfParts = []
            const setPartsText = setParts.map((part) => {
                colorOfParts.push(part.c)
                stockOfParts.push(part.s + part.ex)
                if (hasdashb) {
                    return `${`${part.s}(${part.ex})`.padEnd(7)}| ${part.n} {${part.c}}`
                } else {
                    return `${`${part.s}`.padEnd(3)}| ${part.n} {${part.c}}`
                }
            })
            colorOfParts = uncodeObj[Math.min(...colorOfParts.map(color => codeObj[color]))]
            stockOfParts = Math.min(...stockOfParts)

            message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${word} ]`)
                .setFooter({ text: `${hasdashb ? `Updated from box  • ` : `Stock from Tracker  • `} ${stockOfParts}x of set in stock  •  ${colorOfParts} Set  ` })
                .setTimestamp()
                .setDescription(codeBlock("ml", setPartsText.join("\n")))
                .setColor(hex[colorOfParts])
            ] })
                break;

            case "relic":
            const properRelicName = filterRelic(word.toLowerCase())
            const relicToFind = relic_data.relicData.filter((relic) => relic.name === properRelicName)
            if (relicToFind.length === 0) return;
            const relicFound = relicToFind[0]
            let allStocks = []

            const relicDesc = relicFound.rewards.map((part) => {
                if (part.item === 'Forma') {
                    if (hasdashb) return `       | Forma`;
                    else return `   | Forma`;
                }
                let partStock = parseInt(part.stock)
                let extraStock = ""
                if (hasdashb) {
                    extraStock = `(${collection_box[part.item] ?? 0})`
                }
                allStocks.push(partStock + (collection_box[part.item] ?? 0))
                return `${`${partStock}${extraStock}`.padEnd(!extraStock ? 3 : 7)}| ${part.item} {${part.color}}`
            })
            allStocks = range(Math.min(...allStocks))

            message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${properRelicName} ] {${relicFound.tokens}}`)
                .setDescription(codeBlock('ml', relicDesc.join("\n")))
                .setFooter({ text: `Showing ${relicFound.name.split(" ")[0]} Void relic  •  ${hasdashb ? `Updated from box  • ` : `Stock from Tracker  • `} ${allStocks} relic  ` })
                .setColor(hex[allStocks])
                .setTimestamp()
            ] })
                break;

            default:
                break;
        }
    },
};