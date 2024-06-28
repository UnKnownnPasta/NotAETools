const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
} = require("discord.js");
const { titleCase } = require("../scripts/utility");
const { getAllClanData } = require("../scripts/dbcreate");

const resourceNames = [
    "Credits",
    "Alloy Plate",
    "Circuits",
    "Control Module",
    "Cryotic",
    "Detonite Ampule",
    "Ferrite",
    "Fieldron Sample",
    "Forma",
    "Gallium",
    "Morphics",
    "Mutagen Sample",
    "Nano Spores",
    "Neural Sensors",
    "Neurodes",
    "Orokin Cell",
    "Oxium",
    "Plastids",
    "Polymer Bundle",
    "Rubedo",
    "Salvage",
    "Detonite Injector",
    "Fieldron",
    "Mutagen Mass",
];

const reverseClan = {
    IK: "Imouto",
    WK: "Waifu",
    MK: "Manga",
    YK: "Yuri",
    CK: "Cowaii",
    TK: "Tsuki",
    HK: "Heavens",
    AK: "Andromeda"
};

const clanOptions = [
    { name: "Imouto Kingdom", value: "IK" },
    { name: "Waifu Kingdom", value: "WK" },
    { name: "Manga Kingdom", value: "MK" },
    { name: "Yuri Kingdom", value: "YK" },
    { name: "Cowaii Kingdom", value: "CK" },
    { name: "Tsuki Kingdom", value: "TK" },
    { name: "Heavens Kingdom", value: "HK" },
    { name: "Andromeda Kingdom", value: "AK" }
]

module.exports = {
    name: "resource",
    data: new SlashCommandBuilder()
    .setName('resource')
    .setDescription('View resources for a specific clan')
    .addStringOption((option) =>
    option
        .setName('resource')
        .setDescription('Resource to view details of')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
        option
            .setName('clan')
            .setDescription('Which clan to see')
            .setRequired(false)
            .addChoices(...clanOptions)
    ),
    /**
     * Command to retrieve clan wise resources
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        const resrc = titleCase(i.options.getString('resource', true) ?? "")
        const clanname = titleCase(i.options.getString('clan', false) ?? "")

        if (!resourceNames.includes(resrc)) 
            return i.editReply({ content: `Invalid resource, choose from autofill instead`, ephemeral: true });

        const resources = await getAllClanData();
        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${resrc}`);

        for (const r of resources) {
            if (clanname && clanname.toUpperCase() !== r.clan) continue;
            const res = Object.entries(r.resource).filter(([ key, value ]) => key == resrc)[0]
            clanEmbed.addFields({ name: reverseClan[r.clan], value: `**Amt:** \`${res[1].amt}\` | **Short:** \`${res[1].short}\`` })
        }

        await i.editReply({ embeds: [clanEmbed] })
    },
    async autocomplete(i) {
		const focusedValue = i.options.getFocused().toLowerCase();
		const choices = [...resourceNames.map(x => x.toLowerCase())];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
		await i.respond(
			filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice) })),
		);
    }
};