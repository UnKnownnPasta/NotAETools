const { EmbedBuilder, codeBlock, ButtonStyle, Message, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const fs = require("node:fs/promises");
const { Pagination, ExtraRowPosition } = require("pagination.djs");
const { filterRelic, titleCase } = require("../scripts/utility.js");
const path = require("node:path");
const { getAllBoxData } = require("../scripts/dbcreate.js");

const range = (num) => 
    num >= 0 && num <= 11 ? 'ED'
    : num > 11 && num <= 23 ? 'RED'
    : num > 23 && num <= 39 ? 'ORANGE'
    : num > 39 && num <= 59 ? 'YELLOW'
    : num > 59 ? 'GREEN' : '';

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
    "ED": "0 - 11",
    "RED": "12 - 23",
    "ORANGE": "24 - 39",
    "YELLOW": "40 - 59",
    "GREEN": "60 - inf",
}

module.exports = {
    name: "anycmd",
    /**
     * ++ Commands manager
     * @param {Message} message 
     */
    async execute(client, message, msg_unfiltered, command_type) {
        const partRarities = ["C", "C", "C", "UC", "UC", "RA"];

        const rdata = await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json'));
        const collection_box = await getAllBoxData(client);
        const relic_data = await JSON.parse(rdata);

        const word = titleCase(msg_unfiltered.replace(/\s*(-)(b|box)?\s*.*?$/, ""));
        const hasdashb = true; //msg_unfiltered.match(/-(?:b|box)/, "") !== null
        const wordToUpper = word.toUpperCase()

        switch (command_type) {
            case "status":
                const statusParts = []

                for (const relic of relic_data.relicData) {
                    for (const part of relic.rewards) {
                        partItem = part.item.replace(" x2", "")
                        if (partItem === "Forma") continue;
                        let partStock = parseInt(part.stock)
                        let partColor = part.color
                        if (hasdashb) {
                            partStock = partStock + (collection_box[`${partItem}`] ?? 0)
                            partColor = range(partStock)
                        }
                        if (partColor !== wordToUpper) continue;
                        statusParts.push({ s: partStock, i: part.item })
                    }
                }

                const sortedParts = [... new Set(statusParts.sort((a, b) => a.s - b.s).map((part) => {
                    return `${`[${part.s}]`.padEnd(5)}│ ${part.i}`
                    })
                )]

                const baseStatusEmbed = new EmbedBuilder()
                .setTitle(`[ ${wordToUpper} ]`)
                .setColor(hex[wordToUpper])
                .setFooter({ text: `Parts with: ${stockRanges[word.toUpperCase()]} stock  •  ${sortedParts.length} results` })
                .setTimestamp();

                if (!sortedParts.length) {
                    return message.reply({ embeds: [baseStatusEmbed] })
                }

                const embedsArrStatus = []
                for (let i = 0; i < sortedParts.length; i += 15) {
                    embedsArrStatus.push(
                        new EmbedBuilder(baseStatusEmbed)
                        .setDescription(codeBlock('ml', sortedParts.slice(i, i + 15).join('\n')))
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
                        text: embed.data.footer.text + `  •  Page ${index + 1}/${array.length}`,
                    });
                });
                statusPagination.render();
                break;

            case "part":
                if (word.split(/\s+/g).length === 1) return;
                const partRelics = [];
                let realName = ""
                let realStock = 0
                let realColor = ""
                let extraCount = ""

                for (const relic of relic_data.relicData) {
                    const partIndex = relic.parts.findIndex((part) => part?.replace(" x2", "").startsWith(word))
                    if (partIndex === -1) continue;

                    const relicIndexOfReward = relic.rewards[partIndex]
                    if (!realName) {
                        realName = relicIndexOfReward.item
                        realStock = relicIndexOfReward.stock
                        realColor = relicIndexOfReward.color
                    }
                    if (hasdashb) {
                        extraCount = `(+${collection_box[realName.replace(" x2", "")] ?? 0})`;
                        realColor = range((collection_box[realName.replace(" x2", "")] ?? 0) + parseInt(relicIndexOfReward.stock))
                    }
                    partRelics.push({ r: relic.name, t: relic.tokens, c: partRarities[partIndex], v: relic.vaulted ? 'V' : 'UV' })
                }
                if (!partRelics.length) return;

                const sortedRelics = partRelics.sort((a, b) => parseInt(b.t) - parseInt(a.t)).map((part) => {
                    return `${part.c.padEnd(2)} │ ${part.r} {${part.t}} {${part.v}}`
                })

                const searchSoupPart = new ButtonBuilder()
                .setCustomId(`searchsoup-part-${realName.replace(" x2", "")}`)
                .setLabel('🔎 Soup Store')
                .setStyle(ButtonStyle.Secondary);
                const soupButtonPart = new ActionRowBuilder().addComponents(searchSoupPart)

                if (sortedRelics.length < 17) {
                    const embedsParts = new EmbedBuilder()
                    .setTitle(`[ ${realName} ]`)
                    .setDescription(codeBlock('ml', sortedRelics.join('\n')))
                    .setColor(hex[realColor])
                    .setFooter({ 
                        text: `${realStock}${extraCount}x of part in stock  •  ${sortedRelics.length} results`
                    })
                    .setTimestamp();

                    await message.reply({ embeds: [embedsParts], components: [soupButtonPart] })
                } else {
                    const baseEmbed = new EmbedBuilder()
                    .setColor(hex[realColor])
                    .setFooter({ 
                        text: `${realStock}${extraCount}x of part in stock  •  ${sortedRelics.length} results`
                    })
                    .setTimestamp();

                    const partEmbedArr = []
                    for (let i = 0; i < sortedRelics.length; i += 17) {
                        partEmbedArr.push(new EmbedBuilder(baseEmbed).setDescription(codeBlock('ml', sortedRelics.slice(i, i+17).join("\n"))))
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
    
                    partPagination.setEmbeds(partEmbedArr, (embed, index, array) => {
                        return embed.setTitle(`[ ${realName} ] ${index+1}/${partEmbedArr.length}`);
                    });
                    partPagination.addActionRows([soupButtonPart], ExtraRowPosition.Below);
                    partPagination.render();
                }
                break;

            case "prime":
                let setName = word.replace("Prime", "").trim();
                if (setName === "Mag") setName = "Mag ";
                if (setName === "Bo") setName = "Bo ";
                
                let relicCount = 0;
                const setParts = []
                for (const relic of relic_data.relicData) {
                    let partsFound = 0;
                    const relicParts = relic.parts;
                    for (let index = 0; index < relicParts.length; index++) {
                        const p = relicParts[index];
                        if (!p?.startsWith(setName)) continue;

                        const partOfSet = relic.rewards[index]
                        if (!setParts.some((rec) => rec.r === relic.name)) {
                            partsFound += 1;
                        }
                        if (setParts.some((rec) => rec.n === partOfSet.item)) continue;

                        let stockOfSetPart = parseInt(partOfSet.stock);
                        let extraStock = 0;
                        let colorOfPart = partOfSet.color;
                        if (hasdashb) {
                            extraStock = collection_box[partOfSet.item.replace(" x2", "")] ?? 0
                            colorOfPart = range(stockOfSetPart + extraStock)
                        }

                        setParts.push({ s: stockOfSetPart, ex: extraStock, n: partOfSet.item, c: colorOfPart, r: relic.name })
                    }
                    relicCount += partsFound;
                }
                if (!setParts.length) return;

                let colorOfParts = []
                let stockOfParts = []
                let boxStockOfParts = []
                const setPartsText = setParts.map((part) => {
                    colorOfParts.push(part.c)
                    stockOfParts.push(part.s)
                    if (hasdashb) {
                        boxStockOfParts.push(part.ex)
                        return `${`${part.s}(+${part.ex})`.padEnd(8)}│ ${part.n} {${part.c}}`
                    } else {
                        return `${`${part.s}`.padEnd(3)}│ ${part.n} {${part.c}}`
                    }
                })
                colorOfParts = uncodeObj[Math.min(...colorOfParts.map(color => codeObj[color]))]
                stockOfParts = Math.min(...stockOfParts)
                boxStockOfParts = boxStockOfParts.filter(x => x)
                if (boxStockOfParts.length) {
                    boxStockOfParts = Math.min(...boxStockOfParts);
                } else {
                    boxStockOfParts = 0;
                }

                const setPartArr = setParts[0].n.split(/\s+/g)
                const nameConstruct = [setPartArr[0]]
                const partTypes = ['BP', 'x2', 'Blueprint', 'Chassis', 'Neuroptics', 'Systems', 'Barrel', 'Receiver', 'Stock', 'Grip', 'Lower Limb', 'String', 'Upper Limb', 'Limb', 'Blade', 'Blades', 'Handle', 'Link', 'Pouch', 'Stars', 'Gauntlet', 'Ornament', 'Head', 'Disc', 'Boot', 'Hilt', 'Chain', 'Guard', 'Carapace', 'Cerebrum', 'Band', 'Buckle', 'Harness', 'Wings'];
                setPartArr.slice(1).map((n, i) => {
                    !partTypes.some(y => y.startsWith(n)) ? nameConstruct.push(n) : ''
                })

                const searchSoupSet = new ButtonBuilder()
                .setCustomId(`searchsoup-set-${word.includes('Prime') ? word.replace("Prime", "").trim() : nameConstruct.join(' ')}`.trim())
                .setLabel('🔎 Soup Store')
                .setStyle(ButtonStyle.Secondary);
                const soupButtonSet = new ActionRowBuilder().addComponents(searchSoupSet)

                message.reply({ embeds: [
                    new EmbedBuilder()
                    .setTitle(`[ ${word.includes('Prime') ? word.replace("Prime", "").trim() : nameConstruct.join(' ')} Prime ]`)
                    .setFooter({ text: `${stockOfParts}(+${boxStockOfParts})x currently in stock  •  ${colorOfParts} Set  •  Inside of ${relicCount} relics` })
                    .setTimestamp()
                    .setDescription(codeBlock("ml", setPartsText.join("\n")))
                    .setColor(hex[colorOfParts])
                ], components: [soupButtonSet] })
                break;

            case "relic":
                const properRelicName = filterRelic(word.toLowerCase())
                const relicToFind = relic_data.relicData.filter((relic) => relic.name === properRelicName)
                if (relicToFind.length === 0) return;
                const relicFound = relicToFind[0]
                let allStocks = []
                const relicDesc = Array.from({ length: 6 })

                const relicRewards = relicFound.rewards;
                for (const [i, part] of Object.entries(relicRewards)) {
                    const indexRarity = partRarities[parseInt(i)]
                    partItem = part.item.replace(" x2", "")
                    if (partItem === 'Forma') {
                        if (hasdashb) {
                            relicDesc[relicRewards.indexOf(part)] =  `${indexRarity.padEnd(2)} │         │ Forma`;
                            continue
                        } else {
                            relicDesc[relicRewards.indexOf(part)] =  `${indexRarity.padEnd(2)} │    │ Forma`;
                            continue;
                        }
                    }
                    let partStock = parseInt(part.stock)
                    let extraStock = ""
                    if (hasdashb) {
                        extraStock = `(+${collection_box[partItem] ?? 0})`
                    }
                    let totalStock = partStock + (collection_box[partItem] ?? 0)
                    allStocks.push(hasdashb ? totalStock : partStock)
                    relicDesc[relicRewards.indexOf(part)] = `${indexRarity.padEnd(2)} │ ${`${partStock}${extraStock}`.padEnd(!extraStock ? 3 : 8)}│ ${part.item} {${range(hasdashb ? totalStock : partStock)}}`
                }
                
                allStocks = range(Math.min(...allStocks))

                const searchSoupRelic = new ButtonBuilder()
                .setCustomId(`searchsoup-relic-${properRelicName.trim()}`)
                .setLabel('🔎 Soup Store')
                .setStyle(ButtonStyle.Secondary);
                const soupButtonRelic = new ActionRowBuilder().addComponents(searchSoupRelic)

                message.reply({ embeds: [
                    new EmbedBuilder()
                    .setTitle(`[ ${properRelicName} ] {${relicFound.tokens}} {${relicFound.vaulted ? 'V' : 'UV'}}`)
                    .setDescription(codeBlock('ml', relicDesc.join("\n")))
                    .setFooter({ 
                        text: `Viewing ${relicFound.name.split(" ")[0]} Void relic  •  Stock from Tracker + Box  •  ${allStocks} relic  `
                    })
                    .setColor(hex[allStocks])
                    .setTimestamp()
                ], components: [soupButtonRelic] })
                break;

            default:
                break;
        }
    },
};