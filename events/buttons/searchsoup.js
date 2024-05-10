const {
    Client,
    EmbedBuilder,
    ButtonInteraction,
    codeBlock
} = require("discord.js");
const fs = require('node:fs/promises');
const path = require("node:path");
const { titleCase } = require("../../scripts/utility");

module.exports = { 
    name: "searchsoup",
    /**
     * Search parts in soup store
     * @param {Client} client 
     * @param {ButtonInteraction} i 
     */
    async execute(client, i) {
        const parttoFind = i.customId.split('-')[2]
        const findType = i.customId.split('-')[1]
        const soupStore = await JSON.parse(await fs.readFile(path.join(__dirname, '..', '..', 'data/SoupData.json')))

        switch (findType) {
            case 'part':
                const pHits = []
                let pCounts = 0
                for (const order of soupStore) {
                    const hasHit = []
                    for (const p of order.parts) {
                        if (p.has.includes(parttoFind)) {
                            hasHit.push(p.relic)
                        }
                    }
                    if (!hasHit.length) continue;
                    pCounts += hasHit.length
                    pHits.push({ link: order.link, name: order.name, type: order.type, relics: hasHit })
                }
        
                const pFoundAllEmbed = new EmbedBuilder()
                .setTitle(`Found ${pCounts} relics`)
                .setColor(`#C2B280`);
        
                if (pHits.length) {
                    pHits.slice(0, 10).map(x => {
                        pFoundAllEmbed.addFields(
                            { name: `By ${x.name} - ${titleCase(x.type)}`,
                            value: `Soup [Link](${x.link}) ; Inside ${x.relics.map(x => `__${x}__`).join(" | ")}` }
                        )
                    })
                }
        
                await i.reply({ embeds: [pFoundAllEmbed] })
                break;
        
            case 'set':
                const sHits = []
                let sCounts = 0
                for (const order of soupStore) {
                    const hasHit = []
                    for (const p of order.parts) {
                        if (p.has.some(x => x.startsWith(`${parttoFind} `))) {
                            hasHit.push(p.relic)
                        }
                    }
                    if (!hasHit.length) continue;
                    sCounts += hasHit.length
                    sHits.push({ link: order.link, name: order.name, type: order.type, relics: hasHit })
                }
        
                const sFoundAllEmbed = new EmbedBuilder()
                .setAuthor({ name: `Found ${sCounts} relics`, iconURL: i.member.displayAvatarURL() })
                .setColor(`#C2B280`);
        
                if (sHits.length) {
                    sHits.slice(0, 10).map(x => {
                        sFoundAllEmbed.addFields(
                            { name: `By ${x.name} - ${titleCase(x.type)}`,
                            value: `Soup [Link](${x.link}) ; Inside ${x.relics.map(x => `__${x}__`).join(" | ")}` }
                        )
                    })
                }
        
                await i.reply({ embeds: [sFoundAllEmbed] });
                break;

            default:
                break;
        }
    },
}