const { Collection, EmbedBuilder, Client } = require("discord.js");
const path = require('node:path')
const fs = require('node:fs/promises');
const chalk = require("chalk");
const { fissureChannel } = require('../data/config.json')
const axios = require('axios')

/**
 * Logs as [txt] msg
 * 
 * err
 */
const warn = (txt, msg, err) => { 
    console.log(chalk.red(`[${txt}]`), `${msg}`);
    console.error(err);
 }
const alert = (alerttxt) => { console.log(chalk.bgRedBright(chalk.black(`[WARNING]`)), `${alerttxt}`); }
const info = (type, txt) => { console.log(chalk.bgBlackBright(chalk.black(`[${type}]`)), `${txt}`); }

/**
 * Load all files from a folder and stores them in a map.
 * @param {String} dirpath 
 * @returns Collection
 */
async function loadFiles(dirpath) {
    let clientCollection = new Collection();
    const commandsPath = path.join(process.cwd(), dirpath);
    const files = await fs.readdir(commandsPath)
    const commandFiles = files.filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('execute' in command) {
            clientCollection.set(command.name, command)
        } else {
            alert(`The command at ${filePath} is missing a required "execute" property.`);
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
      if (words[i].toLowerCase() == 'bp') {
        words[i] = 'BP';
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
    if (['meso', 'neo', 'axi', 'lith'].some(x => relic.indexOf(x) !== -1)) {
        return `${relic[0].toUpperCase()}${relic.slice(1, relic.split(' ')[0].length).toLowerCase()} ${relic.slice(relic.split(' ')[0].length+1).toUpperCase()}`
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
    const relicList = (await JSON.parse(await fs.readFile('./data/relicdata.json'))).relicNames
    return relicList.includes(relic)
}

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
                .filter((x) => x["tier"] != "Requiem" && x["active"])
                .map((x) => [
                    x["tier"],
                    (new Date(x["expiry"]).getTime() / 1000) | 0,
                ])
        );

        Array.from(fisTimes.entries()).forEach(([key, val], index) => {
            timeDesc += `\`${titleCase(key).padEnd(4)}\` <t:${val}:R>\n`;
        });
        TimeEmbed.setDescription(timeDesc);

        await messageToEdit.edit({
            content: null,
            embeds: [NormEmbed, SPEmbed, TimeEmbed],
        });
    } catch (error) {
        warn("INTRLV", "Failed to refresh fissures", error);
    }
}

module.exports = { warn, alert, info, loadFiles, titleCase, filterRelic, relicExists, refreshFissures }