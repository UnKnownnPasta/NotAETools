const { EmbedBuilder, codeBlock, ButtonStyle, Message } = require('discord.js')
// const fs = require('node:fs/promises')
const { Pagination } = require('pagination.djs')
const path = require('node:path')
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

        const [item_data, relicData, boxFetch] = await Promise.all([
            models.Parts.findAll(),
            models.Relics.findAll(),
            models.Box.findAll()
        ])

        const collection_box = {}
        boxFetch.map(p => collection_box[p.dataValues.name] = p.dataValues.stock)

        const word = titleCase(msg_unfiltered.replace(/\s*(-)(b|box)?\s*.*?$/, ''))
        // const hasdashb = msg_unfiltered.match(/[-](b|box)/, '') !== null
        // let hasdashr = msg_unfiltered.match(/[-](r|relics)/, "") !== null
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

        case 'part': // TODO: PAGINATION
            const findPart = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :search_part`, {
                replacements: { search_part: `${titleCase(word)}%` },
                type: QueryTypes.SELECT
            })
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
                const position = rarities[relic.dataValues.rewards.findIndex(r => r.part === part.name)]
                return `${position} | ${tokens[0].tokens.padEnd(3)}| ${relic.dataValues.relic} {${relic.dataValues.vaulted ? "V" : "UV"}}`
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

            const allParts = await database.sequelize.query(`SELECT * FROM primeParts WHERE name LIKE :check_name`, {
                replacements: { check_name: `${setName}%` },
                type: QueryTypes.SELECT
            })
            if (!allParts.length) return;
            const allPartStrings = allParts.map(part => {
                return `${part.stock.padEnd(3)}| ${part.name.replace("Blueprint", "BP")} {${part.color}}`
            })
            const hexColor = uncodeObj[[Math.min(...allParts.map(y => codeObj[y.color]))]]

            const primeEmbed = new EmbedBuilder()
                .setTitle(`[ ${setName}Prime ]`)
                .setDescription(codeBlock('ml', allPartStrings.join("\n")))
                .setColor(hex[hexColor])
            message.reply({ embeds: [primeEmbed] })
            break

        case 'relic':
            const relicFound = await database.sequelize.query(`SELECT * FROM relicData WHERE relic = :relic_name`, {
                replacements: { relic_name: filterRelic(word) },
                type: QueryTypes.SELECT
            })

            if (!relicFound.length) return;

            const theRelic = await JSON.parse(relicFound[0].rewards)
            const rewardsString = await Promise.all(theRelic.map(async (rw, i) => {
                const partStuff = await database.models.Parts.findOne({ where: { name: rw.part } })
                if (rw.part === "Forma Blueprint") return `${rarities[i]} |    | Forma BP`
                return `${rarities[i]} | ${partStuff.stock.padEnd(3)}| ${rw.part.replace("Blueprint", "BP")} {${partStuff.color}}`
            }))

            const tokensAmt = await database.models.Tokens.findOne({ where: { relic: relicFound[0].relic } })
  
            message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${relicFound[0].relic} ] ${relicFound[0].vaulted ? "{V}" : "{UV}"} {${tokensAmt.tokens}}`)
                .setDescription(codeBlock('ml', rewardsString.join("\n")))
            ] })
            break

        default:
            break
        }
    }
}
