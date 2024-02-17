const { Client, Message, EmbedBuilder, codeBlock } = require('discord.js')
const fs = require('node:fs')
const { checkForRelic } = require('../../data/utils')

const types = { 
    ED: "#150b2e",
    RED: "#3c0000",
    ORANGE: "#472502",
    YELLOW: "#4b3800",
    GREEN: "#162e0b"
}

module.exports = {
    name: ['soup', 'souped'],
    type: 'msg',
    /**
    * Soup formats given relic codes
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {
        const response = await message.channel.send({ content: `Preparing..` })

        const relicsList = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
        async function getRelic(name) {
            for (const relic of relicsList) {
                if (relic[0][0] == name) return [relic.map(x => x[0]), relic.map(x => x[1])]
            }
            return null
        }
        var content = [];

        const validrelics = []
        async function soupedType(relic) {
            const soupedStrings = []
            const relicShorthands = relic.split('_')
            for (const i of relicShorthands) {
                var currentRelic = i.toLowerCase()
                var howmany, firstindex, fishedRelicName;

                if (currentRelic.length > 7) continue
                firstindex = currentRelic.match(/[a-zA-Z]/);
                
                if (firstindex == null) continue // checks if its smth like just lg1
                if (firstindex.index == 0) continue // checks if 6 in 6lg8 is missing
                howmany = currentRelic.slice(0, firstindex.index)
                fishedRelicName = currentRelic.slice(firstindex.index)
                if (validrelics.some(x => x.toLowerCase().indexOf(fishedRelicName.toLowerCase()) !== -1)) { content.push(i); continue }

                const verifiedRelic = checkForRelic(fishedRelicName)
                if (!verifiedRelic) continue

                const res = await getRelic(verifiedRelic)
                if (res == null) continue
                const filterReq = (type) => { return `${res[1].slice(1,7).filter(x => x == type).length}` }
                validrelics.push(i)
                soupedStrings.push({ count: howmany+'x', relic: verifiedRelic, ed: filterReq(types.ED), red: filterReq(types.RED), orange: filterReq(types.ORANGE)  })
            }

            return soupedStrings
        }

        function compareItems(a, b) {
            const totalA = a.ed + a.red + a.orange;
            const totalB = b.ed + b.red + b.orange;
          
            if (totalA > totalB) {
              return -1;
            } else if (totalA < totalB) {
              return 1;
            } else {
              return a.relic.localeCompare(b.relic);
            }
          }

        const msgfilter = message.content.toLowerCase().split(' ')
        const relics = msgfilter.slice(1).join('_')
        const soupedRelics = (await soupedType(relics)).sort(compareItems);

        const edonly = msgfilter[0].slice(6) == 'ed' ? true : false
        const relicFilter = (x) => {
            if (x.relic.indexOf('Axi') == -1) return;
            if (edonly) {
                if (x.ed != '0') return x;
                else return;
            } else return x;
        }
        const axisets = soupedRelics.filter(x => relicFilter(x))
        const neosets = soupedRelics.filter(x => relicFilter(x))
        const mesosets = soupedRelics.filter(x => relicFilter(x))
        const lithsets = soupedRelics.filter(x => relicFilter(x))
        const mapSet = (set) => {
            return set.map(x => `${x.count.padEnd(4)} | ${x.relic.padEnd(8)} | ${x.ed.padEnd(2)} ED | ${x.red.padEnd(2)} RED | ${x.orange.padEnd(2)} ORANGE |`)
        }
        const axirelics = axisets.length > 0 ? mapSet(axisets) : ''
        const neorelics = neosets.length > 0 ? mapSet(neosets) : ''
        const mesorelics = mesosets.length > 0 ? mapSet(mesosets) : ''
        const lithrelics = lithsets.length > 0 ? mapSet(lithsets) : ''
        
        const relicsFinal = [axirelics, neorelics, mesorelics, lithrelics]
        response.edit({ embeds: [
            new EmbedBuilder()
            .setTitle(`Soup formatted`)
            .setDescription(codeBlock('ml', relicsFinal.map(rl => rl != '' ? `${rl.join('\n')}\n\n` : '').join('')) + `\n\n*CODE: ${validrelics.join(' ')}*`)
        ], content: content.length == 0? null : `Duplicates found: ${content.join(' ')}` })
    }
}