import db from "../handlers/db.js";

/**
 * Convert a given string into title case
 * @example
 * titleCase('glaive prime') => 'Glaive Prime'
 * titleCase('baRUUk bp') => 'Baruuk BP'
 * @param {String} str
 * @returns {String}
 */
export function titleCase(str) {
    const words = str.split(' ');

    for (let i = 0; i < words.length; i++) {
        if (words[i].toLowerCase() === 'bp') {
            words[i] = 'Blueprint';
            continue;
        } else if (words[i].toLowerCase().split('').every(char => char === words[i][0]) || words[i].toUpperCase() === 'IV') {
            words[i] = words[i].toUpperCase()
            continue;
        }
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
    }
    return words.join(' ');
}

export const erasFull = { 'l': 'Lith', 'm': 'Meso', 'n': 'Neo', 'a': 'Axi', 'r': 'Requiem' }

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
export function filterRelic(relic_check) {
    const relic = relic_check.toLowerCase()
    let relicEra, relicType;
    if (['meso', 'neo', 'axi', 'lith', 'requiem'].some(x => relic.startsWith(x))) {
        [relicEra, relicType] = titleCase(relic).split(" ")
    } else {
        relicEra = erasFull[relic[0]]
        relicType = relic.slice(1).toUpperCase()
    }

    if (!relicEra || !relicType) return undefined;
    return `${relicEra} ${relicType}`
}

export const range = (num) => {
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

export const codeObj = {
    ED: 0,
    RED: 1,
    ORANGE: 2,
    YELLOW: 3,
    GREEN: 4,
}

export const uncodeObj = {
    0: "ED",
    1: "RED",
    2: "ORANGE",
    3: "YELLOW",
    4: "GREEN"
}

export const hex = {
    ED: "#351c75",
    RED: "#990000",
    ORANGE: "#b45f06",
    YELLOW: "#bf9000",
    GREEN: "#38761d",
}

export const stockRanges = {
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
export async function relicExists(relic) {
    const wasfound = await db.mongoClient.db('treasury').collection('relics').findOne({ name: relic })
    return wasfound
}

export const rarities = ['C ', 'C ', 'C ', 'UC', 'UC', 'RA']

export const toClanName = {
    IK: 'Imouto Kingdom',
    WK: 'Waifu Kingdom',
    MK: 'Manga Kingdom',
    YK: 'Yuri Kingdom',
    CK: 'Cowaii Kingdom',
    TK: 'Tsuki Kingdom',
    HK: 'Heavens Kingdom',
    AK: 'Andromeda Kingdom'
}
