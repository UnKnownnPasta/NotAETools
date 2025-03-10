import { EmbedBuilder, MessageFlags, SlashCommandBuilder, codeBlock } from "discord.js";
import { isRelicFF, range } from "../../services/utils.js";
import relicCacheManager from "../../managers/relicCacheManager.js";
import boxCacheManager from "../../managers/boxCacheManager.js";

/** @type {import('../../other/types').InteractionCommand} */
export default {
	name: "resoup",
	enabled: true,
	trigger: "interaction",
	execute: async (client, i) => {
    const soupedText = i.options.getString('oldsoup', true);
    const filtertype = i.options.getString('filtermode', false) ?? false;

    if (soupedText.match(/\b\d+(l|m|n|a)\w+\d+\b/g)) {
        return i.reply({ content: `Making soup using shorthand like **6lg1** is done using the \`/soup\` command, not \`/resoup\``, flags: MessageFlags.Ephemeral });
    }
    await i.deferReply();

    const isSpecialMode = soupedText.includes('[0m');

    function parseStringToList(str) {
        let regex;
        if (isSpecialMode) {
            str = str.replace(//g, '')
            regex = /\d+x\s*\[0m\| \[(2;)?34m(Lith|Meso|Neo|Axi) [A-Z]\d+/g;
        } else {
            regex = /\b\d+x\s*\|\s+(Lith|Meso|Neo|Axi)\s[A-Z]\d+\b/g;
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

    const ansiValues = {"ED": "[35m", "RED": "[31m", "ORANGE": "[33m"}
    const priorityOfStatus = {"ED": 0, "RED": 1, "ORANGE": 2, "YELLOW": 3, "GREEN": 4, "#N/A": 5}

    async function getRelic(name) {
        const relic = relicCacheManager.relicCache.relics.find(
            (r) => r.name === name
        );
        if (!relic) return null;

        const stuffToSpecial = [];
        let StatusArr = relic.rewards.map((part) => {
            let returnrange = range(
                (
                    boxCacheManager.boxCache.find((x) => x.item == part.item) || {
                        amount: 0,
                    }
                ).amount + parseInt(part.stock)
            );

            if (isSpecialMode) {
                stuffToSpecial.push([
                    part.item,
                    priorityOfStatus[returnrange],
                    ansiValues[returnrange],
                ]);
            }
            return [returnrange, priorityOfStatus[returnrange]];
        });

        if (
            filtertype &&
            !(
                Math.min(...StatusArr.filter((x) => !isNaN(x[1])).map((x) => x[1])) <=
                priorityOfStatus[filtertype.toUpperCase()]
            )
        )
            return null;
        return [relic.tokens, StatusArr.map((x) => x[0]), ...stuffToSpecial];
    }
    let soupedAccepted = []

    const duplicateStrings = []
    async function soupedRelics(relic) {
        const soupedStrings = []

        for (const r of relic) {
            let short = r.toLowerCase()
            let howmany, letterstart, rFullName;

            letterstart = short.match(/[a-zA-Z]/); // for 6lg1 gives [ 'l', index: 1, input: '6lg1', groups: undefined ]

            if (!letterstart || letterstart?.index == 0) continue;
            howmany = short.slice(0, letterstart.index)

            rFullName = isRelicFF(short.slice(letterstart.index))
            const res = await getRelic(rFullName);
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
        let r1 = splitFunc(a)
        let r2 = splitFunc(b)
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
        return i.editReply({ content: `Souped relics is too big to render.` })

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
	},
	data: new SlashCommandBuilder()
		.setName("resoup")
		.setDescription("Re-Soup given soup")
		.addStringOption((option) =>
			option
				.setName("oldsoup")
				.setDescription("Relics to soup. This is obtained from /soup")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("filtermode")
				.setDescription("Filter souped relics by type of parts they have")
				.setChoices(
					{ name: "ED", value: "ed" },
					{ name: "RED", value: "red" }
					// { name: 'BOX', value: 'box' },
				)
				.setRequired(false)
		),
};
