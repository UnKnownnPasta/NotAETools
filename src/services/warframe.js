import { EmbedBuilder } from "discord.js";
import axios from "axios";

/**
 * Gets the next UTC time that a fissure gets created
 * @param {Array} fisTimes 
 * @returns {Array}
 */
function getFissureTimings(fisTimes) {
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const tierMap = new Map();

    fisTimes.forEach(([tier, expiryTime]) => {
        const farthestTime = tierMap.get(tier);
        
        if ((!farthestTime) || Math.abs(expiryTime - currentTime) > Math.abs(farthestTime - currentTime)) {
            tierMap.set(tier, expiryTime);
        }
    });

    const updatedTierMap = new Map();

    tierMap.forEach((farthestTime, tier) => {
        const farthestExpiryTime = farthestTime - 3 * 60;
        const farthestElement = fisTimes.find(([currentTier, expiryTime]) => {
            return currentTier === tier && Math.abs(expiryTime - farthestExpiryTime) <= 180 && expiryTime - currentTime > 0;
        });

        if (farthestElement) {
            updatedTierMap.set(tier, farthestExpiryTime);
        }
    });

    return updatedTierMap;
}


/**
 * Utility function to cycle and display current fissures
 * @param {Client} client 
 */
export async function refreshFissures(client) {
    try {
        let channel = client.channels.cache.get(fissureChannel);
        if (!channel) return console.warn('No fissure channel found, Is the channel ID wrong?')
        
        let messageToEdit = await channel.messages.fetch({ limit: 1 });
        if (
            messageToEdit.size == 0 ||
            messageToEdit?.first()?.author.id != client.user.id
        ) {
            messageToEdit = await channel.send({ content: "Updating fissures..." });
        } else {
            messageToEdit = messageToEdit.first();
        }

        const missions = ["Extermination", "Capture", "Sabotage", "Rescue"];
        const tiers = ["Lith", "Meso", "Neo", "Axi"]
        const fisres = (await axios.get("https://api.warframestat.us/pc/fissures")).data;

        const response = fisres.filter(({ tier, missionType, active, expired, isStorm }) =>
            !isStorm && missions.includes(missionType) && active && tiers.includes(tier) && !expired
        );

        const fissures = await response.map(({ tier, missionType, node, expiry, isHard }) => [
            titleCase(tier),
            `${missionType} - ${node} - Ends <t:${(new Date(expiry).getTime() / 1000) | 0}:R>\n`,
            isHard,
        ]);

        // --- Fissure Embeds ---
        const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, fissure) => {
            let currentEmbed = fissure[2] ? acc.S_Embed : acc.N_Embed;

            currentEmbed[fissure[0]]
            ? (currentEmbed[fissure[0]].value += fissure[1])
            : (currentEmbed[fissure[0]] = { name: fissure[0], value: fissure[1] });

            return acc;
            }, 
            { N_Embed: {}, S_Embed: {} }
        ));

        const embedSort = (embed) => Object.values(embed[1]).sort((a, b) => tiers.indexOf(a.name) - tiers.indexOf(b.name))

        const NormEmbed = new EmbedBuilder()
            .setAuthor({ name: "Regular Fissures", 
                iconURL: `https://cdn.discordapp.com/emojis/${parseEmoji("<:normalPath:1287248821461454910>").id}.png` })
            .setColor("#2c2c34")
            .setFields(embedSort(N_Embed));

        const SPEmbed = new EmbedBuilder()
            .setAuthor({ name: "Steel Path Fissures", 
                iconURL: `https://cdn.discordapp.com/emojis/${parseEmoji("<:steelPath:1287249765091905620>").id}.png` })
            .setFields(embedSort(S_Embed))
            .setColor("#2c2c34")
            .setTimestamp();

        if (NormEmbed.data.fields.length == 0) NormEmbed.setDescription(`No ideal fissures`);
        if (SPEmbed.data.fields.length == 0) SPEmbed.setDescription(`No ideal fissures`);

        // ------------- Getting next resets -------------
        
        const emojiObj = { 
            "Lith": "<:LithRelicIntact:1287249967475458078>", 
            "Meso": "<:MesoRelicIntact:1287250081380044801>", 
            "Neo": "<:NeoRelicIntact:1287250258765545502>", 
            "Axi": "<:AxiRelicIntact:1287250368299925524>" 
        }

        let timeArrOfObj = [];
        const fisTimes = getFissureTimings(
            fisres
                .filter(({ tier, isStorm, expired, active }) => tiers.includes(tier) && !isStorm && !expired && active)
                .map(({ isHard, tier, expiry }) => [
                    isHard + " " + tier, (new Date(expiry).getTime() / 1000) | 0
                ])
        );

        Array.from(fisTimes.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .forEach(([key, val]) => {
            timeArrOfObj.push({ era: key, time: `<t:${val}:R>` })
        });
        
        const allTimeObjs = Object.entries(timeArrOfObj.reduce((acc, { era, time }) => {
            const [ status, erra ] = era.split(' ')
            let currentEmbed = acc[`${erra}time`];

            if (!currentEmbed.norm && status == 'false') currentEmbed.norm = time;
            else if (!currentEmbed.sp && status == 'true') currentEmbed.sp = time;

            return acc;
        }, {
            Lithtime: { norm: undefined, sp: undefined },
            Mesotime: { norm: undefined, sp: undefined },
            Neotime: { norm: undefined, sp: undefined },
            Axitime: { norm: undefined, sp: undefined },
        }));

        const timeObjSort = (embed, type) => embed
            .sort((a, b) => tiers.indexOf(a[0].replace('time', '')) - tiers.indexOf(b[0].replace('time', '')))
            .map(c => `${emojiObj[c[0].replace('time', '')]} ${c[1][type] ?? '???'}`)

        const NextFissuresEmbed = new EmbedBuilder()
        .setColor("#b6a57f")
        .addFields(
            { name: "Regular", value: timeObjSort(allTimeObjs, 'norm').join("\n"), inline: true },
            { name: "Steel Path", value: timeObjSort(allTimeObjs, 'sp').join("\n"), inline: true }
        )
        .setFooter({ text: "Next Fissure Reset Timers / by era" })

        // ------------- Refreshing Embeds -------------

        await messageToEdit.edit({
            content: null,
            embeds: [NormEmbed, SPEmbed, NextFissuresEmbed],
        });
    } catch (error) {
        console.error(error, `[INTRVL] Failed to refresh fissures`);
    }
}