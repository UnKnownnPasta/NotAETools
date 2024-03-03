const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    codeBlock
} = require("discord.js");
const fs = require('node:fs/promises')

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
            filtertype = i.options.getString('filtertype', false) ?? false;

        const relicsList = (await JSON.parse(await fs.readFile('./data/relicdata.json', 'utf-8')));
        async function getRelic(name, type=null) {
            for (const relic of relicsList.relicData) {
                if (relic[0].name == name) {
                    let statuses = relic.slice(1, 7).map(rt => rt.type);
                    if (type && !statuses.includes(type.toUpperCase())) return null;
                    return [relic[0].tokens, statuses];
                }
            }
            return null
        }
        let soupedAccepted = []

        const duplicateStrings = []
        async function soupedRelics(relic) {
            const soupedStrings = []

            for (const r of relic) {
                var short = r.toLowerCase()
                var howmany, letterstart, rFullName;

                letterstart = short.match(/[a-zA-Z]/); // for lg1 gives [ 'l', index: 1, input: '6lg1', groups: undefined ]

                if (!letterstart || letterstart?.index == 0) continue;
                howmany = short.slice(0, letterstart.index)

                const fullfms = {'a': 'Axi', 'l': 'Lith', 'm': 'Meso', 'n': 'Neo'}
                const relicEra = fullfms[short.slice(letterstart.index, letterstart.index+1)]
                const relicType = short.slice(letterstart.index+1).toUpperCase()
                rFullName = `${relicEra} ${relicType}`
                const res = !filtertype ? await getRelic(rFullName) : await getRelic(rFullName, filtertype)
                if (!res) continue;
                if (soupedAccepted.filter(str => str === short.toLowerCase().slice(letterstart.index)).length) {
                    duplicateStrings.push(short); continue;
                }

                soupedAccepted.push(short.toLowerCase().slice(letterstart.index))
                const _ = (rarity) => {
                    return `| ${res[1].filter(x => x == rarity).length}`.padEnd(4) + rarity
                }
                if (res) soupedStrings.push(`${`{${res[0]}}`.padEnd(4)} | ${(howmany+'x').padEnd(4)}| ${rFullName.padEnd(8)} ${_('ED')} ${_('RED')} ${_('ORANGE')}`)
            }
            return soupedStrings
        }

        const splitFunc = (r) => {
            let l = r.split('|').map(x => x.trim()) // 3, 4, 5
            let ED = l[3].split()[0], RED = l[4].split()[0], ORG = l[5].split()[0]
            return `${ED}${RED}${ORG}`
        }
        const sortFunction = (a, b) => {
            r1 = splitFunc(a)
            r2 = splitFunc(b)
            return r2.localeCompare(r1);
        };

        const finishedSoup = (await soupedRelics(relics));
        const filterRelics = (rname) => {
            return finishedSoup.filter(x => x.split('|')[2].trim().indexOf(rname) !== -1);
        }

        const soupedString = ['Axi', 'Neo', 'Meso', 'Lith'].map(x => {
            let isempty = filterRelics(x)
            if (isempty.length != 0) return isempty.sort(sortFunction).join('\n')
            else return undefined
        })
        .filter(x => x!==undefined)
        .join('\n\n')
        
        if (duplicateStrings.length !== 0) {
            i.reply({ content: `Duplicates found: ${duplicateStrings.join(' ')}`, embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription(codeBlock('ml', soupedString) + '\n\n' + `*CODE: ${soupedAccepted.join(' ')}*`)
             ] })
        } else {
            i.reply({ embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription(codeBlock('ml', soupedString) + '\n\n' + `*CODE: ${soupedAccepted.join(' ')}*`)
             ] })
        }
    }
}