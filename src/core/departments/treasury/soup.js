const {
    SlashCommandBuilder,
    Client,
    CommandInteraction,
    EmbedBuilder,
    codeBlock
} = require('discord.js')
const database = require('../../../database/init')
const { QueryTypes } = require('sequelize')

module.exports = {
    name: 'soup',
    type: 'slash',
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
                .setName('filterby')
                .setDescription('Filter souped relics by type of parts they have')
                .setChoices(
                    { name: 'ED', value: 'ED' },
                    { name: 'RED', value: 'RED' },
                    { name: 'ORANGE', value: 'ORANGE' }
                )
                .setRequired(false)),
    /**
     * Soupify relics
     * @param {Client} client
     * @param {CommandInteraction} i
     */
    async execute (client, i) {
        const relics = i.options.getString('relics', true).replace('/soup relics:', '').split(' ')
        const filterby = i.options.getString('filterby', false) ?? false;
        await i.deferReply();

        const relicsList = await database.models.Relics.findAll()

        async function getRelic(name) {
            const foundRelic = relicsList.find(r => r.dataValues.relic === name)
            const dbRequests = []

            if (foundRelic) {
                const relicRewards = foundRelic.dataValues.rewards.map(rt => rt.part)
                relicRewards.map(rw => dbRequests.push(database.models.Parts.findOne({ where: { name: rw } })))

                const partColors = []
                await Promise.all(dbRequests).then((results) => {
                    results.map(r => partColors.push(r?.dataValues?.color ?? ""))
                })
                if (filterby && !partColors.includes(filterby)) return null;
                const tokens = await database.models.Tokens.findOne({ where: { relic: foundRelic.dataValues.relic } })

                return [foundRelic.dataValues, partColors, tokens.dataValues.tokens];
            } else {
                return null;
            }
        }

        const soupedAccepted = []
        const duplicateStrings = []

        async function soupedRelics(allRelics) {
            const soupedStrings = []

            for (const r of allRelics) {
                var short = r.toLowerCase()
                var howmany, letterstart, rFullName

                letterstart = short.match(/[a-zA-Z]/) // for 6lg1 gives [ 'l', index: 1, input: '6lg1', groups: undefined ]

                if (!letterstart || letterstart?.index == 0) continue;
                howmany = short.slice(0, letterstart.index)

                const fullfms = { a: 'Axi', l: 'Lith', m: 'Meso', n: 'Neo' }
                const relicEra = fullfms[short.slice(letterstart.index, letterstart.index + 1)]
                const relicType = short.slice(letterstart.index + 1).toUpperCase()
                rFullName = `${relicEra} ${relicType}`

                const res = await getRelic(rFullName);
                if (!res) continue;

                if (soupedAccepted.some(str => str.match(/\d+(.*)/)[1] === short.slice(letterstart.index))) {
                    duplicateStrings.push(short);
                    continue;
                }

                soupedAccepted.push(short)
                const loclr = (rarity) => {
                    return `| ${res[1].filter(x => x === rarity).length}`.padEnd(4) + rarity
                }
                soupedStrings.push(`${`{${res[2]}}`.padEnd(5)}| ${(howmany + 'x').padEnd(4)}| ${rFullName.padEnd(8)} ${loclr('ED')} ${loclr('RED')} ${loclr('ORANGE')}`)
            }
            return soupedStrings
        }

        const splitFunc = (r) => {
            const rSplit = r.split('|')
            const l = rSplit.map(x => x.trim()) // 3, 4, 5
            const ED = l[3].split()[0]; const RED = l[4].split()[0]; const ORG = l[5].split()[0]
            return `${ED}${RED}${ORG}-${rSplit[0].match(/\d+/)[0]}-${rSplit[1].match(/\d+/)[0]}`
        }
        const sortFunction = (a, b) => {
            r1 = splitFunc(a).split('-')
            r2 = splitFunc(b).split('-')
            if (r1[0] === r2[0]) {
                if (r1[1] === r2[1]) return parseInt(r2[2]) - parseInt(r1[2])
                return parseInt(r2[1]) - parseInt(r1[1])
            }
            return r2[0].localeCompare(r1[0])
        }

        const finishedSoup = (await soupedRelics(relics))
        const filterRelics = (rname) => {
            return finishedSoup.filter(x => x.split('|')[2].trim().indexOf(rname) !== -1)
        }

        const soupedString = ['Axi', 'Neo', 'Meso', 'Lith'].map(x => {
            const isempty = filterRelics(x)
            if (isempty.length != 0) return isempty.sort(sortFunction).join('\n')
            else return undefined
        })
            .filter(x => x !== undefined)
            .join('\n\n')
        const codeText = `*CODE: ${soupedAccepted.join(' ')}*`
        if ((soupedString + codeText).length > 4090) { return i.editReply({ content: 'Souped relics is too big to render.', ephemeral: true }) }

        if (duplicateStrings.length !== 0) {
            await i.editReply({
                content: `Duplicates removed: ${duplicateStrings.join(' ')}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Souped relics')
                        .setDescription(codeBlock('ml', soupedString) + '\n\n' + codeText)
                ]
            })
        } else {
            await i.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Souped relics')
                        .setDescription(codeBlock('ml', soupedString) + '\n\n' + codeText)
                ]
            })
        }
    }
}
