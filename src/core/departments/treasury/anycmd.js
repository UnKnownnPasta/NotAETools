const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require('discord.js')
// const fs = require('node:fs/promises')
const { Pagination } = require('pagination.djs')
const path = require('node:path')
const database = require('../../../database/init.js')
const { titleCase, filterRelic, codeObj, uncodeObj, hex, range, stockRanges } = require('../../../utils/generic.js')
const { QueryTypes } = require('sequelize')

module.exports = {
    name: 'anycmd',
    type: 'message',
    /**
     * ++ Commands manager
     * @param {Message} message
     */
    async execute (client, message, msg_unfiltered, command_type) {
        const partRarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
        const models = database.models

        const [item_data, relicData, boxFetch] = await Promise.all([
            models.Parts.findAll(),
            models.Relics.findAll(),
            models.Box.findAll()
        ])

        const collection_box = {}
        boxFetch.map(p => collection_box[p.dataValues.name] = p.dataValues.stock)

        const word = titleCase(msg_unfiltered.replace(/\s*(-)(b|box)?\s*.*?$/, ''))
        const hasdashb = msg_unfiltered.match(/-(?:b|box)/, '') !== null
        // let hasdashr = msg_unfiltered.match(/-(?:r)/, "") !== null
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
                    text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${stockRanges[word.toUpperCase()]} stock  •  Page ${index + 1}/${array.length}  `
                })
            })
            statusPagination.render()
            break

        case 'part':
            const findPart = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :search_part`, {
                replacements: { search_part: `${titleCase(word)}%` },
                type: QueryTypes.SELECT
            })
            console.log(findPart);
            if (!findPart.length) return;
            const part = findPart[0]
            const relics = relicData.filter(relic => {
                return relic.dataValues.rewards.some(rw => {
                    return rw.part === part.name
                })
            })
            const relicToString = await Promise.all(relics.map(async (relic) => {
                const tokens = await database.sequelize.query(`SELECT tokens FROM relicTokens WHERE relic = :relic_name`, {
                    replacements: { relic_name: relic.dataValues.relic },
                    type: QueryTypes.SELECT
                })
                return `${tokens[0].tokens.padEnd(3)}| ${relic.dataValues.relic} {${relic.dataValues.vaulted ? "V" : "UV"}}`
            }));

            message.reply({ embeds: [
                new EmbedBuilder()
                    .setTitle(`[ ${part.name} ]`)
                    .setDescription(codeBlock('ml', relicToString.join("\n")))
                    .setColor(hex[range(parseInt(part.stock))])
            ] })
            break

        case 'prime':
            const setName = word.replace('Prime', '').trim() + ' '

            const setParts = []
            for (const relic of relicData) {
                const partExistsIndex = relic.parts.findIndex(part => part?.startsWith(setName))
                if (partExistsIndex === -1) continue

                const partOfSet = relic.rewards[partExistsIndex]
                if (setParts.some((rec) => rec.n === partOfSet.item)) continue

                const stockOfSetPart = parseInt(partOfSet.stock)
                let extraStock = 0
                let colorOfPart = partOfSet.color
                if (hasdashb) {
                    extraStock = collection_box[partOfSet.item] ?? 0
                    colorOfPart = range(stockOfSetPart + extraStock)
                }

                setParts.push({ s: stockOfSetPart, ex: extraStock, n: partOfSet.item, c: colorOfPart })
            }
            if (!setParts.length) return

            let colorOfParts = []
            let stockOfParts = []
            const setPartsText = setParts.map((part) => {
                colorOfParts.push(part.c)
                stockOfParts.push(part.s + part.ex)
                if (hasdashb) {
                    return `${`${part.s}(+${part.ex})`.padEnd(8)}| ${part.n} {${part.c}}`
                } else {
                    return `${`${part.s}`.padEnd(3)}| ${part.n} {${part.c}}`
                }
            })
            colorOfParts = uncodeObj[Math.min(...colorOfParts.map(color => codeObj[color]))]
            stockOfParts = Math.min(...stockOfParts)

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`[ ${word} ]`)
                        .setFooter({ text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${stockOfParts}x of set in stock  •  ${colorOfParts} Set  ` })
                        .setTimestamp()
                        .setDescription(codeBlock('ml', setPartsText.join('\n')))
                        .setColor(hex[colorOfParts])
                ]
            })
            break

        case 'relic':
            const properRelicName = filterRelic(word.toLowerCase())
            const relicToFind = relicData.relicData.filter((relic) => relic.name === properRelicName)
            if (relicToFind.length === 0) return
            const relicFound = relicToFind[0]
            let allStocks = []
            const relicDesc = Array.from({ length: 6 })

            const relicRewards = relicFound.rewards
            for (const [i, part] of Object.entries(relicRewards)) {
                const indexRarity = partRarities[parseInt(i)]
                if (part.item === 'Forma') {
                    if (hasdashb) {
                        relicDesc[relicRewards.indexOf(part)] = `${indexRarity.padEnd(2)} |         | Forma`
                        continue
                    } else {
                        relicDesc[relicRewards.indexOf(part)] = `${indexRarity.padEnd(2)} |    | Forma`
                        continue
                    }
                }
                const partStock = parseInt(part.stock)
                let extraStock = ''
                if (hasdashb) {
                    extraStock = `(+${collection_box[part.item] ?? 0})`
                }
                allStocks.push(partStock + (collection_box[part.item] ?? 0))
                relicDesc[relicRewards.indexOf(part)] = `${indexRarity.padEnd(2)} | ${`${partStock}${extraStock}`.padEnd(!extraStock ? 3 : 8)}| ${part.item} {${range(partStock)}}`
            }

            allStocks = range(Math.min(...allStocks))

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`[ ${properRelicName} ] {${relicFound.tokens}}`)
                        .setDescription(codeBlock('ml', relicDesc.join('\n')))
                        .setFooter({
                            text: `Showing ${relicFound.name.split(' ')[0]} Void relic  •  ${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${allStocks} relic  `
                        })
                        .setColor(hex[allStocks])
                        .setTimestamp()
                ]
            })
            break

        default:
            break
        }
    }
}
