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
    name: 'resoup',
    data: new SlashCommandBuilder()
        .setName('resoup')
        .setDescription('Re-Soup given soup')
        .addStringOption(option => 
        option
            .setName('oldsoup')
            .setDescription('Relics to soup. This is obtained from /soup')
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
            .setRequired(false)),
    /**
     * Soupify relics
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        let soupedText = i.options.getString('oldsoup', true),
        filtertype = i.options.getString('filtertype', false) ?? false;

        if (soupedText.match(/\b\d+(l|m|n|a)\w+\d+\b/g)) {
            return i.editReply({ content: `Making soup using shorthand like **6lg1** is done using the \`/soup\` command, not \`/resoup\``,
                ephemeral: true
             })
        }

        const isSpecialMode = soupedText.includes('[0m');

        /**
         * @param {String} str 
         * @returns Array
         */
        function parseStringToList(str) {
            let regex;
            if (isSpecialMode) {
                str = str.replace(//g, '')
                regex = /\d+x\s*\[0m\| \[(2;)?34m(Lith|Meso|Neo|Axi) [A-Z]\d+/g;
            } else {
                regex = /\b\d+x\s+\|\s+(Lith|Meso|Neo|Axi)\s[A-Z]\d+\b/g;
            }
            const matches = str.matchAll(regex);
            return matches || [];
        }
        const toShort = (txt) => `${txt[0][0].toLowerCase()}${txt[1].toLowerCase()}`

        const filteredToSoups = parseStringToList(soupedText)

        const relics = [];
        for (const match of filteredToSoups) {
            if (isSpecialMode) {
                const pmatch = match[0].replace(/\s*\[0m\| /g, ' ').replace(/\[(2;)?34m/, '')
                const pSplitted = pmatch.replace('|', '').split(/\s+/g)
                relics.push(`${pSplitted[0].slice(0, -1)}${toShort(pSplitted.slice(1))}`)
            } else {
                const splitted = match[0].replace('|', '').split(/\s+/g)
                relics.push(`${splitted[0].slice(0, -1)}${toShort(splitted.slice(1))}`)
            }
        }

        const [relicsList, boxlist] = await Promise.all([
            JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json'), 'utf-8')),
            await getAllBoxData(client)
        ])
        
        const range = (num) => 
            num >= 0 && num <= 10 ? 'ED'
            : num > 10 && num <= 15 ? 'RED'
            : num > 15 && num <= 31 ? 'ORANGE'
            : num > 31 && num <= 64 ? 'YELLOW'
            : num > 64 ? 'GREEN' : '';

        const ansiValues = {"ED": "[35m", "RED": "[31m", "ORANGE": "[33m"}

        const priorityOfStatus = {"ED": 0, "RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4, "#N/A": 5}

        async function getRelic(name, type=null) {
            for (const relic of relicsList.relicData) {
                if (relic.name == name) {
                    const stuffToSpecial = []
                    let StatusArr = relic.rewards.map(part => {
                        let returnrange = range(parseInt(part.stock));
                        if (true) {
                            returnrange = range((boxlist[part.item.replace(' x2', '')] ?? 0) + (parseInt(part.stock)))
                        }
                        if (isSpecialMode) {
                            stuffToSpecial.push([part.item, priorityOfStatus[returnrange], ansiValues[returnrange]])
                        }
                        return [returnrange, priorityOfStatus[returnrange]];
                    });
                    if (type && type !== "box" && !(Math.min(...StatusArr.map(x => x[1])) <= priorityOfStatus[type.toUpperCase()])) return null;
                    return [relic.tokens, StatusArr.map(x => x[0]), ...stuffToSpecial];
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

                letterstart = short.match(/[a-zA-Z]/); // for 6lg1 gives [ 'l', index: 1, input: '6lg1', groups: undefined ]

                if (!letterstart || letterstart?.index == 0) continue;
                howmany = short.slice(0, letterstart.index)

                const fullfms = {'a': 'Axi', 'l': 'Lith', 'm': 'Meso', 'n': 'Neo'}
                const relicEra = fullfms[short.slice(letterstart.index, letterstart.index+1)]
                const relicType = short.slice(letterstart.index+1).toUpperCase()
                rFullName = `${relicEra} ${relicType}`
                const res = !filtertype ? await getRelic(rFullName) : await getRelic(rFullName, filtertype)
                if (!res) continue;
                if (soupedAccepted.filter(str => str.match(/\d+([a-zA-Z]*\d+)/)[1] === short.toLowerCase().slice(letterstart.index)).length) {
                    duplicateStrings.push(short); continue;
                }
                if (isNaN(howmany)) continue;
                howmany = `${(parseInt(howmany)/3 | 0)*3}`
                soupedAccepted.push(short)

                if (isSpecialMode) {
                    let goodParts = res.slice(2).sort((a, b) => a[1] - b[1]).filter(x => x[2]).slice(0, 2).map(x => {
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
                .setTitle('Resouped relics')
                .setDescription((isSpecialMode ? codeBlock('ansi', soupedString) : codeBlock('ml', soupedString)) + codeText)
             ] })
        } else {
            i.editReply({ embeds: [ 
                new EmbedBuilder()
                .setTitle('Resouped relics')
                .setDescription((isSpecialMode ? codeBlock('ansi', soupedString) : codeBlock('ml', soupedString)) + codeText)
             ] })
        }
    }
}