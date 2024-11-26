export const _bool_true = (f) => f == true ? true : false;

/**
 * Convert a given string into title case
 * @example
 * titleCase('glaive prime') => 'Glaive Prime'
 * titleCase('baRUUk bp') => 'Baruuk BP'
 * @param {String} str 
 * @returns String
 */
export function titleCase(str) {
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
export function relicFullName(relic) {
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