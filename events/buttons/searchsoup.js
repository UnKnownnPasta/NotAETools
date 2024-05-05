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
        const parttoFind = i.customId.split('-')[1]
        const soupStore = await JSON.parse(await fs.readFile(path.join(__dirname, '..', '..', 'data/SoupData.json')))

        const hits = []
        let counts = 0
        for (const order of soupStore) {
            const hasHit = []
            for (const p of order.parts) {
                if (p.has.includes(parttoFind)) {
                    hasHit.push(p.relic)
                }
            }
            if (!hasHit.length) continue;
            counts += hasHit.length
            hits.push({ link: order.link, name: order.name, type: order.type, relics: hasHit })
        }

        const foundAllEmbed = new EmbedBuilder()
        .setTitle(`Found ${counts} relics`)
        .setColor(`#C2B280`);

        if (hits.length) {
            hits.slice(0, 10).map(x => {
                foundAllEmbed.addFields(
                    { name: `By ${x.name} - ${titleCase(x.type)}`,
                    value: `Soup [Link](${x.link}) ; Inside ${x.relics.map(x => `__${x}__`).join(" | ")}` }
                )
            })
        }

        await i.reply({ embeds: [foundAllEmbed] })
    },
}