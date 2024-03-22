const axios = require('axios')
const { Client, EmbedBuilder } = require('discord.js')
const logger = require('../handler/bLog.js')

/**
 * Gets the next UTC time that a fissure gets created
 * @param {Array} fisTimes 
 * @returns {Map}
 */
function getFissureTimings(fisTimes) {
    const currentTime = Math.floor(new Date().getTime() / 1000);

    const tierMap = new Map();

    fisTimes.forEach(([tier, expiryTime]) => {
        const currentDiff = Math.abs(expiryTime - currentTime);
        const closestTime = tierMap.get(tier);

        if (!closestTime || currentDiff < Math.abs(closestTime - currentTime)) {
            tierMap.set(tier, expiryTime);
        }
    });

    const updatedTierMap = new Map();

    tierMap.forEach((closestTime, tier) => {
        const closestExpiryTime = closestTime - 3 * 60;
        const closestElement = fisTimes.find(([currentTier, expiryTime]) => {
            return currentTier === tier && Math.abs(expiryTime - closestExpiryTime) <= 180;
        });

        if (closestElement) {
            updatedTierMap.set(tier, closestExpiryTime);
        }
    });

    return updatedTierMap;
}

/**
 * Utility function to cycle and display current fissures
 * @param {Client} client 
 */
async function refreshFissures(client) {
    try {
        let channel = client.channels.cache.get(fissureChannel);
        if (!channel) return alert('No fissure channel found, Is the channel ID wrong?')
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
        const fisres = (await axios.get("https://api.warframestat.us/pc/fissures")).data;
        const response = fisres.filter(
            (f) =>
                !f["isStorm"] &&
                missions.includes(f["missionType"]) &&
                f["active"] &&
                f["tier"] != "Requiem"
        );

        const fissures = await response.map((fis) => [
            titleCase(fis["tier"]), 
            `${fis["missionType"]} - ${fis["node"]} - Ends <t:${(new Date(fis["expiry"]).getTime() / 1000) | 0}:R>\n`,
            fis["isHard"],
        ]);
        const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, fissure) => {
            let currentEmbed = fissure[2] ? acc.S_Embed : acc.N_Embed;

            currentEmbed[fissure[0]]
            ? (currentEmbed[fissure[0]].value += fissure[1])
            : (currentEmbed[fissure[0]] = { name: fissure[0], value: fissure[1] });

            return acc;
            }, 
            { N_Embed: {}, S_Embed: {} }
        ));

        const NormEmbed = new EmbedBuilder()
            .setTitle("Normal Fissures")
            .setColor("#2c2c34")
            .setFields(Object.values(N_Embed[1]).sort((a, b) => b.name.localeCompare(a.name)));
        const SPEmbed = new EmbedBuilder()
            .setTitle("Steel Path Fissures")
            .setFields(Object.values(S_Embed[1]).sort((a, b) => b.name.localeCompare(a.name)))
            .setColor("#2c2c34")
            .setTimestamp();
        const TimeEmbed = new EmbedBuilder()
            .setColor("#b6a57f");
        let timeDesc = "Next Fissure Reset:\n";

        const fisTimes = getFissureTimings(
            fisres
                .filter((x) => x["tier"] != "Requiem" && x["active"] && !x['isStorm'])
                .map((x) => [
                    x["tier"],
                    (new Date(x["expiry"]).getTime() / 1000) | 0,
                ])
        );

        Array.from(fisTimes.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .forEach(([key, val], index) => {
            timeDesc += `\`${titleCase(key).padEnd(4)}\` <t:${val}:R>\n`;
        });
        TimeEmbed.setDescription(timeDesc);

        await messageToEdit.edit({
            content: null,
            embeds: [NormEmbed, SPEmbed, TimeEmbed],
        });
    } catch (error) {
        logger.error("Failed to refresh fissures");
    }
}

module.exports = { refreshFissures }