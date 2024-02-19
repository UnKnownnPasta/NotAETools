const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
} = require("discord.js");
const fs = require('node:fs')
const { bycode } = require('../data/config.json')

module.exports = {
    name: 'soup',
    data: new SlashCommandBuilder()
        .setName('soup')
        .setDescription('Soup formatted relics')
        .addStringOption(option => 
        option
            .setName('relics')
            .setDescription('Relics to soup. Relics are of format 8lg1, which means 8x lith g1')
            .setRequired(true))
        .addStringOption(option => 
        option
            .setName('filtertype')
            .setDescription('Filter souped relics by type of parts they have')
            .setChoices(
                { name: 'ED', value: 'ed' },
                { name: 'RED', value: 'red' },
                { name: 'ORANGE', value: 'orange' },
            )
            .setRequired(false)),
    /**
     * Soupify relics
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        const relics = i.options.getString('relics', true).split(' '),
            filtertype = i.options.getString('filtertype', false) ?? 'none';

        const relicsList = (await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8')));
        async function getRelic(name) {
            for (const relic of relicsList.relicData) {
                if (relic[0].name == name) return [relic[0].name, relic.slice(1, 7).map(x => x.type)]
            }
            return null
        }
        let soupedAccepted = []

        async function soupedRelics(relic) {
            const soupedStrings = []

            for (const r of relic) {
                var cr = r.toLowerCase()
                var howmany, letterstart, relicfullname;

                letterstart = cr.match(/[a-zA-Z]/);
            }
        }
    }
}