const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType
} = require("discord.js");
const { google } = require("googleapis");

module.exports = {
    name: "thost",
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName("thost")
        .setDescription("Hosts a treasury run")
        .addStringOption((option) =>
            option
                .setName("relic")
                .setDescription("Name of the relic you want to host")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("count")
                .setDescription("Number of Relics")
                .setRequired(true)
        ),
    /**
     * Treasury exclusive command to host runs; to squad up
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(client, interaction) {
        let relicData = [];
        let userData = [];
        const authKey = process.env.GOOGLEAPIKEY,
            spreadsheetId = "1Fv0SCmBalcT-DNo02F4Q1CiX_Np6Q7vsmuVO6c2PiPY",
            relicRange = 'Tracker!A2:A555',
            userRange = 'Directory!B11:C162';
        if (authKey == "") return console.log(`[Error] No Authentication key was provided for GoogleSheets API`)

        /**
         * Authenticate with Google Sheets API and fetch specified range
         * @param {String} range
         */
        async function fetchDataForSingleRange() {
            try {
                const relicList_res = await google.sheets('v4').spreadsheets.values.get({
                    auth: authKey,
                    spreadsheetId: spreadsheetId,
                    range: relicRange,
                });
                const rows = relicList_res.data.values.map(i => i[0]).sort();

                const userList_res = await google.sheets('v4').spreadsheets.values.get({
                    auth: authKey,
                    spreadsheetId: spreadsheetId,
                    range: userRange,
                });
                const columns = userList_res.data.values

                if (!(rows && rows.length)) 
                    console.log(`[Error]` + ` No data found for range ${range}. | Error while running ${this.data.name}`)
                
                relicData = rows
                userData = columns
            } catch (error) {
                console.error(`[Error]` + `fetching data for range ${range}:`, error.message);
            }
        }
        
        fetchDataForSingleRange(relicRange).then(async () => {
            function parseString(input, relics) {
                const validRelicEras = ["lith", "meso", "neo", "axi"];
                const parts = input.toLowerCase().split(" ");

                if (parts.length < 1) return null;

                const Era = parts[0];
                if (!validRelicEras.includes(Era)) return null;

                const relicRarity = parts[1];
                const fixedString = Era[0].toUpperCase() + Era.substr(1).toLowerCase() + " " + relicRarity.toUpperCase()
                if (relicRarity.length > 4 || relics.indexOf(fixedString.trim()) === -1)
                    return null;

                return fixedString;
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
        });
    },
};
