const { SlashCommandBuilder, CommandInteraction, EmbedBuilder, codeBlock } = require('discord.js')
const database = require('../../../database/init')
const { QueryTypes } = require('sequelize')
const { hex, range, filterRelic, rarities } = require('../../../utils/generic.js')
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

        const collection_box = require('../../managers/boxFetch.js')(client)

        const relicFound = await database.sequelize.query(`SELECT * FROM relicData WHERE relic = :relic_name`, {
            replacements: { relic_name: relic },
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
            if (rw.part === "Forma") return `${rarities[i]} │ ${boxupdated ? "      " : "  "} │ Forma BP`
            const boxStock = collection_box[partStuff?.name] ?? 0
            partStockArray.push(boxupdated ? parseInt(partStuff?.stock) + (boxStock) : partStuff?.stock ?? 1000)
            const stockString = boxupdated ? `${partStuff?.stock}(+${boxStock})`.padEnd(7) : partStuff?.stock?.padEnd(3)
            return `${rarities[i]} │ ${stockString}│ ${rw?.part?.replace("Blueprint", "BP")} {${range(parseInt(partStuff?.stock) + boxStock) ?? "???"}}`
        }))

        const tokensAmt = await database.models.Tokens.findOne({ where: { relic: relicFound[0].relic } })

        message.reply({ embeds: [
            new EmbedBuilder()
            .setTitle(`[ ${relicFound[0].relic} ] ${relicFound[0].vaulted ? "{V}" : "{UV}"} {${tokensAmt?.tokens ?? -1}}`)
            .setDescription(codeBlock('ml', rewardsString.join("\n")))
            .setColor(hex[range(Math.min(...partStockArray))])
            .setFooter({ text: `${relicFound[0].relic.split(" ")[0]} Void relic  •  ${range(Math.min(...partStockArray))} Relic  •  ${boxupdated ? "Updated from box" : "Stock from tracker"}` })
            .setTimestamp()
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
