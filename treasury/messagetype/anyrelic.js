const { Client, Message, codeBlock, EmbedBuilder } = require('discord.js')
const fs = require('node:fs')

module.exports = {
    name: ['*'],
    /**
    * Accepts any ++relic
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message, word) {
        var relicEra, relicType, relicShort, finalRelic;

        if (['meso', 'neo', 'axi', 'lith'].includes(word)) {
            relicEra = word[0].toLocaleUpperCase() + word.slice(1)
            relicType = message.content.split(' ')[1].toLocaleUpperCase() ?? 'a'
        } else {
            relicShort = word.slice(0, 1)
            if (!isNaN(word)) return;
            else if (relicShort[0] === 'a') relicEra = "Axi"
            else if (relicShort[0] === 'n') relicEra = "Neo"
            else if (relicShort[0] === 'm') relicEra = "Meso"
            else if (relicShort[0] === 'l') relicEra = "Lith"
            relicType = word.slice(1).toUpperCase()
        }

        let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
        for (const relic of jsfile) {
            if (relic[0][0] == `${relicEra} ${relicType}`) finalRelic = relic.map(x => x[0]), relic.map(x => x[1])
        }

        const rarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
        if (finalRelic) {
            var descstring = ""
            for (var n = 0; n < 6; n++) {
                var bindex = finalRelic[n+1].indexOf('[') ?? -1
                descstring += `${rarities[n].padEnd(2)} | ${`${finalRelic[n+1].slice(bindex == -1 ? 100 : bindex+1, -1)}`.padEnd(2)} | ${finalRelic[n+1].slice(0, bindex == -1 ? 100 : bindex)}\n`
            }
            await message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${finalRelic[0]} ] {${finalRelic[7]}}`)
                .setDescription(`${codeBlock('ml', descstring)}`) ] })
        }
    }
}