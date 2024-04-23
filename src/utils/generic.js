const path = require('node:path');
const { Collection } = require('discord.js');
const fsp = require('node:fs/promises');
// const database = require('../database/init.js');

/**
 * Load all files from a folder and stores them in a map.
 * @returns {Collection}
 */
async function loadFiles(dirpath, condition = null) {
    const clientCollection = new Collection();
    const commandsPath = path.join(__dirname, '..', dirpath);
    const files = await fsp.readdir(commandsPath)
    let commandFiles;
    if (condition != null) {
        commandFiles = files.filter(file => file.endsWith('.js') && condition(file));
    } else {
        commandFiles = files.filter(file => file.endsWith('.js'));
    }

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('execute' in command) {
            clientCollection.set(command.name, command)
        } else {
            console.log(`The command at ${filePath} is missing a required 'execute' property.`);
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
 * @returns {String}
 */
function titleCase(str) {
    const words = str.split(' ');

    for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase() === 'bp' || words[i].toLowerCase() === 'blueprint') {
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
 * @returns {String}
 */
function filterRelic(relic) {
    let relicEra, relicType;
    if (['meso', 'neo', 'axi', 'lith'].some(x => relic.indexOf(x) !== -1)) {
        return `${relic[0].toUpperCase()}${relic.slice(1, relic.split(' ')[0].length).toLowerCase()} ${relic.slice(relic.split(' ')[0].length + 1).toUpperCase()}`
    } else {
        if (!isNaN(relic)) return null;
        else if (relic[0] === 'a') relicEra = 'Axi'
        else if (relic[0] === 'n') relicEra = 'Neo'
        else if (relic[0] === 'm') relicEra = 'Meso'
        else if (relic[0] === 'l') relicEra = 'Lith'
        else return null;
        relicType = relic.slice(1).toUpperCase();
        if (relicType === '') return null;
        return `${relicEra} ${relicType}`
    }
}

const range = (num) => {
    return num >= 0 && num <= 7
        ? 'ED'
        : num > 7 && num <= 15
            ? 'RED'
            : num > 15 && num <= 31
                ? 'ORANGE'
                : num > 31 && num <= 64
                    ? 'YELLOW'
                    : 'GREEN'
}

module.exports = { loadFiles, titleCase, filterRelic, stockRanges: range }
