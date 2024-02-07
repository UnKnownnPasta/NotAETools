const { Client, Message, EmbedBuilder, codeBlock } = require('discord.js')
const fs = require('node:fs')
const { err } = require('../../data/utils')

const types = { 
    ED: "#0d071e",
    RED: "#3c0000",
    ORANGE: "#472502",
    YELLOW: "#4b3800",
    GREEN: "#162e0b"
}

module.exports = {
    name: ['soup'],
    type: 'msg',
    /**
    * Soup formats given relic codes
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {
        const response = await message.channel.send({ content: `Preparing..` })

        async function getRelic(name) {
            const relicsList = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
            for (const relic of relicsList) {
                if (relic[0][0] == name) return [relic.map(x => x[0]), relic.map(x => x[1])]
            }
            return null
        }

        async function soupedType(relic) {
            const soupedStrings = []
            const soups = []
            const relicEra = relic.split('_')
            for (const i of relicEra) {
                var currentRelic = i.toLowerCase()
                var era, type, howmany, firstindex, currentEra;

                if (currentRelic.length > 7) continue
                try {
                    firstindex = currentRelic.search(/[a-zA-Z]/)
                } catch (e) { continue }
                howmany = currentRelic.slice(0, firstindex)
                currentEra = currentRelic.slice(firstindex)
                soups.push(currentRelic)
                if (!howmany) continue
                else if (!isNaN(currentRelic)) continue
                else if (currentEra[0] === 'a') era = "Axi"
                else if (currentEra[0] === 'n') era = "Neo"
                else if (currentEra[0] === 'm') era = "Meso"
                else if (currentEra[0] === 'l') era = "Lith"
                type = currentRelic.slice(firstindex + 1).toUpperCase()

                const res = await getRelic(`${era} ${type}`)
                if (res == null) continue
                soupedStrings.push(`${`${howmany + "x"}`.padEnd(5)}| ${`${era} ${type}`.padEnd(9)}| ${res[1].slice(1,7).filter(x => x == types.ED).length} ED | ${res[1].slice(1,7).filter(x => x == types.RED).length} RED | ${res[1].slice(1,7).filter(x => x == types.ORANGE).length} ORANGE |`)
            }

            return [soupedStrings, soups]
        }

        const msgfilter = message.content.toLowerCase().split(' ').slice(1)
        const relics = msgfilter.splice(msgfilter.indexOf('soup')+1).join('_')
        const soupedRelics = (await soupedType(relics))
        const axirelics = [... new Set(soupedRelics[0].filter(x => x.indexOf(`Axi`) !== -1))]
        const neorelics = [... new Set(soupedRelics[0].filter(x => x.indexOf(`Neo`) !== -1))]
        const mesorelics = [... new Set(soupedRelics[0].filter(x => x.indexOf(`Meso`) !== -1))]
        const lithrelics = [... new Set(soupedRelics[0].filter(x => x.indexOf(`Lith`) !== -1))]
        response.edit({ embeds: [
            new EmbedBuilder()
            .setTitle(`Soup formatted`)
            .setDescription(`${codeBlock('ml', `${axirelics.length !== 0? axirelics.join('\n')+ '\n\n' : ''}${neorelics.length !== 0? neorelics.join('\n')+ '\n\n' : ''}${mesorelics.length !== 0? mesorelics.join('\n')+ '\n\n' : ''}${lithrelics.length !== 0? lithrelics.join('\n')+ '\n\n' : ''}`)}\n\n*CODE: ${soupedRelics[1].join(' ')}*`)
        ], content: null })
    }
}