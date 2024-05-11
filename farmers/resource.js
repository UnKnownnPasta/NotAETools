const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
} = require("discord.js");
const fs = require("node:fs/promises");
const { titleCase } = require("../scripts/utility");
const path = require("node:path");
const { getAllClanData } = require("../scripts/dbcreate");

const resourceNames = [
    'Credits', 'Alloy Plate',
    'Asterite', 'Aucrux Capacitors',
    'Bracoid', 'Carbides',
    'Circuits', 'Control Module',
    'Copernics', 'Cryotic',
    'Cubic Diodes', 'Detonite Ampule',
    'Ferrite', 'Fieldron Sample',
    'Forma', 'Fresnels',
    'Gallium', 'Gallos Rods',
    'Hexenon', 'Isos',
    'Kesslers', 'Komms',
    'Morphics', 'Mutagen Sample',
    'Nano Spores', 'Neural Sensors',
    'Neurodes', 'Nitain Extract',
    'Nullstones', 'Orokin Cell',
    'Oxium', 'Plastids',
    'Polymer Bundle', 'Pustrels',
    'Rubedo', 'Salvage',
    'Tellurium', 'Ticor Plate',
    'Titanium', 'Trachons',
    'Detonite Injector', 'Fieldron',
    'Mutagen Mass'
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
    ),
    /**
     * Command to retrieve clan wise resources
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        const resrc = i.options.getString('resource', true)

        if (!resourceNames.includes(resrc)) 
            return i.reply({ content: `Invalid resource, choose from autofill instead`, ephemeral: true });

        const resources = await getAllClanData();
        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${resrc}`);

        await resources.slice(0, -1).map(r => {
            const res = Object.entries(r.resource).filter(([ key, value ]) => key == resrc)[0]
            clanEmbed.addFields({ name: reverseClan[r.clan], value: `**Amt:** \`${res[1].amt}\` | **Short:** \`${res[1].short}\`` })
        });

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