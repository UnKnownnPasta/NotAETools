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
const fs = require("node:fs");
const { titleCase } = require('../scripts/utility')

const resourceList = [
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
    name: "fhost",
    data: new SlashCommandBuilder()
        .setName("fhost")
        .setDescription("Hosts a farmers run")
        .addStringOption((option) =>
        option
            .setName("mission")
            .setDescription("Name of mission being run")
            .setRequired(true)
        )
        .addStringOption((option) =>
        option
            .setName("resource")
            .setDescription("Resource being farmed (has autocomplete)")
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption((option) => 
        option
            .setName('frame')
            .setDescription('Frame being used by host')
            .setRequired(true)
            .addChoices(
                { name: 'Khora', value: 'Khora' },
                { name: 'Nekros', value: 'Nekros' },
                { name: 'Nova', value: 'Nova' },
                { name: 'Wisp', value: 'Wisp' },
                { name: 'Any', value: 'Any' }
            )
        )
        .addStringOption((option) =>
        option
            .setName('missiontype')
            .setDescription('The type of mission being farmed')
            .setRequired(true)
            .addChoices(
                { name: 'Survival', value: 'Survival' },
                { name: 'Defense', value: 'Defense' },
                { name: 'Excavation', value: 'Excavation' }
            )
        )
        .addIntegerOption((option) => 
        option
            .setName('duration')
            .setDescription('Duration of farm in minutes, eg. 180')
            .setRequired(false)
        ),
    /**
     * Farmer exclusive command to host runs; to squad up
     * @param {CommandInteraction} i
     * @param {Client} client
     */
    async execute(client, i) {
        const mission = i.options.getString('mission', true).toLowerCase(),
            resource = i.options.getString('resource', true),
            frame = i.options.getString('frame', true),
            mstype = i.options.getString('missiontype', true),
            dura = i.options.getInteger('duration', false) ?? 0;

        const farmEmbed = new EmbedBuilder()
        .setTitle(`${titleCase(mission)} - ${titleCase(mstype)}, ${titleCase(resource.replace('_', ' '))}, for ${!dura ? '20 Waves' : `${dura} mins`}\n`)

        const buildBtn = (frame, type) => {
            return new ButtonBuilder()
            .setCustomId(`fhost-${frame.toLowerCase().replace(' ', '_')}`)
            .setLabel(frame)
            .setStyle(type);
        }
        const anyBtn = buildBtn('Any', ButtonStyle.Primary)
        const nekrosBtn = buildBtn('Nekros', ButtonStyle.Success)
        const nekros2Btn = buildBtn('Nekros 2', ButtonStyle.Success)
        const khoraBtn = buildBtn('Khora', ButtonStyle.Success)
        const novaBtn = buildBtn('Nova', ButtonStyle.Success)
        const wispBtn = buildBtn('Wisp', ButtonStyle.Success)
        const cancelBtn = buildBtn('❌', ButtonStyle.Danger)

        const possFrames = [anyBtn, nekrosBtn, khoraBtn, wispBtn, novaBtn, nekros2Btn]
        possFrames.forEach(fm => {
            if (fm.data.custom_id == `fhost-${frame.toLowerCase()}`) fm.setDisabled(true)
            if (fm.data.custom_id !== 'fhost-❌')
                farmEmbed.addFields({name: `${fm.data.label}`, value:`${fm.data.disabled ? `<@${i.user.id}>` : 'None'}`, inline: true})
        });

        const framesButtons = new ActionRowBuilder().addComponents(nekrosBtn, khoraBtn, nekros2Btn, novaBtn, wispBtn)
        const optionBtn = new ActionRowBuilder().addComponents(anyBtn, cancelBtn)

        i.reply({ content: `<@${i.user.id}>`, embeds: [farmEmbed], components: [framesButtons, optionBtn] })
    },
    async autocomplete(i) {
		const focusedValue = i.options.getFocused();
		const choices = [...resourceList.map(x => x.name.toLowerCase())];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue)).slice(0, 25);
		await i.respond(
			filtered.map(choice => ({ name: titleCase(choice), value: titleCase(choice).replace(' ', '_') })),
		);
    }
};