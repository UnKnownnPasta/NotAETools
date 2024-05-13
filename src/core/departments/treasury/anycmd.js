const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require('discord.js')
const { Pagination } = require('pagination.djs')
const database = require('../../../database/init.js')
const { titleCase, filterRelic, codeObj, uncodeObj, hex, range, stockRanges, rarities } = require('../../../utils/generic.js')
const { QueryTypes } = require('sequelize')
const logger = require('../../../utils/logger.js')

module.exports = {
    name: 'anycmd',
    type: 'message',
    /**
     * ++ Commands manager
     * @param {Message} message
     */
    async execute (client, message, msg_unfiltered, command_type) {
        const models = database.models

        const [item_data, relicData, collection_box] = await Promise.all([
            models.Parts.findAll(),
            models.Relics.findAll(),
            require('../../managers/boxFetch.js')(client)
        ])

        const word = titleCase(msg_unfiltered.replace(/\s*(-)(b|box)?\s*.*?$/, ''))
        const hasdashb = msg_unfiltered.match(/[-](b|box)/, '') !== null
        const wordToUpper = word.toUpperCase()

        switch (command_type) {
        case 'status':
            const statusParts = []

            for (let item of item_data) {
                item = item.dataValues
                if (item.name === 'Forma') continue
                let partColor = item.color
                if (partColor === wordToUpper) { // just to early skip parts that dont match the color
                    let partStock = parseInt(item.stock)
                    if (hasdashb) {
                        partStock = partStock + (collection_box[item.name] ?? 0)
                        partColor = range(partStock)
                    }
                    if (partColor !== wordToUpper) continue
                    statusParts.push({ s: partStock, i: item.name })
                }
            }

            const sortedParts = [...new Set(statusParts.sort((a, b) => a.s - b.s).map((part) => {
                return `${`[${part.s}]`.padEnd(5)}│ ${part.i}`
            })
            )]

            const embedsArrStatus = []
            for (let i = 0; i < sortedParts.length; i += 15) {
                embedsArrStatus.push(
                    new EmbedBuilder()
                        .setTitle(`[ ${wordToUpper} ]`)
                        .setDescription(codeBlock('ml', sortedParts.slice(i, i + 15).join('\n')))
                        .setColor(hex[wordToUpper])
                )
            }

            const statusPagination = new Pagination(message, {
                firstEmoji: '⏮',
                prevEmoji: '◀️',
                nextEmoji: '▶️',
                lastEmoji: '⏭',
                idle: 240_000,
                buttonStyle: ButtonStyle.Secondary,
                loop: true
            })

            statusPagination.setEmbeds(embedsArrStatus, (embed, index, array) => {
                return embed.setFooter({
                    text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${stockRanges[word.toUpperCase()]} stock parts  •  Page ${index + 1}/${array.length}  `
                })
            })
            statusPagination.render()
            break

        case 'part':
            const findPart = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :search_part`, {
                replacements: { search_part: `${titleCase(word)}%` },
                type: QueryTypes.SELECT
            })
            if (!findPart.length) return;
            const part = findPart[0]
            const relics = relicData.filter(relic => {
                return relic.dataValues.rewards.some(rw => {
                    return rw.part === part.name.replace(" x2", "")
                })
            })
            let relicToString = await Promise.all(relics.map(async (relic) => {
                const tokens = await database.sequelize.query(`SELECT tokens FROM relicTokens WHERE relic = :relic_name`, {
                    replacements: { relic_name: relic.dataValues.relic },
                    type: QueryTypes.SELECT
                })
                const position = rarities[relic.dataValues.rewards.findIndex(r => r.part === part.name.replace(" x2", ""))]
                return `${position} │ ${`{${tokens[0].tokens}}`.padEnd(5)}│ ${relic.dataValues.relic} {${relic.dataValues.vaulted ? "V" : "UV"}}`
            }));
            relicToString = relicToString.sort((a, b) => parseInt(b.match(/\d+/)[0]) - parseInt(a.match(/\d+/)))
            
            const extraPartStock = collection_box[part.name.replace(" x2", "")] ?? 0
            const basePartEmbed = new EmbedBuilder()
                .setTitle(`[ ${part.name} ]`)
                .setColor(hex[range(parseInt(part.stock) + (hasdashb ? extraPartStock : 0))])
                .setFooter({ text: `${hasdashb ? "Updated from box" : "Stock from tracker"}  •  ${part.stock}${hasdashb ? (`(+${extraPartStock})`) : ""}x of part in stock  •  ${relicToString.length} results` });

            if (relicToString.length <= 15) {
                message.reply({ embeds: [
                    new EmbedBuilder(basePartEmbed)
                        .setDescription(codeBlock('ml', relicToString.join("\n")))
                ] })
            } else {
                const partEmbedArray = []
                for (let i = 0; i < relicToString.length; i += 15) {
                    partEmbedArray.push(
                        new EmbedBuilder(basePartEmbed)
                            .setDescription(codeBlock('ml', relicToString.slice(i, i+15).join("\n")))
                    )
                }

                const partPagination = new Pagination(message, {
                    firstEmoji: '⏮',
                    prevEmoji: '◀️',
                    nextEmoji: '▶️',
                    lastEmoji: '⏭',
                    idle: 240_000,
                    buttonStyle: ButtonStyle.Secondary,
                    loop: true
                })
    
                partPagination.setEmbeds(partEmbedArray, (embed, index, array) => {
                    return embed.setFooter({
                        text: embed.data.footer.text + `  •  Page ${index + 1}/${array.length}`
                    })
                })
                partPagination.render()
            }
            break

        case 'prime':
            const setName = word.replace('Prime', '').trim()

            const allParts = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :check_name`, {
                replacements: { check_name: `${setName} %` },
                type: QueryTypes.SELECT
            })
            if (!allParts.length) return;
            const allPartStrings = allParts.map(part => {
                return `${`${hasdashb ? `${part.stock}(+${collection_box[part.name.replace(" x2", "")] ?? 0})`.padEnd(7) : part.stock.padEnd(3)}`}│ ${part.name.replace("Blueprint", "BP")} {${part.color}}`
            })

            const setStock = Math.min(...allParts.map(y => parseInt(y.stock) + (hasdashb ? collection_box[y.name.replace(" x2", "")] ?? 0 : 0)))

            const primeEmbed = new EmbedBuilder()
                .setTitle(`[ ${setName} Prime ]`)
                .setDescription(codeBlock('ml', allPartStrings.join("\n")))
                .setColor(hex[range(setStock)])
                .setFooter({ text: `${hasdashb ? "Updated from box" : "Stock from tracker"}  •  ${setStock}x of set in stock  •  ${range(setStock)} Set` })
                .setTimestamp()
            message.reply({ embeds: [primeEmbed] })
            break

        case 'relic':
            const relicFound = await database.sequelize.query(`SELECT * FROM relicData WHERE relic = :relic_name`, {
                replacements: { relic_name: filterRelic(word) },
                type: QueryTypes.SELECT
            })

            if (!relicFound.length) return;
            const partStockArray = []

            const theRelic = await JSON.parse(relicFound[0].rewards)
            const rewardsString = await Promise.all(theRelic.map(async (rw, i) => {
                const partStuff = (await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :part_name1 OR name LIKE :part_name2`, {
                    replacements: { part_name1: `${rw.part} x2`, part_name2: `${rw.part}` },
                    type: QueryTypes.SELECT
                }))[0]
                if (rw.part === "Forma") return `${rarities[i]} │ ${hasdashb ? "      " : "  "} │ Forma BP`
                const boxStock = collection_box[partStuff?.name] ?? 0
                partStockArray.push(hasdashb ? parseInt(partStuff?.stock) + (boxStock) : partStuff?.stock ?? 1000)
                const stockString = hasdashb ? `${partStuff?.stock}(+${boxStock})`.padEnd(7) : partStuff?.stock?.padEnd(3)
                return `${rarities[i]} │ ${stockString}│ ${rw?.part?.replace("Blueprint", "BP")} {${range(parseInt(partStuff?.stock) + boxStock) ?? "???"}}`
            }))

            const tokensAmt = await database.models.Tokens.findOne({ where: { relic: relicFound[0].relic } })
  
            message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${relicFound[0].relic} ] ${relicFound[0].vaulted ? "{V}" : "{UV}"} {${tokensAmt?.tokens ?? -1}}`)
                .setDescription(codeBlock('ml', rewardsString.join("\n")))
                .setColor(hex[range(Math.min(...partStockArray))])
                .setFooter({ text: `${relicFound[0].relic.split(" ")[0]} Void relic  •  ${range(Math.min(...partStockArray))} Relic  •  ${hasdashb ? "Updated from box" : "Stock from tracker"}` })
                .setTimestamp()
            ] })
            break

        default:
            break
        }
    }
}
