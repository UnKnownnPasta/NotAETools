const path = require('node:path');
const { Collection } = require('discord.js');
const fsp = require('node:fs/promises');
const logger = require('./logger');
const database = require('../database/init.js');

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
        if (!command) logger.warn(`Command at ${filePath} has no data in its files`)
        if ('execute' in command) {
            clientCollection.set(command.name, command)
        } else {
            logger.info(`The command at ${filePath} is missing a required 'execute' property.`);
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
        if (words[i].toLowerCase() === 'bp') {
            words[i] = 'Blueprint';
            continue;
        }
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
    return words.join(' ');
}

const erasFull = { 'l': 'Lith', 'm': 'Meso', 'n': 'Neo', 'a': 'Axi' }

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
function filterRelic(relic_check) {
    const relic = relic_check.toLowerCase()
    let relicEra, relicType;
    if (['meso', 'neo', 'axi', 'lith'].some(x => relic.startsWith(x))) {
        [relicEra, relicType] = titleCase(relic).split(" ")
    } else {
        relicEra = erasFull[relic[0]]
        relicType = relic.slice(1).toUpperCase()
    }

    if (!relicEra || !relicType) return undefined;
    return `${relicEra} ${relicType}`
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

const codeObj = {
    ED: 0,
    RED: 1,
    ORANGE: 2,
    YELLOW: 3,
    GREEN: 4,
}

const uncodeObj = {
    0: "ED",
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN"
}

const hex = {
    ED: "#351c75",
    RED: "#990000",
    ORANGE: "#b45f06",
    YELLOW: "#bf9000",
    GREEN: "#38761d",
}

const stockRanges = {
    ED: "0 - 7",
    RED: "8 - 15",
    ORANGE: "16 - 31",
    YELLOW: "32 - 64",
    GREEN: "64 - inf",
}

/**
 * Checks if given relic is a true relic name.
 * @param {String} relic 
 * @returns {Boolean}
 */
async function relicExists(relic) {
    const wasfound = await database.models.Relics.findOne({ where: { relic: relic } });
    return wasfound ?? false
}

const rarities = ['C ', 'C ', 'C ', 'UC', 'UC', 'RA']

module.exports = { loadFiles, titleCase, filterRelic, range, codeObj, uncodeObj, hex, stockRanges, relicExists, rarities }
