const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    codeBlock
} = require("discord.js");
const fs = require('node:fs/promises');
const path = require("node:path");

module.exports = {
    name: 'resoup',
    type: 'slash',
    data: new SlashCommandBuilder()
        .setName('resoup')
        .setDescription('Re-Soup given soup')
        .addStringOption(option => 
        option
            .setName('relics')
            .setDescription('Relics to soup. This is obtained from /soup')
            .setRequired(true))
        .addStringOption(option =>
        option
            .setName('filtertype')
            .setDescription('Filter souped relics by type of parts they have')
            .setChoices(
                { name: 'ED', value: 'ed' },
                { name: 'RED', value: 'red' },
                { name: 'ORANGE', value: 'orange' },
                { name: 'BOX', value: 'box' },
            )
            .setRequired(false)),
    /**
     * Soupify relics
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        let soupedText = i.options.getString('relics', true),
        filtertype = i.options.getString('filtertype', false) ?? false;

        /**
         * @param {String} str 
         * @returns Array
         */
        function parseStringToList(str) {
            const regex = /\d+x\s*\|\s*[^\|]+?\s*\|\s*\d+\s*ED\s*\|\s*\d+\s*RED\s*\|\s*\d+\s*ORANGE/g;
            const matches = str.replace(/\{\d+\}\s*\|\s*/g, '').matchAll(regex);
            return matches || [];
        }
        const toShort = (txt) => `${txt[0].toLowerCase()}${txt.split(' ')[1].toLowerCase()}`

        const filteredToSoups = parseStringToList(soupedText)

        const relics = [];
        for (const match of filteredToSoups) {
            const souptext = match[0].split('|')
            const index = match[0].indexOf('{') == -1 ? 0 : 1
            relics.push(`${souptext[index].trim().replace('x', '')}${toShort(souptext[index+1].trim())}`)
        }

        const [relicsList, boxlist] = await Promise.all([
            JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json'), 'utf-8')),
            JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'BoxData.json'), 'utf-8'))
        ])

        const range = (num) => {
            return num >= 0 && num <= 7 ? 'ED'
                : num > 7 && num <= 15 ? 'RED'
                : num > 15 && num <=31 ? 'ORANGE'
                : num > 31 && num <=64 ? 'YELLOW'
                : 'GREEN'
        }

        async function getRelic(name, type=null) {
            for (const relic of relicsList.relicData) {
                if (relic.name == name) {
                    let StatusArr = relic.rewards.map(part => {
                        let returnrange = range(parseInt(part.stock));
                        if (filtertype == "box") {
                            returnrange = range((boxlist[part.item] ?? 0) + (parseInt(part.stock)))
                        }
                        return returnrange;
                    });
                    if (type && type !== "box" && !StatusArr.includes(type.toUpperCase())) return null;
                    return [relic.tokens, StatusArr];
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

                soupedAccepted.push(short)
                const _ = (rarity) => {
                    return `| ${res[1].filter(x => x == rarity).length}`.padEnd(4) + rarity
                }
                if (res) soupedStrings.push(`${`{${res[0]}}`.padEnd(5)}| ${(howmany+'x').padEnd(4)}| ${rFullName.padEnd(8)} ${_('ED')} ${_('RED')} ${_('ORANGE')}`)
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

        const soupedString = ["Lith", "Meso", "Neo", "Axi"].map(x => {
            let isempty = filterRelics(x)
            if (isempty.length != 0) return isempty.sort(sortFunction).join('\n')
            else return undefined
        })
        .filter(x => x!==undefined)
        .join('\n\n')
        let codeText =  `*CODE: ${soupedAccepted.join(' ')}*`
        if ((soupedString + codeText).length > 4090) 
            return i.reply({ content: `Souped relics is too big to render.`, ephemeral: true })
        
        if (duplicateStrings.length !== 0) {
            i.reply({ content: `Duplicates removed: ${duplicateStrings.join(' ')}`, embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription(codeBlock('ml', soupedString) + '\n\n' + codeText)
             ] })
        } else {
            i.reply({ embeds: [ 
                new EmbedBuilder()
                .setTitle('Souped relics')
                .setDescription(codeBlock('ml', soupedString) + '\n\n' + codeText)
             ] })
        }
    }
}