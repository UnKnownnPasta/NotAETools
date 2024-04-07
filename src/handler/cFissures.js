const axios = require('axios')
const { Client, EmbedBuilder } = require('discord.js')
const logger = require('../utility/bLog.js')
const { titleCase } = require('../utility/bHelper.js')
class FissureManager {
    /**
     * A Manager for Latest Fissures from Warframe
     * @param {Client} dscclient
     */
    constructor(dscclient) {
        this.channelID = "1214489298787762196"
        this.latestFissures = []
        this.cycles = 0
        this.client = dscclient

        logger.info("Fissure/manager: Instance was called, starting fissures.")
    }

    getLatestFissures() {
        if (!this.latestFissures.length) return null;
        return this.latestFissures;
    }

    async updateFissure() {
        try {
            let channel = this.client.channels.cache.get(this.channelID);
            if (!channel) return logger.warn('Fissure/manger: No fissure channel found, Is the channel ID wrong?')
            
            let messageToEdit = await channel.messages.fetch({ limit: 1 });
            if (
                messageToEdit.size == 0 ||
                messageToEdit?.first()?.author.id != this.client.user.id
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
    
            const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, [tier, missionText, SteelPath]) => {
                let currentEmbed = SteelPath ? acc.S_Embed : acc.N_Embed;
    
                currentEmbed[tier]
                ? (currentEmbed[tier].value += missionText)
                : (currentEmbed[tier] = { name: tier, value: missionText });
    
                return acc;
                }, 
                { N_Embed: {}, S_Embed: {} }
            ));
    
            const NormEmbed = new EmbedBuilder()
                .setTitle("Normal Fissures")
                .setColor("#2c2c34")
                .setFields(Object.values(N_Embed[1]).sort((a, b) => tiers.indexOf(a.name) - tiers.indexOf(b.name)));
    
            const SPEmbed = new EmbedBuilder()
                .setTitle("Steel Path Fissures")
                .setFields(Object.values(S_Embed[1]).sort((a, b) => tiers.indexOf(a.name) - tiers.indexOf(b.name)))
                .setColor("#2c2c34")
                .setTimestamp();
    
            const TimeEmbed = new EmbedBuilder()
                .setTitle("Next fissure resets:")
                .setColor("#b6a57f");
    
            this.latestFissures.length = 0;
            if (NormEmbed.data.fields.length == 0) {
                NormEmbed.setDescription(`No ideal fissures`);
            } else {
                this.latestFissures.push(...NormEmbed.data.fields)
            }
            if (SPEmbed.data.fields.length == 0) {
                SPEmbed.setDescription(`No ideal fissures`);
            } else {
                this.latestFissures.push(...SPEmbed.data.fields)
            }
    
            let timeArrOfObj = [];
            const fisTimes = this._getFissureTimings(
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
            
            const allDesc = Object.entries(timeArrOfObj.reduce((acc, { era, time }) => {
                const [ status, erra ] = era.split(' ')
                let currentEmbed = acc[`${erra}desc`];
    
                if (!currentEmbed.norm && status == 'false') currentEmbed.norm = time;
                else if (!currentEmbed.sp && status == 'true') currentEmbed.sp = time;
    
                return acc;
            }, {
                Lithdesc: { norm: undefined, sp: undefined },
                Mesodesc: { norm: undefined, sp: undefined },
                Neodesc: { norm: undefined, sp: undefined },
                Axidesc: { norm: undefined, sp: undefined },
            }));
    
            const timeDesc = allDesc
                .sort((a, b) => tiers.indexOf(a[0].replace('desc', '')) - tiers.indexOf(b[0].replace('desc', '')))
                .map(x => {
                    return `\`${`${x[0].replace('desc', '')}`.padEnd(4)}\` - Normal: ${x[1].norm ?? 'in ???'} SP: ${x[1].sp ?? 'in ???'}`
            })
    
            TimeEmbed.setDescription(timeDesc.join('\n'));
    
            await messageToEdit.edit({
                content: null,
                embeds: [NormEmbed, SPEmbed, TimeEmbed],
            });
            
            this.cycles++
        } catch (error) {
            logger.error(error, "Fissure/manager: [Error]: Failed to refresh fissures");
        }
    }
    
    /**
     * Gets the next UTC time that a fissure gets created
     * @param {Array} fisTimes 
     * @returns {Array}
     */
    _getFissureTimings(fisTimes) {
        const currentTime = Math.floor(new Date().getTime() / 1000);
    
        const tierMap = new Map();
    
        fisTimes.forEach(([tier, expiryTime]) => {
            const currentDiff = Math.abs(expiryTime - currentTime);
            const closestTime = tierMap.get(tier);
            
            if ((!closestTime) || currentDiff < Math.abs(closestTime - currentTime)) {
                tierMap.set(tier, expiryTime);
            }
        });
    
        const updatedTierMap = new Map();
    
        tierMap.forEach((closestTime, tier) => {
            const closestExpiryTime = closestTime - 3 * 60;
            const closestElement = fisTimes.find(([currentTier, expiryTime]) => {
                return currentTier === tier && Math.abs(expiryTime - closestExpiryTime) <= 180 && expiryTime - currentTime > 0;
            });
    
            if (closestElement) {
                updatedTierMap.set(tier, closestExpiryTime);
            }
        });
    
        return updatedTierMap;
    }
}

module.exports = FissureManager;