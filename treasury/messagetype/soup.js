const { Client, Message, EmbedBuilder, codeBlock } = require('discord.js')
const fs = require('node:fs')
const { checkForRelic } = require('../../data/utils')

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

        const validrelics = []
        async function soupedType(relic) {
            const soupedStrings = []
            const relicShorthands = relic.split('_')
            for (const i of relicShorthands) {
                var currentRelic = i.toLowerCase()
                var howmany, firstindex, fishedRelicName;

                if (currentRelic.length > 7) continue
                firstindex = currentRelic.match(/[a-zA-Z]/);
                
                if (firstindex == null) continue
                if (firstindex.index == 0) continue
                howmany = currentRelic.slice(0, firstindex.index)
                fishedRelicName = currentRelic.slice(firstindex.index)

                const verifiedRelic = checkForRelic(fishedRelicName)
                if (!verifiedRelic) continue

                const res = await getRelic(verifiedRelic)
                if (res == null) continue
                validrelics.push(i)
                soupedStrings.push(`${`${howmany + "x"}`.padEnd(5)}| ${verifiedRelic.padEnd(9)}| ${res[1].slice(1,7).filter(x => x == types.ED).length} ED | ${res[1].slice(1,7).filter(x => x == types.RED).length} RED | ${res[1].slice(1,7).filter(x => x == types.ORANGE).length} ORANGE |`)
            }

            return soupedStrings
        }

        const msgfilter = message.content.toLowerCase().split(' ').slice(1)
        const relics = msgfilter.splice(msgfilter.indexOf('soup')+1).join('_')
        const soupedRelics = (await soupedType(relics))
        const axirelics = [... new Set(soupedRelics.filter(x => x.indexOf(`Axi`) !== -1))]
        const neorelics = [... new Set(soupedRelics.filter(x => x.indexOf(`Neo`) !== -1))]
        const mesorelics = [... new Set(soupedRelics.filter(x => x.indexOf(`Meso`) !== -1))]
        const lithrelics = [... new Set(soupedRelics.filter(x => x.indexOf(`Lith`) !== -1))]
        response.edit({ embeds: [
            new EmbedBuilder()
            .setTitle(`Soup formatted`)
            .setDescription(`${codeBlock('ml', `${axirelics.length !== 0? axirelics.join('\n')+ '\n\n' : ''}${neorelics.length !== 0? neorelics.join('\n')+ '\n\n' : ''}${mesorelics.length !== 0? mesorelics.join('\n')+ '\n\n' : ''}${lithrelics.length !== 0? lithrelics.join('\n')+ '\n\n' : ''}`)}\n\n*CODE: ${validrelics.join(' ')}*`)
        ], content: null })
    }
}