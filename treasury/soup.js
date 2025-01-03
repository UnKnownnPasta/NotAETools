const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    codeBlock
} = require("discord.js");
const fs = require('node:fs/promises');
const path = require("node:path");
const { getAllBoxData } = require("../scripts/dbcreate");

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
                // { name: 'BOX', value: 'box' },
            )
            .setRequired(false))
        .addBooleanOption(option => 
            option
                .setName('new')
                .setDescription('Renders soup in a new method')
                .setRequired(false)
        ),
    /**
     * Soupify relics
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        const relics = i.options.getString('relics', true).split(' '),
            filtertype = i.options.getString('filtertype', false);
        const isSpecialMode = i.options.getBoolean('new', false) ?? false;

        if (relics.join(' ').match(/\d+x\s*\|\s*[^\|]+?\s*\|\s*\d+\s*ED\s*\|\s*\d+\s*RED\s*\|\s*\d+\s*ORANGE/g) || relics.join(' ').includes('')) {
            return i.editReply({ content: `Resouping of soup like\n\`\`\`ml\n{12} | 12x | Lith K2  | 1 ED | 0 RED | 2 ORANGE\`\`\`is done using \`/resoup\` not \`/soup\`.`,
                ephemeral: true
            })
        }
        
        const [relicsList, boxlist] = await Promise.all([
            JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json'), 'utf-8')),
            await getAllBoxData(client)
        ])
        
        const range = (num) => 
            num >= 0 && num <= 11 ? 'ED'
            : num > 11 && num <= 23 ? 'RED'
            : num > 23 && num <= 39 ? 'ORANGE'
            : num > 39 && num <= 59 ? 'YELLOW'
            : num > 59 ? 'GREEN' : '';

        const ansiValues = {"ED": "[35m", "RED": "[31m", "ORANGE": "[33m"}

        const priorityOfStatus = {"ED": 0, "RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4, "#N/A": 5}

        async function getRelic(name) {
            const relic = relicsList.relicData.find(r => r.name === name)

            if (!relic) return null;
            const stuffToSpecial = []
            let StatusArr = relic.rewards.map(part => {
                let returnrange = range((boxlist[part.item.replace(" x2", "")] ?? 0) + parseInt(part.stock));

                if (isSpecialMode) {
                    stuffToSpecial.push([part.item, priorityOfStatus[returnrange], ansiValues[returnrange]])
                }
                return [returnrange, priorityOfStatus[returnrange]];
            });

            if (filtertype && !(Math.min(...StatusArr.filter(x => !isNaN(x[1])).map(x => x[1])) <= priorityOfStatus[filtertype.toUpperCase()])) return null;
            return [relic.tokens, StatusArr.map(x => x[0]), ...stuffToSpecial];
        }
        let soupedAccepted = []

        const duplicateStrings = []
        async function soupedRelics(relic) {
            const soupedStrings = []

            for (const r of relic) {
                var short = r.toLowerCase()
                var howmany, letterstart, rFullName;

                letterstart = short.match(/[a-zA-Z]/); // for 6lg1 gives [ 'l', index: 1, input: '6lg1', groups: undefined ]

                if (!letterstart || letterstart?.index == 0) continue;
                howmany = short.slice(0, letterstart.index)

                const fullfms = {'a': 'Axi', 'l': 'Lith', 'm': 'Meso', 'n': 'Neo'}
                const relicEra = fullfms[short.slice(letterstart.index, letterstart.index+1)]
                const relicType = short.slice(letterstart.index+1).toUpperCase()
                rFullName = `${relicEra} ${relicType}`
                const res = await getRelic(rFullName)
                if (!res) continue;
                if (soupedAccepted.filter(str => str.match(/\d+([a-zA-Z]*\d+)/)[1] === short.toLowerCase().slice(letterstart.index)).length) {
                    duplicateStrings.push(short); continue;
                }
                if (isNaN(howmany)) continue;
                howmany = `${(parseInt(howmany)/3 | 0)*3}`
                soupedAccepted.push(short)

                if (isSpecialMode) {
                    let goodParts = res.slice(2).filter(x => x[2]).sort((a, b) => a[1] - b[1]).slice(0, 2).map(x => {
                        return `${x[2]}${x[0].replace(" x2", "")}[0m`
                    })

                    soupedStrings.push(`[37m${`{${res[0]}}`.padEnd(5)}[0m| [37m${(howmany+'x').padEnd(4)}[0m| [34m${rFullName.padEnd(8)}[0m | ${goodParts.join(', ')}`)
                } else {
                    const _ = (rarity) => {
                        return `| ${res[1].filter(x => x == rarity).length}`.padEnd(4) + rarity
                    }
                    soupedStrings.push(`${`{${res[0]}}`.padEnd(5)}| ${(howmany+'x').padEnd(4)}| ${rFullName.padEnd(8)} ${_('ED')} ${_('RED')} ${_('ORANGE')}`)
                }
            }
            return soupedStrings
        }

        const splitFunc = (r) => {
            const rSplit = r.split('|')
            const l = rSplit.map(x => x.trim())
            if (isSpecialMode) {
                const countOf = (x) => (r.match(new RegExp(x, 'g')) || []).length;
                const tokenParse = parseInt(l[0].match(/\{(\d+)\}/)[1]) ?? 0
                const counts = [countOf('\\[35m'), countOf('\\[31m'), countOf('\\[33m')]

                return [tokenParse, counts, rSplit[1].match(/\d+/)[0]]
            } else {
                const ED = l[3].split()[0]; const RED = l[4].split()[0]; const ORG = l[5].split()[0]
                return `${ED}${RED}${ORG}-${rSplit[0].match(/\d+/)[0]}-${rSplit[1].match(/\d+/)[0]}`
            }
        }
        const sortFunction = (a, b) => {
            r1 = splitFunc(a)
            r2 = splitFunc(b)
            if (!isSpecialMode) {
                r1 = r1.split('-')
                r2 = r2.split('-')
                if (r1[0] === r2[0]) {
                    if (r1[1] === r2[1]) return parseInt(r2[2]) - parseInt(r1[2])
                    return parseInt(r2[1]) - parseInt(r1[1])
                }
                return r2[0].localeCompare(r1[0])
            } else {
                const testa = r1[1].join("")
                const testb = r2[1].join("")
                if (testa === testb) {
                    if (r1[0] === r2[0]) {
                        return r2[2] - r1[2]
                    }
                    return r2[0] - r1[0];
                }
                return testb.localeCompare(testa)
            }
        };

        const finishedSoup = (await soupedRelics(relics));
        const filterRelics = (rname) => {
            return finishedSoup.filter(x => x.split('|')[2].trim().indexOf(rname) !== -1);
        }

        const soupedString = ["Lith", "Meso", "Neo", "Axi"].map(x => {
            let isempty = filterRelics(x)
            if (isempty.length != 0) return isempty.sort(sortFunction).join('\n')
            else return undefined
        })
        .filter(x => x!==undefined)
        .join('\n\n')
        let codeText =  `\n*CODE: ${soupedAccepted.join(' ')}*`
        if (soupedString.length > 4096 - codeText.length)
            return i.editReply({ content: `Souped relics is too big to render.`, ephemeral: true })
        
        if (duplicateStrings.length !== 0) {
            i.editReply({ content: `Duplicates removed: ${duplicateStrings.join(' ')}`, embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription((isSpecialMode ? codeBlock('ansi', soupedString) : codeBlock('ml', soupedString)) + codeText)
             ] })
        } else {
            i.editReply({ embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription((isSpecialMode ? codeBlock('ansi', soupedString) : codeBlock('ml', soupedString)) + codeText)
             ] })
        }
    }
}