const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    codeBlock
} = require('discord.js')
const { filterRelic, relicExists, rarities } = require('../../../utils/generic')
const database = require('../../../database/init')
const { QueryTypes } = require('sequelize')

module.exports = {
    name: 'thost',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('thost')
        .setDescription('Hosts a treasury run')
        .addIntegerOption((option) =>
            option
                .setName('count')
                .setDescription('Number of Relics')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('relic')
                .setDescription('Name of the relic you want to host')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('type')
                .setDescription('Type of run')
                .setRequired(false)
                .setChoices({ name: 'Normal', value: 'Squad' }, { name: 'Bois Run', value: 'Bois Run' }, { name: 'Pre Host', value: 'Pre Host Squad' })
        ),
    /**
     * Treasury exclusive command to host runs; to squad up
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute (client, interaction) {
        const relic = interaction.options.getString('relic', true).toLowerCase()
        const runType = interaction.options.getString('type', false) ?? undefined
        const relicCount = interaction.options.getInteger('count', true)
        const trueRelicName = filterRelic(relic)

        if (runType == 'Squad' || runType == undefined || runType == 'Pre Host Squad') {
            if (relicCount % 3 != 0 || relicCount < 6) { return interaction.reply({ content: 'Relic count must be greater than 6, and a multiple of 3 eg. 12, 18', ephemeral: true }) }
        }
        const relicStuff = await relicExists(trueRelicName)
        const setOfUsers = []

        if (!relicStuff) {
            interaction.reply({ content: 'Invalid Relic.', ephemeral: true })
        } else {
            setOfUsers.push(interaction.user.id)

            // generate relic view
            const relicFound = await database.sequelize.query(`SELECT * FROM relicData WHERE relic = :relic_name`, {
                replacements: { relic_name: trueRelicName },
                type: QueryTypes.SELECT
            })

            if (!relicFound.length) return;

            const theRelic = await JSON.parse(relicFound[0].rewards)
            const rewardsString = await Promise.all(theRelic.map(async (rw, i) => {
                const partStuff = await database.models.Parts.findOne({ where: { name: rw.part } })
                if (rw.part === "Forma Blueprint") return `${rarities[i]} |    | Forma BP`
                return `${rarities[i]} | ${partStuff?.stock?.padEnd(3) ?? `-1 `}| ${rw?.part?.replace("Blueprint", "BP")} {${partStuff?.color ?? "???"}}`
            }))

            const tokensAmt = await database.models.Tokens.findOne({ where: { relic: relicFound[0].relic } })
            relicDesc = `${relicCount}x ${trueRelicName} ${relicFound[0].vaulted ? "{V}" : "{UV}"} {${tokensAmt?.tokens ?? -100}}`

            const thostEmbed = new EmbedBuilder()
                .setTitle(`${!runType ? 'Squad' : runType} by ${interaction.member.nickname ?? interaction.member.user.username}: ${setOfUsers.length}/4`)
                .addFields({ 
                    name: relicDesc, value: codeBlock('ml', rewardsString.join("\n"))
                })
                .setColor('#73C6B6');

            const confirm = new ButtonBuilder()
                .setCustomId('thost-join')
                .setLabel('✔')
                .setStyle(ButtonStyle.Success)

            const cancel = new ButtonBuilder()
                .setCustomId('thost-cancel')
                .setLabel('❌')
                .setStyle(ButtonStyle.Danger)

            const userDesc = `${setOfUsers.map(x => `<@!${x}>`).join('\n')}`

            const hostButtons = new ActionRowBuilder().addComponents(confirm, cancel)

            thostEmbed.setDescription(userDesc)
            interaction.reply({ content: `Successfully hosted a run for ${trueRelicName}`, ephemeral: true })
            await interaction.channel.send({ embeds: [thostEmbed], components: [hostButtons] })
        }
    }
}
