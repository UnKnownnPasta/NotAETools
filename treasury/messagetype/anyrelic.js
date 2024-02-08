const { Client, Message, codeBlock, EmbedBuilder } = require('discord.js')
const fs = require('node:fs')
const { checkForRelic } = require('../../data/utils')

const types = { 
    "#150b2e": "ED",
    "#3c0000": "RED",
    "#472502": "ORANGE",
    "#4b3800": "YELLOW",
    "#162e0b": "GREEN",
    "#282828": undefined
};

module.exports = {
    name: ['*'],
    /**
    * Accepts any ++relic
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message, word) {
        var finalRelic;
        var verifiedRelic = checkForRelic(word)
        if (!verifiedRelic) return;

        let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
        for (const relic of jsfile) {
            if (relic[0][0] == verifiedRelic) finalRelic = relic.map(x => [x[0], `${types[x[1]] ? `{${types[x[1]]}}` : ''}`])
        }

        const rarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
        if (finalRelic) {
            var descstring = ""
            for (var n = 1; n < 7; n++) {
                var bindex = finalRelic[n][0].indexOf('[') ?? -1
                descstring += `${rarities[n-1].padEnd(2)} | ${`${finalRelic[n][0].slice(bindex == -1 ? 100 : bindex+1, -1)}`.padEnd(2)} | ${finalRelic[n][0].slice(0, bindex == -1 ? 100 : bindex)}${finalRelic[n][1]}\n`
            }
            await message.reply({ embeds: [
                new EmbedBuilder()
                .setTitle(`[ ${finalRelic[0][0]} ] {${finalRelic[7][0]}}`)
                .setDescription(`${codeBlock('ml', descstring)}`) 
            ] })
        }
    }
}