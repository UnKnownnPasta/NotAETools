const { Client, Message, EmbedBuilder, ButtonStyle } = require('discord.js')
const fs = require('node:fs')
const { Pagination } = require('pagination.djs');

const types = { 
    'ED': "#0d071e",
    'RED': "#3c0000",
    'ORANGE': "#472502",
    'YELLOW': "#4b3800",
    'GREEN': "#162e0b"
}

module.exports = {
    name: ['ed', 'red', 'yellow', 'orange', 'green'],
    /**
    * Get parts filtered by part status(es)
    * @param {Client} client
    * @param {Message} message
    */
    async execute(client, message) {
        const filterType = message.content.split(' ')[0].slice(2).toLocaleUpperCase()
        const relicsList = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
        let hits = relicsList.filter(x => x.map(n => n[1]).includes(types[filterType]))
        let allParts = []
        hits.forEach(e => {
            e.filter(n => n[1] == types[filterType] && !/Meso|Neo|Axi|Lith/.test(n[0])).forEach(h => allParts.push(h[0]))
        });
        function spaceText(text, spaceAmt, increment) {
            var spaces = new Array(spaceAmt).fill(" ");
            for (var i = increment; i < spaces.length; i++) {
                spaces[i] = text[i - increment] ?? " ";
            }
            return spaces.join("");
        }

        allParts = [...new Set(allParts)]
        const refluxedParts = allParts.sort((a, b) => a.slice(a.indexOf('[') + 1, -1) - b.slice(b.indexOf('[') + 1, -1))
        const embedsOfParts = []

        for (var i = 0; i <= allParts.length; i+=15) {
            embedsOfParts.push(new EmbedBuilder()
            .setDescription(`
\`\`\`ml
${refluxedParts.slice(i, i+15).map(x => `${spaceText(x.slice(x.indexOf('[')), 5, 1)} | ${x.slice(0, x.indexOf('['))}`).join('\n')}
\`\`\``))
        }

        const pagination = new Pagination(message, {
            firstEmoji: '⏮', // First button emoji
            prevEmoji: '◀️', // Previous button emoji
            nextEmoji: '▶️', // Next button emoji
            lastEmoji: '⏭', // Last button emoji
            idle: 60000, // idle time in ms before the pagination closes
            buttonStyle: ButtonStyle.Secondary, // button style
            loop: true // loop through the pages
        });

        pagination.setEmbeds(embedsOfParts, (embed, index, array) => {
            return embed.setTitle(`[ ${filterType} ] ${index + 1}/${array.length}`);
        });
        pagination.render();
    }
}