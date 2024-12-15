const { Collection, EmbedBuilder, Client, parseEmoji } = require("discord.js");
const path = require('node:path')
const fs = require('node:fs/promises');
const { fissureChannel } = require('../data/config.json')
const axios = require('axios');
const logger = require("./logger");

/**
 * Load all files from a folder and stores them in a map.
 * @param {String} dirpath 
 * @returns Collection
 */
async function loadFiles(dirpath) {
    let clientCollection = new Collection();
    const commandsPath = path.join(__dirname, '..', dirpath);
    const files = await fs.readdir(commandsPath)
    const commandFiles = files.filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('execute' in command) {
            clientCollection.set(command.name, command)
        } else {
            logger.info(`The command at ${filePath} is missing a required "execute" property.`);
        }
    }
    return clientCollection;
}

/**
 * Convert a given string into title case
 * @example
 * titleCase('glaive prime') => 'Glaive Prime'
 * titleCase('baRUUk bp') => 'Baruuk BP'
 * @param {String} str 
 * @returns String
 */
function titleCase(str) {
    const words = str.split(' ');

    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase() == 'bp' || words[i].toLowerCase() == 'blueprint') {
        words[i] = 'Blueprint';
        continue;
      }
      if (words[i].toLowerCase().startsWith('neuroptic')) {
        words[i] = 'Neuro';
        continue;
      }
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
    return words.join(' ');
}

/**
 * Returns full relic name formatted string
 * 
 * Returns **null** for invalid relics
 * @example
 * filterRelic('lith g1') => 'Lith G1'
 * filterRelic('mp14') => 'Meso P14'
 * @param {String} relic 
 * @returns String
 */
function filterRelic(relic) {
    let relicEra, relicType;
    if (['meso', 'neo', 'axi', 'lith'].some(x => relic.toLowerCase().indexOf(x) !== -1)) {
        const [er, typ] = relic.toLowerCase().split(/\s+/g)
        return titleCase(er) + " " + typ.toUpperCase()
    } else {
        if (!isNaN(relic)) return null;
        else if (relic[0] === 'a') relicEra = "Axi"
        else if (relic[0] === 'n') relicEra = "Neo"
        else if (relic[0] === 'm') relicEra = "Meso"
        else if (relic[0] === 'l') relicEra = "Lith"
        else return null;
        relicType = relic.slice(1).toUpperCase();
        if (relicType == '') return null;
        return `${relicEra} ${relicType}`
    }
}

/**
 * Checks if given relic is a true relic name.
 * @param {String} relic 
 * @returns Boolean
 */
async function relicExists(relic) {
    const relicList = (await JSON.parse(await fs.readFile(path.join(__dirname, '..', 'data', 'RelicData.json')))).relicNames
    return relicList.includes(relic)
}

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
async function refreshFissures(client) {
    try {
        let channel = client.channels.cache.get(fissureChannel);
        if (!channel) return logger.warn('No fissure channel found, Is the channel ID wrong?')
        
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
        const tiers = ["Lith", "Meso", "Neo", "Axi"];

        const { WorldState } = await import('warframe-worldstate-parser');
        const worldstateData = await fetch('https://content.warframe.com/dynamic/worldState.php').then((data) => data.text());
        const { fissures: fisres } = new WorldState(worldstateData);

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
            .setFooter({ text: `Last updated` })
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
        logger.error(error, `[INTRVL] Failed to refresh fissures`);
    }
}

module.exports = { loadFiles, titleCase, filterRelic, relicExists, refreshFissures }