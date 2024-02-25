const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    codeBlock
} = require("discord.js");
const fs = require("node:fs");
const { titleCase } = require("../scripts/utility");

const resourceNames = [
    'Credits',             'Alloy Plate',
    'Asterite',            'Aucrux Capacitors',
    'Bracoid',             'Carbides',
    'Circuits',            'Control Module',
    'Copernics',           'Cryotic',
    'Cubic Diodes',        'Detonite Ampule',
    'Ferrite',             'Fieldron Sample',
    'Forma',               'Fresnels',
    'Gallium',             'Gallos Rods',
    'Hexenon',             'Isos',
    'Kesslers',            'Komms',
    'Morphics',            'Mutagen Sample',
    'Nano Spores',         'Neural Sensors',
    'Neurodes',            'Nitain Extract',
    'Nullstones',          'Orokin Cell',
    'Oxium',               'Plastids',
    'Polymer Bundle',      'Pustrels',
    'Rubedo',              'Salvage',
    'Tellurium',           'Ticor Plate',
    'Titanium',            'Trachons',
    'Detonite Injector',   'Fieldron',
    'Mutagen Mass'
  ];
  
  

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
        const resources = (await JSON.parse(fs.readFileSync('./data/clandata.json'))).resources
        const resrc = i.options.getString('resource', true)

        if (!resourceList.map(x => x.name).includes(resrc.replace('_', ' '))) 
            return i.reply({ content: `Invalid resource, choose from autofill instead`, ephemeral: true });

        function toggleToName(text) {
            let formattedText = text.replace(/_/g, ' ');
            return titleCase(formattedText);
        }
        
        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${resrc.replace('_', ' ')}`);

        await resources.slice(0, -1).map(r => {
            const res = r.resources.filter(x => x.name == toggleToName(resrc))[0]
            clanEmbed.addFields({ name: r.clan, value: `**Amt:** \`${res.amt}\` | **Short:** \`${res.short}\`` })
        });

        await i.reply({ embeds: [clanEmbed] })
    },
    async autocomplete(i) {
		const focusedValue = i.options.getFocused();
		const filtered = resourceNames.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
		await i.respond(
			filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice).replace(' ', '_') })),
		);
    }
};