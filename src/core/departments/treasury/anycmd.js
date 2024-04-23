const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require('discord.js')
const fs = require('node:fs/promises')
const { Pagination } = require('pagination.djs')
const path = require('node:path')
const cutils = require('../../utility/codes.js')
const database = require('../../../database/init.js')
const { titleCase, filterRelic } = require('../../../utils/generic.js')

module.exports = {
    name: 'anycmd',
    /**
     * ++ Commands manager
     * @param {Message} message
     */
    async execute (client, message, msg_unfiltered, command_type) {
        const partRarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
        const models = database.models

        const [item_data, relic_data, collection_box] = await Promise.all([
            models.Items.findAll(),
            models.Relics.findAll(),
            fs.readFile(path.join(__dirname, '..', '..', 'data', 'BoxData.json'))
        ])

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
                        partColor = cutils.range(partStock)
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
                        .setColor(cutils.hex[wordToUpper])
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
                    text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${cutils.stockRanges[word.toUpperCase()]} stock  •  Page ${index + 1}/${array.length}  `
                })
            })
            statusPagination.render()
            break

        case 'part':
            const partRelics = []
            let realName = ''
            let realStock = 0
            let realColor = ''
            let extraCount = ''

            for (const relic of relic_data.relicData) {
                const partIndex = relic.parts.findIndex((part) => part?.startsWith(word))
                if (partIndex === -1) continue

                const relicIndexOfReward = relic.rewards[partIndex]
                if (!realName) {
                    realName = relicIndexOfReward.item
                    realStock = relicIndexOfReward.stock
                    realColor = relicIndexOfReward.color
                }
                if (hasdashb) {
                    extraCount = `(+${collection_box[realName] ?? 0})`
                    realColor = cutils.range((collection_box[realName] ?? 0) + parseInt(relicIndexOfReward.stock))
                }
                partRelics.push({ r: relic.name, t: relic.tokens, c: partRarities[partIndex] })
            }
            if (!partRelics.length) return

            const sortedRelics = partRelics.sort((a, b) => parseInt(b.t) - parseInt(a.t)).map((part) => {
                return `${part.c.padEnd(2)} | ${part.r} {${part.t}}`
            })

            const embedsParts = new EmbedBuilder()
                .setTitle(`[ ${realName} ]`)
                .setDescription(codeBlock('ml', sortedRelics.join('\n')))
                .setColor(cutils.hex[realColor])
                .setFooter({
                    text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${realStock}${extraCount}x of part in stock  •  ${sortedRelics.length} results`
                })

            await message.reply({ embeds: [embedsParts] })
            break

        case 'prime':
            const setName = word.replace('Prime', '').trim() + ' '

            const setParts = []
            for (const relic of relic_data.relicData) {
                const partExistsIndex = relic.parts.findIndex(part => part?.startsWith(setName))
                if (partExistsIndex === -1) continue

                const partOfSet = relic.rewards[partExistsIndex]
                if (setParts.some((rec) => rec.n === partOfSet.item)) continue

                const stockOfSetPart = parseInt(partOfSet.stock)
                let extraStock = 0
                let colorOfPart = partOfSet.color
                if (hasdashb) {
                    extraStock = collection_box[partOfSet.item] ?? 0
                    colorOfPart = cutils.range(stockOfSetPart + extraStock)
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
            colorOfParts = cutils.uncodeObj[Math.min(...colorOfParts.map(color => cutils.codeObj[color]))]
            stockOfParts = Math.min(...stockOfParts)

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`[ ${word} ]`)
                        .setFooter({ text: `${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${stockOfParts}x of set in stock  •  ${colorOfParts} Set  ` })
                        .setTimestamp()
                        .setDescription(codeBlock('ml', setPartsText.join('\n')))
                        .setColor(cutils.hex[colorOfParts])
                ]
            })
            break

        case 'relic':
            const properRelicName = filterRelic(word.toLowerCase())
            const relicToFind = relic_data.relicData.filter((relic) => relic.name === properRelicName)
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
                relicDesc[relicRewards.indexOf(part)] = `${indexRarity.padEnd(2)} | ${`${partStock}${extraStock}`.padEnd(!extraStock ? 3 : 8)}| ${part.item} {${cutils.range(partStock)}}`
            }

            allStocks = cutils.range(Math.min(...allStocks))

            message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`[ ${properRelicName} ] {${relicFound.tokens}}`)
                        .setDescription(codeBlock('ml', relicDesc.join('\n')))
                        .setFooter({
                            text: `Showing ${relicFound.name.split(' ')[0]} Void relic  •  ${hasdashb ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${allStocks} relic  `
                        })
                        .setColor(cutils.hex[allStocks])
                        .setTimestamp()
                ]
            })
            break

        default:
            break
        }
    }
}
