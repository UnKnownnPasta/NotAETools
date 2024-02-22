const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder
} = require("discord.js");
const fs = require("node:fs");
const { filterRelic, relicExists } = require("../data/scripts/utility");

module.exports = {
    name: "thost",
    data: new SlashCommandBuilder()
        .setName("thost")
        .setDescription("Hosts a treasury run")
        .addIntegerOption((option) =>
            option
                .setName("count")
                .setDescription("Number of Relics")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("relic")
                .setDescription("Name of the relic you want to host")
                .setRequired(true)
        )
        .addStringOption((option) =>
        option
            .setName("type")
            .setDescription("Type of run")
            .setRequired(false)
            .setChoices({ name: 'Normal', value: 'norm' }, { name: 'Bois Run', value: 'bois' })
        ),
    /**
     * Treasury exclusive command to host runs; to squad up
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(client, interaction) {
        const relic = interaction.options.getString("relic", true).toLowerCase(),
            runType = interaction.options.getString("type", false) ?? undefined,
            relicCount = interaction.options.getInteger("count", true);

        if (runType == 'norm' || runType == undefined) {
            if (relicCount%3 != 0 || relicCount < 6) 
                return interaction.reply({ content: `Relic count must be greater than 6, and a multiple of 3 eg. 12, 18`, ephemeral: true })
        }
        const relicStuff = await relicExists(filterRelic(relic));
        let setOfUsers = [];

        if (!relicStuff) {
            interaction.reply({ content: `Invalid Relic.`, ephemeral: true });
            return;
        } else {
            setOfUsers.push(interaction.user.id);

            relicDesc = `\`${relicCount}x ${filterRelic(relic)}\`\n`
            const relicEmbed = new EmbedBuilder()
                .setTitle(`${runType == 'norm' || !runType ? 'Squad' : 'Bois run'} by ${interaction.member.nickname ?? interaction.member.user.username}`);

            const confirm = new ButtonBuilder()
                .setCustomId('thost-join')
                .setLabel('✔')
                .setStyle(ButtonStyle.Success);
    
            const cancel = new ButtonBuilder()
                .setCustomId('thost-cancel')
                .setLabel('❌')
                .setStyle(ButtonStyle.Danger);

            const relicView = new ButtonBuilder()
                .setCustomId('thost-relicview')
                .setLabel(filterRelic(relic))
                .setStyle(ButtonStyle.Primary)

            relicDesc += `${setOfUsers.map(x => `<@!${x}>`).join("\n")}`

            const hostButtons = new ActionRowBuilder().addComponents(confirm, cancel, relicView)

            relicEmbed.setDescription(relicDesc)
            interaction.reply({ content: `Successfully hosted a run for ${filterRelic(relic)}`, ephemeral: true });
            await interaction.channel.send({ embeds: [relicEmbed], components: [hostButtons] });
        }
    },
};