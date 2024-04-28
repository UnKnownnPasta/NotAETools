const { SlashCommandBuilder, CommandInteraction, EmbedBuilder, codeBlock, ButtonStyle } = require('discord.js')
const database = require('../../../database/init')
const { QueryTypes } = require('sequelize')
const { Pagination } = require('pagination.djs')
const { hex, range, stockRanges, filterRelic, rarities } = require('../../../utils/generic.js')
const { dualitemslist } = require('../../../configs/commondata.json')

module.exports = {
    name: 'stock',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('stock')
        .setDescription('View a void relic and its contents')
        .addStringOption((option) =>
            option
                .setName('stock')
                .setDescription('Which stock to view')
                .setRequired(true)
                .addChoices(
                    { name: 'ED', value: 'ED' },
                    { name: 'RED', value: 'RED' },
                    { name: 'ORANGE', value: 'ORANGE' },
                    { name: 'YELLOW', value: 'YELLOW' },
                    { name: 'GREEN', value: 'GREEN' },
                )
        )
        .addBooleanOption((option) =>
            option
                .setName('boxupdated')
                .setDescription('Whether to update stock counts from collection box or not')
                .setRequired(false)
        ),
    /**
     * Command to check void relics and its part stocks
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute (client, i) {
        const edtype = i.options.getString('stock', true)
        const boxupdated = i.options.getBoolean('boxupdated', false) ?? false
        await i.deferReply();

        const models = database.models

        const [item_data, boxFetch] = await Promise.all([
            models.Parts.findAll(),
            models.Box.findAll()
        ])

        const collection_box = {}
        boxFetch.map(p => collection_box[p.dataValues.name] = p.dataValues.stock)

        const word = edtype
        const wordToUpper = word.toUpperCase()

        const statusParts = []

        for (let item of item_data) {
            item = item.dataValues
            if (item.name === 'Forma') continue
            let partColor = item.color
            if (partColor === wordToUpper) { // just to early skip parts that dont match the color
                let partStock = parseInt(item.stock)
                if (boxupdated) {
                    partStock = partStock + (collection_box[item.name] ?? 0)
                    partColor = range(partStock)
                }
                if (partColor !== wordToUpper) continue
                statusParts.push({ s: partStock, i: `${item.name}${dualitemslist.includes(item.name) ? ' x2' : ''}` })
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

        const statusPagination = new Pagination(i, {
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
                text: `${boxupdated ? 'Updated from box  • ' : 'Stock from Tracker  • '} ${stockRanges[word.toUpperCase()]} stock parts  •  Page ${index + 1}/${array.length}  `
            })
        })
        statusPagination.render()
    },
}
