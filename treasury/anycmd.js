// const { spreadsheet } = require('../data/config.json')
const { EmbedBuilder, codeBlock, ButtonStyle } = require('discord.js');
const fs = require('node:fs')
const { Pagination } = require('pagination.djs');
const { titleCase } = require('../data/utility');

module.exports = {
    name: 'anycmd',
    async execute(client, message, word, type, _) {
        const allrelics = (await JSON.parse(fs.readFileSync('./data/relicdata.json')))
        switch (type) {
            case 'status':
                let edlist = []
                allrelics.relicData.forEach(part => {
                    part.slice(1, 7).forEach(p => {
                        if (p.type == word.toUpperCase()) edlist.push(`${p.count.padEnd(3)} | ${p.name}`);
                    })
                });

                edlist = [... new Set(edlist)].sort((a, b) => a.split('|')[0].trim() - b.split('|')[0].trim())
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
                    return embed.setFooter({ text: `${index + 1}/${array.length}` });
                });
                pagination.render();
            break;
            
            case 'part':
                if (!allrelics.partNames.includes(word)) return;
                const scarcity = ['C', 'C', 'C', 'UC', 'UC', 'RA']
                let countOfPart;

                const relicList = allrelics.relicData.map(x => {
                    let partNames = x.map(y => y.name)
                    if (partNames.includes(word)) {
                        const item = partNames.indexOf(word) - 1
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
                    let nnames = x.map(y => y.name)
                    if (nnames.some(n => n.indexOf(corrWord) !== -1)) {
                        let id = nnames.indexOf(nnames.filter(x => x.indexOf(corrWord) != -1)[0])
                        parts.push(x[id])
                        return x[0]
                    }
                }).filter(x => x!=undefined)

                parts = parts.map(x => { return `${x.count.padEnd(2)} | ${x.name}` })
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
        }
    }
}