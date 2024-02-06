const { Client, Message, EmbedBuilder } = require('discord.js')
const fs = require('node:fs')
const { err } = require('../../functions/utils')

module.exports = {
    name: 'soup',
    /**
    * Soup formats given relic codes
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {
        const response = await message.channel.send({ content: `Preparing..` })
        async function getAllItems() {
            try {
                const res = fs.readFileSync(`./commands/vrc/${jsonDBPath}`, 'utf-8')
                const json_res = await JSON.parse(res)
                return json_res;
            } catch (error) {
                err(error, `Failed to Fetch items from DB for soup`)
            }
        }
        const itemArray = [...await getAllItems()].filter(x => x.item_name.indexOf(' Relic') !== -1)
        const relicArray = itemArray.map(x => x.item_name.replace(' Relic', ''))

        async function findRelic(name) {
            const idex = relicArray[relicArray.indexOf(`${name}`)]
            return idex === -1 ? null : idex
        }

        function spaceText(text, spaceAmt, increment) {
            var spaces = new Array(spaceAmt).fill(" ");
            for (var i = increment; i < spaces.length; i++) {
                spaces[i] = text[i - increment] ?? " ";
            }
            return spaces.join("");
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
                if (isNaN(howmany)) continue
                else if (!isNaN(currentRelic)) continue
                else if (currentEra[0] === 'a') era = "Axi"
                else if (currentEra[0] === 'n') era = "Neo"
                else if (currentEra[0] === 'm') era = "Meso"
                else if (currentEra[0] === 'l') era = "Lith"
                type = currentRelic.slice(firstindex + 1).toUpperCase()

                const res = await findRelic(`${era} ${type}`)
                if (res == null) continue
                soupedStrings.push(`${spaceText(howmany + "x", 5, 1)}| ${spaceText(`${era} ${type}`, 9, 0)}| n ED | n RED | n ORANGE |`)
            }

            return [soupedStrings, soups]
        }

        const msgfilter = message.content.toLowerCase().split(' ')
        const relics = msgfilter.splice(msgfilter.indexOf('soup')+1).join('_')
        const soupedRelics = (await soupedType(relics))
        const axirelics = soupedRelics[0].filter(x => x.indexOf(`Axi`) !== -1)
        const neorelics = soupedRelics[0].filter(x => x.indexOf(`Neo`) !== -1)
        const mesorelics = soupedRelics[0].filter(x => x.indexOf(`Meso`) !== -1)
        const lithrelics = soupedRelics[0].filter(x => x.indexOf(`Lith`) !== -1)
        response.edit({ embeds: [
            new EmbedBuilder()
            .setTitle(`Soup formatted`)
            .setDescription(`
\`\`\`ml
${axirelics.join('\n')}

${neorelics.join('\n')}

${mesorelics.join('\n')}

${lithrelics.join('\n')}
\`\`\`

*CODE: ${soupedRelics[1].join(' ')}*`
)
        ], content: null })
    }
}