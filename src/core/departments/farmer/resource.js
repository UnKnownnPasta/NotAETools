const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction
} = require('discord.js')
const database = require('../../../database/init')
const { titleCase, toClanName } = require('../../../utils/generic')
const { resourceNames } = require('../../../configs/commondata.json')

module.exports = {
    name: 'resource',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('resource')
        .setDescription('View resources for a specific clan')
        .addStringOption((option) =>
            option
                .setName('resource')
                .setDescription('Resource to view details of')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    /**
     * Command to retrieve clan wise resources
     * @param {Client} client
     * @param {CommandInteraction} i
     */
    async execute (client, i) {
        const choiceResource = i.options.getString('resource', true)

        if (!resourceNames.includes(choiceResource)) { return i.reply({ content: 'Invalid resource, choose from autofill instead', ephemeral: true }) }

        const clanEmbed = new EmbedBuilder()
            .setTitle(`Resource overview of ${choiceResource}`)

        const allResources = await database.models.Clans.findAll()
        await allResources.map((res) => {
            const fieldName = res.dataValues.clan
            const resVal = Object.entries(res.dataValues.resource).find(resrc => resrc[0] === choiceResource)
            const fieldVal = `│ ${resVal[1].amt} (+${resVal[1].short})`
            clanEmbed.addFields({ name: toClanName[fieldName], value: fieldVal })
        })

        await i.reply({ embeds: [clanEmbed] })
    },
    async autocomplete (i) {
        const focusedValue = i.options.getFocused()
        const choices = [...resourceNames.map(x => x.toLowerCase())]
        const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25)
        await i.respond(
            filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice) }))
        )
    }
}
