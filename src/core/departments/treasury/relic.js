const { SlashCommandBuilder, CommandInteraction, EmbedBuilder, codeBlock, ButtonStyle } = require('discord.js')
const database = require('../../../database/init')
const { QueryTypes } = require('sequelize')
const { Pagination } = require('pagination.djs')
const { hex, range, stockRanges, filterRelic, rarities } = require('../../../utils/generic.js')
const { dualitemslist } = require('../../../configs/commondata.json')

module.exports = {
    name: 'relic',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('relic')
        .setDescription('View a void relic and its contents')
        .addStringOption((option) =>
            option
                .setName('name')
                .setDescription('Name of relic to view')
                .setRequired(true)
                .setAutocomplete(true)
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
        const relic = i.options.getString('name', true)
        const boxupdated = i.options.getBoolean('boxupdated', false) ?? false
        await i.deferReply();

        const relicFound = await database.sequelize.query(`SELECT * FROM relicData WHERE relic = :relic_name`, {
            replacements: { relic_name: relic },
            type: QueryTypes.SELECT
        })

        if (!relicFound.length) return;
        const partStockArray = []

        const theRelic = await JSON.parse(relicFound[0].rewards)
        const rewardsString = await Promise.all(theRelic.map(async (rw, i) => {
            const partStuff = await database.models.Parts.findOne({ where: { name: rw.part } })
            if (rw.part === "Forma") return `${rarities[i]} │    │ Forma BP`
            partStockArray.push(partStuff?.stock ?? 1000)
            return `${rarities[i]} │ ${partStuff?.stock?.padEnd(3) ?? `-1 `}│ ${rw?.part?.replace("Blueprint", "BP")} ${dualitemslist.includes(rw?.part) ? 'x2' : ''} {${partStuff?.color ?? "???"}}`
        }))

        const tokensAmt = await database.models.Tokens.findOne({ where: { relic: relicFound[0].relic } })

        await i.editReply({ embeds: [
            new EmbedBuilder()
            .setTitle(`[ ${relicFound[0].relic} ] ${relicFound[0].vaulted ? "{V}" : "{UV}"} {${tokensAmt?.tokens ?? -1}}`)
            .setDescription(codeBlock('ml', rewardsString.join("\n")))
            .setColor(hex[range(Math.min(...partStockArray))])
            .setFooter({ text: `${range(Math.min(...partStockArray))} Relic  •  Stock from Tracker` })
        ] })
    },
    async autocomplete(i) {
        const focusedValue = i.options.getFocused(true)
        const filtered = filterRelic(focusedValue.value)
        const choices = await database.sequelize.query(`SELECT relic FROM relicData WHERE relic LIKE :relic_name`, {
            replacements: { relic_name: `${filtered ? filtered : focusedValue.value}%` },
            type: QueryTypes.SELECT
        })
        await i.respond(choices.slice(0, 25).map(choice => ({ name: choice.relic, value: choice.relic })))
    }
}
