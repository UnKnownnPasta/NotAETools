const {
    Client,
    EmbedBuilder,
    ButtonInteraction,
    codeBlock
} = require("discord.js");
const fs = require('node:fs/promises');
const path = require("node:path");
const { titleCase } = require("../../scripts/utility");
const { retrieveSoupStoreRelics } = require("../../scripts/dbcreate");

module.exports = { 
    name: "searchsoup",
    /**
     * Search parts in soup store
     * @param {Client} client 
     * @param {ButtonInteraction} i 
     */
    async execute(client, i) {
        await i.deferReply()
        const parttoFind = i.customId.split('-')[2]
        const findType = i.customId.split('-')[1]
        const soupStore = await retrieveSoupStoreRelics(client)

        switch (findType) {
            case 'part':
                const pHits = []
                let pCounts = 0
                for (const order of soupStore) {
                    const hasHit = []
                    for (const p of order.parts) {
                        if (p.has.includes(parttoFind)) {
                            hasHit.push(`${p.howmany}x ${p.relic}`)
                        }
                    }
                    if (!hasHit.length) continue;
                    pCounts += hasHit.length
                    pHits.push({ link: order.link, name: order.name, type: order.type, relics: hasHit })
                }
        
                const pFoundAllEmbed = new EmbedBuilder()
                .setAuthor({ name: `Found ${pCounts} relics`, iconURL: i.user.displayAvatarURL() })
                .setColor(`#C2B280`);
        
                if (pHits.length) {
                    pHits.slice(0, 10).map(x => {
                        pFoundAllEmbed.addFields(
                            { name: `By ${x.name} - ${titleCase(x.type)}`,
                            value: `Soup [Link](${x.link}) ; Inside ${x.relics.map(x => `__${x}__`).join(" | ")}` }
                        )
                    })
                }
        
                await i.editReply({ embeds: [pFoundAllEmbed] })
                break;
        
            case 'set':
                const sHits = []
                let sCounts = 0
                for (const order of soupStore) {
                    const hasHit = []
                    for (const p of order.parts) {
                        if (p.has.some(x => x.startsWith(`${parttoFind} `))) {
                            hasHit.push(`${p.howmany}x ${p.relic}`)
                        }
                    }
                    if (!hasHit.length) continue;
                    sCounts += hasHit.length
                    sHits.push({ link: order.link, name: order.name, type: order.type, relics: hasHit })
                }
        
                const sFoundAllEmbed = new EmbedBuilder()
                .setAuthor({ name: `Found ${sCounts} relics`, iconURL: i.user.displayAvatarURL() })
                .setColor(`#C2B280`);
        
                if (sHits.length) {
                    sHits.slice(0, 10).map(x => {
                        sFoundAllEmbed.addFields(
                            { name: `By ${x.name} - ${titleCase(x.type)}`,
                            value: `Soup [Link](${x.link}) ; Inside ${x.relics.map(x => `__${x}__`).join(" | ")}` }
                        )
                    })
                }
        
                await i.editReply({ embeds: [sFoundAllEmbed] });
                break;

            case 'relic':
                const rHits = []
                let rCounts = 0
                for (const order of soupStore) {
                    const hasHit = []
                    for (const p of order.parts) {
                        if (p.relic === parttoFind) {
                            hasHit.push(p.howmany)
                        }
                    }
                    if (!hasHit.length) continue;
                    rCounts += hasHit.length
                    rHits.push({ link: order.link, name: order.name, type: order.type, howmany: hasHit.reduce((a, c) => a += c, 0) })
                }

                const rFoundAllEmbed = new EmbedBuilder()
                .setAuthor({ name: `Found ${rCounts} relics`, iconURL: i.user.displayAvatarURL() })
                .setColor(`#C2B280`);
        
                const descRelics = []

                if (rHits.length) {
                    rHits.slice(0, 10).map(x => {
                        descRelics.push(`⇒ By __${x.name}__ - Soup [Link](${x.link}) - ${x.howmany}x ${x.type}`)
                    })
                }

                if (descRelics.length) rFoundAllEmbed.setDescription(descRelics.join("\n"))

                await i.editReply({ embeds: [rFoundAllEmbed] });
                break;

            default:
                break;
        }
    },
}