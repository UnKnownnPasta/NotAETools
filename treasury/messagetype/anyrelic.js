const { Client, Message, codeBlock, EmbedBuilder } = require('discord.js')
const fs = require('node:fs')
const { checkForRelic, titleCase } = require('../../data/utils')

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
    async execute(client, message) {
        var finalRelic = [],
            itemName = message.content.slice(2).split(' ').filter(x => x!='r').join(' '),
            primed = false;
        if (itemName.toLowerCase().indexOf('prime') !== -1) { itemName = itemName.toLowerCase().split(' ').filter(x => x.trim()!='prime').join(' '); primed=true }
        var verifiedRelic = checkForRelic(itemName.toLowerCase())
        if (!verifiedRelic) return;

        let detectedType = ""
        const rarities = ['C', 'C', 'C', 'UC', 'UC', 'RA']
        let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
        let amt;

        for (const relic of jsfile) {
            let itemCheckPart = relic.map(x => x[0].slice(0, x[0].indexOf('[')-1))
            
            if (relic[0][0] == verifiedRelic) {
                finalRelic = relic.map(x => [x[0], `${types[x[1]] ? `{${types[x[1]]}}` : ''}`])
                detectedType = "relic"
            } else if (itemCheckPart.includes(titleCase(itemName))) {
                const ind = itemCheckPart.indexOf(titleCase(itemName))
                finalRelic.push([rarities[ind - 1], `${relic[0][0]} {${relic[7][0]}}`])
                amt = relic[ind][0].slice(relic[ind][0].indexOf('[')+1, -1)
                detectedType = 'part'
            } else if (primed) {
                if (itemCheckPart.some(x => x.indexOf(titleCase(itemName)) !== -1)) {
                    finalRelic.push(relic)
                    detectedType = 'set'
                }
            }
        }

        switch (detectedType) {
            case 'relic':
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
            break;
            case 'part':
                if (finalRelic) {
                    var descstring = ""
                    for (const part of finalRelic) {
                        descstring += `${`${part[0]}`.padEnd(2)} | ${part[1]}\n`
                    }
                    await message.reply({ embeds: [
                        new EmbedBuilder()
                        .setTitle(`[ ${titleCase(message.content.slice(2))} ] {x${amt}}`)
                        .setDescription(`${codeBlock('ml', descstring)}`) 
                    ] });
                }
            break;
            case 'set':
                let itemsOnly = finalRelic.slice(1, -1).map(x => {
                    const name = x.map(y => [y[0].slice(0, y[0].indexOf('[')-1), y[0].slice(y[0].indexOf('[')+1, -1), y[1]])
                    return name.filter(x => x[0].indexOf(titleCase(itemName)) != -1)[0]
                })
                let relicsOnly = finalRelic.map(x => [x[0][0], x[7][0]])
                itemsOnly = [... new Set(itemsOnly.map(x => `${x[1].padEnd(2)} | ${x[0]} {${types[x[2]]}}`))]
                relicsOnly = relicsOnly.map(x => `${`{${x[1]}}`.padEnd(4)} | ${x[0]}`)

                const embedList = [
                    new EmbedBuilder()
                    .setTitle(`[ ${titleCase(itemName)} Set ]`)
                    .setDescription(codeBlock('ml', itemsOnly.join('\n')))
                ];
                
                if (message.content.toLowerCase().split(' ').includes('r')) 
                    embedList.push(
                    new EmbedBuilder()
                    .setTitle(`[ ${titleCase(itemName)} Relics ]`)
                    .setDescription(codeBlock('ml', relicsOnly.join('\n')))
                );
                
                await message.reply({ embeds: [...embedList] })
            break;
        }        
    }
}