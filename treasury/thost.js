const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    codeBlock
} = require("discord.js");
const { filterRelic, relicExists } = require("../scripts/utility");
const fs = require('node:fs/promises');
const path = require("node:path");

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
            .setChoices({ name: 'Normal', value: 'Squad' }, { name: 'Bois Run', value: 'Bois Run' }, { name: 'Pre Host', value: 'Pre Host Squad' })
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

        if (runType == 'Squad' || runType == undefined || runType == 'Pre Host Squad') {
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
                .setTitle(`${!runType ? 'Squad' : runType} by ${interaction.member.nickname ?? interaction.member.user.username}`);

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

            // field
            const properRelicName = filterRelic(relic)
            let relic_data = await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json'), 'utf-8'))

            const relicToFind = relic_data.relicData.filter((relic) => relic.name === properRelicName)
            if (relicToFind.length === 0) return;
            const relicFound = relicToFind[0]

            const rarities = ['C ', 'C ', 'C ', 'UC', 'UC', 'RA']
            const relicFieldDesc = relicFound.rewards.map((part, i) => {
                if (part.item === 'Forma') return `${rarities[i]} │    │ Forma`;
                let partStock = parseInt(part.stock)
                return `${rarities[i]} │ ${`${partStock}`.padEnd(3)}│ ${part.item} {${part.color}}`
            })

            relicEmbed.addFields([
                { name: `[ ${properRelicName} ] {${relicFound.tokens}}`, value: codeBlock('ml', relicFieldDesc.join("\n")) }
            ])
            .setFooter({ text: `Showing ${relicFound.name.split(" ")[0]} Void relic  •  Stock from Tracker  •  Host relic  ` })
            .setTimestamp()
        

            interaction.reply({ content: `Successfully hosted a run for ${filterRelic(relic)}`, ephemeral: true });
            await interaction.channel.send({ embeds: [relicEmbed], components: [hostButtons] });
        }
    },
};