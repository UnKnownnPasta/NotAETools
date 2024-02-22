const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock
} = require("discord.js");
const fs = require("node:fs");
const { titleCase } = require("../scripts/utility");

const resources = [
    { name: 'Credits', value: 'credits' },
    { name: 'Alloy Plate', value: 'alloy_plate' },
    { name: 'Asterite', value: 'asterite' },
    { name: 'Aucrux Capacitors', value: 'aucrux_capacitors' },
    { name: 'Bracoid', value: 'bracoid' },
    { name: 'Carbides', value: 'carbides' },
    { name: 'Circuits', value: 'circuits' },
    { name: 'Control Module', value: 'control_module' },
    { name: 'Copernics', value: 'copernics' },
    { name: 'Cryotic', value: 'cryotic' },
    { name: 'Cubic Diodes', value: 'cubic_diodes' },
    { name: 'Detonite Ampule', value: 'detonite_ampule' },
    { name: 'Ferrite', value: 'ferrite' },
    { name: 'Fieldron Sample', value: 'fieldron_sample' },
    { name: 'Forma', value: 'forma' },
    { name: 'Fresnels', value: 'fresnels' },
    { name: 'Gallium', value: 'gallium' },
    { name: 'Gallos Rods', value: 'gallos_rods' },
    { name: 'Hexenon', value: 'hexenon' },
    { name: 'Isos', value: 'isos' },
    { name: 'Kesslers', value: 'kesslers' },
    { name: 'Komms', value: 'komms' },
    { name: 'Morphics', value: 'morphics' },
    { name: 'Mutagen Sample', value: 'mutagen_sample' },
    { name: 'Nano Spores', value: 'nano_spores' },
    { name: 'Neural Sensors', value: 'neural_sensors' },
    { name: 'Neurodes', value: 'neurodes' },
    { name: 'Nitain Extract', value: 'nitain_extract' },
    { name: 'Nullstones', value: 'nullstones' },
    { name: 'Orokin Cell', value: 'orokin_cell' },
    { name: 'Oxium', value: 'oxium' },
    { name: 'Plastids', value: 'plastids' },
    { name: 'Polymer Bundle', value: 'polymer_bundle' },
    { name: 'Pustrels', value: 'pustrels' },
    { name: 'Rubedo', value: 'rubedo' },
    { name: 'Salvage', value: 'salvage' },
    { name: 'Tellurium', value: 'tellurium' },
    { name: 'Ticor Plate', value: 'ticor_plate' },
    { name: 'Titanium', value: 'titanium' },
    { name: 'Trachons', value: 'trachons' },
    { name: 'Detonite Injector', value: 'detonite_injector' },
    { name: 'Fieldron', value: 'fieldron' },
    { name: 'Mutagen Mass', value: 'mutagen_mass' }
  ];
  

module.exports = {
    name: "resouce",
    data: new SlashCommandBuilder()
    .setName('resouce')
    .setDescription('View resources for a specific clan')
    .addStringOption((option) =>
    option
        .setName('resource')
        .setDescription('Resource to view details of')
        .setRequired(true)
        .setAutocomplete(true)
    ),
    /**
     * Command to retrieve resources of a specific clan
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        const resources = (await JSON.parse(fs.readFileSync('./data/clandata.json'))).resources
        const resrc = i.options.getString('resource', true)

        function toggleToName(text) {
            let formattedText = text.replace(/_/g, ' ');
            return titleCase(formattedText);
        }
        
        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${resrc}`);

        await resources.slice(0, -1).map(r => {
            const res = r.resources.filter(x => x.name == toggleToName(resrc))[0]
            clanEmbed.addFields({ name: r.clan, value: `**Amt:** ${`\`${res.amt}\``.padEnd(20)} |  **Short:** \`${res.short}\`` })
        });

        await i.reply({ embeds: [clanEmbed] })
    },
    async autocomplete(i) {
		const focusedValue = i.options.getFocused();
		const choices = [...resources.map(x => x.name.toLowerCase())];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await i.respond(
			filtered.map(choice => ({ name: choice, value: choice.replace(' ', '_') })),
		);
    }
};