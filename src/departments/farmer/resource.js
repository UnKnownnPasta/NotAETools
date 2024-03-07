const {
    EmbedBuilder,
    SlashCommandBuilder,
    Client,
    CommandInteraction,
} = require("discord.js");
const fs = require("node:fs/promises");
const { titleCase } = require("../../handler/bHelper.js");

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
        const resources = (await JSON.parse(await fs.readFile('./src/data/clandata.json'))).resources
        const resrc = i.options.getString('resource', true)

        if (!resourceNames.includes(resrc)) 
            return i.reply({ content: `Invalid resource, choose from autofill instead`, ephemeral: true });
        
        const clanEmbed = new EmbedBuilder()
        .setTitle(`Resource overview of ${resrc}`);

        await resources.slice(0, -1).map(r => {
            const res = r.resources.filter(x => x.name == resrc)[0]
            clanEmbed.addFields({ name: r.clan, value: `**Amt:** \`${res.amt}\` | **Short:** \`${res.short}\`` })
        });

        await i.reply({ embeds: [clanEmbed] })
    },
    async autocomplete(i) {
		const focusedValue = i.options.getFocused();
		const choices = [...resourceNames.map(x => x.toLowerCase())];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
		await i.respond(
			filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice) })),
		);
    }
};