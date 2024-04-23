const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock
} = require('discord.js')
const fs = require('node:fs/promises')

module.exports = {
    name: 'clan',
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
        const resources = (await JSON.parse(await fs.readFile('./src/data/clandata.json'))).resources
        const clan = i.options.getString('clan', true)

        let embedDesc = ''
        await resources.filter(clans => clans.clan == clan)[0].resources.map(r => {
            embedDesc += `${r.name.padEnd(17)} | Amt: ${r.amt.padEnd(12)} Overflow: ${r.short}\n`
        })

        const clanEmbed = new EmbedBuilder()
            .setTitle(`Resource overview of ${clan}`)
            .setDescription(codeBlock('ml', embedDesc))
        await i.reply({ embeds: [clanEmbed] })
    }
}
