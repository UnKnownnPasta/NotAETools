const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock
} = require('discord.js')
const database = require('../../../database/init')
const { toClanName } = require('../../../utils/generic')

module.exports = {
    name: 'clan',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('clan')
        .setDescription('View resources for a specific clan')
        .addStringOption((option) =>
            option
                .setName('clan')
                .setDescription('Clan to view resources of')
                .setRequired(true)
                .addChoices(
                    { name: 'Imouto Kingdom', value: 'IK' },
                    { name: 'Waifu Kingdom', value: 'WK' },
                    { name: 'Manga Kingdom', value: 'MK' },
                    { name: 'Yuri Kingdom', value: 'YK' },
                    { name: 'Cowaii Kingdom', value: 'CK' },
                    { name: 'Tsuki Kingdom', value: 'TK' },
                    { name: 'Heavens Kingdom', value: 'HK' },
                    { name: 'Andromeda Kingdom', value: 'AK' }
                )
        ),
    /**
     * Command to retrieve resources of a specific clan
     * @param {Client} client
     * @param {CommandInteraction} i
     */
    async execute (client, i) {
        const clan = i.options.getString('clan', true)
        await i.deferReply()
        const resources = await database.models.Clans.findOne({ where: { clan } })

        let embedDesc = `RESOURCE`.padEnd(17) + ` | AMOUNT (+SHORTFALL)\n\n`
        Object.entries(resources.dataValues.resource).map(async ([key, val]) => {
            embedDesc += `${key.padEnd(17)} | ${val.amt.padEnd(12)} (+${val.short})\n`
        })

        const clanEmbed = new EmbedBuilder()
            .setTitle(`Resources of ${toClanName[clan]}`)
            .setDescription(codeBlock('ml', embedDesc));

        await i.editReply({ embeds: [clanEmbed] })
    }
}
