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
const { dept } = require('../../configs/config.json');
const { checkForRelic } = require("../../data/utils");

module.exports = {
    name: ["thost"],
    type: 'slash',
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
        ),
    /**
     * Treasury exclusive command to host runs; to squad up
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(client, interaction) {

        const relicData = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8')).map(x => x[0][0])
        
        function parseString(input, relics) {
            const validRelic = checkForRelic(input)
            if (validRelic && relics.indexOf(validRelic) !== -1) return validRelic
            return null;
        }

        // Handling interaction
        const relic = interaction.options.getString("relic", true).toLowerCase(),
            relicCount = interaction.options.getInteger("count", true);

        const relicStuff = parseString(relic, relicData);
        let setOfUsers = [];

        if (relicStuff === null) {
            interaction.reply({ content: `Invalid Relic.`, ephemeral: true });
            return;
        } else {
            setOfUsers.push(interaction.user.id);

            relicDesc = `\`${relicCount}x ${relicStuff}\`\n`
            const relicEmbed = new EmbedBuilder()
                .setTitle(`Squad by ${interaction.member.nickname ?? interaction.member.user.username}`);

            const confirm = new ButtonBuilder()
                .setCustomId('thost-join')
                .setLabel('✔')
                .setStyle(ButtonStyle.Success);
    
            const cancel = new ButtonBuilder()
                .setCustomId('thost-cancel')
                .setLabel('❌')
                .setStyle(ButtonStyle.Danger);

            relicDesc += `${setOfUsers.map(x => `<@!${x}>`).join("\n")}`

            const hostButtons = new ActionRowBuilder().addComponents(confirm, cancel)

            relicEmbed.setDescription(relicDesc)
            interaction.reply({ content: `Successfully hosted a run for ${relicStuff}`, ephemeral: true });
            await interaction.channel.send({ content: `${setOfUsers.map(x => `<@!${x}>`).join(" ")}`, embeds: [relicEmbed], components: [hostButtons] });
        }
    },
};