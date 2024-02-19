// const { spreadsheet } = require('../data/config.json')
const { EmbedBuilder, codeBlock, ButtonStyle } = require('discord.js');
const fs = require('node:fs')
const { Pagination } = require('pagination.djs');
const { filterRelic } = require('../data/scripts/utility.js');

module.exports = {
    name: 'anycmd',
    async execute(client, message, word, type, _) {
        const allrelics = (await JSON.parse(fs.readFileSync('./data/relicdata.json')))
        switch (type) {
            case 'status':
                let edlist = []
                allrelics.relicData.forEach(part => {
                    part.slice(1, 7).forEach(p => {
                        if (p.type == word.toUpperCase()) edlist.push(`${`[${p.count}]`.padEnd(3)} | ${p.name}`);
                    })
                });

                edlist = [... new Set(edlist)].sort((a, b) => a.split('|')[0].match(/\[(.+?)\]/)[1] - b.split('|')[0].match(/\[(.+?)\]/)[1])
                const embedOfParts = []
                for (let i=0; i < edlist.length; i+=15) {
                    embedOfParts.push(
                        new EmbedBuilder().setTitle(`[ ${word.toUpperCase()} ]`)
                        .setDescription(codeBlock('ml', edlist.slice(i, i+15).join('\n')))
                    )
                }

                const pagination = new Pagination(message, {
                    firstEmoji: '⏮',
                    prevEmoji: '◀️',
                    nextEmoji: '▶️',
                    lastEmoji: '⏭',
                    idle: 60000, 
                    buttonStyle: ButtonStyle.Secondary, 
                    loop: true 
                });
        
                pagination.setEmbeds(embedOfParts, (embed, index, array) => {
                    return embed.setFooter({ text: `Page ${index + 1}/${array.length}` });
                });
                pagination.render();
            break;
            
            case 'part':
                if (!allrelics.partNames.includes(word)) return;
                const scarcity = ['C', 'C', 'C', 'UC', 'UC', 'RA']
                let countOfPart;

                const relicList = allrelics.relicData.map(x => {
                    if (partNames[0].has.includes(word)) {
                        const item = partNames[0].has.indexOf(word) - 1
                        if (!countOfPart) countOfPart = x[item].count
                        return `${scarcity[item].padEnd(2)} | ${x[0].name} {${x[0].tokens}}`
                    }
                }).filter(x => x!=undefined)
                
                message.reply({ embeds: [
                    new EmbedBuilder().setTitle(`[ ${word} ] {x${countOfPart}}`)
                    .setDescription(codeBlock('ml', relicList.join('\n')))
                ] })
            break;

            case 'prime':
                const corrWord = word.replace('Prime', '').trim()
                let parts = []

                let getAllRelics = allrelics.relicData.map(x => {
                    if (x[0].has.some(n => n.indexOf(corrWord) !== -1)) {
                        let id = x[0].has.findIndex(x => x.includes(corrWord))
                        parts.push(x[id+1])
                        return x[0]
                    }
                }).filter(x => x!=undefined)

                parts = parts.map(x => `${x.count.padEnd(2)} | ${x.name}`)
                parts = [... new Set(parts)]

                const embds = [
                    new EmbedBuilder().setTitle(`[ ${word} ]`)
                    .setDescription(codeBlock('ml', parts.join('\n')))
                ]

                if (_.split(' ').includes('--r')) {
                    embds.push(
                        new EmbedBuilder()
                        .setDescription(codeBlock('ml', getAllRelics.map(x => `${x.tokens.padEnd(2)} | ${x.name}`).join('\n')))
                    )
                }
                
                message.reply({ embeds: [...embds] })
            break;

            case 'relic':
                let frelic = allrelics.relicData.filter(x => x[0].name == filterRelic(word.toLowerCase()))[0]
                const rarties = ['C', 'C', 'C', 'UC', 'UC', 'RA']
                let emstr = frelic.slice(1, 7).map((x, i) => `${rarties[i].padEnd(2)} | ${x.count.padEnd(2)} | ${x.name} ${x.type == ""? "" : `{${x.type}}`}`)
                message.reply({ embeds: [
                    new EmbedBuilder()
                    .setTitle(`[ ${frelic[0].name} ] {${frelic[0].tokens}}`)
                    .setDescription(codeBlock('ml', emstr.join('\n')))
                ] })
            break;
        }
    }
}