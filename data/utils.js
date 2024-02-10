const chalk = require('chalk')
const axios = require('axios')
const { Client, EmbedBuilder, Embed } = require('discord.js')
const { fissureChannel } = require('../configs/config.json')

/**
* @description 
  Utility functions file:
  Functions such as error logging, but fancier
  and uhhh idk
*/

function err(err, txt) {
    console.log(`[${chalk.red(`INFO`)}]: ${txt}`)
    console.log(`[${chalk.red(`${err.name}`)}]: ${err}`)
}
function alert(nm, txt) {
    console.log(`[${chalk.blue(`${nm}`)}]: ${txt}`)
}

function checkForRelic(relic) {
  let relicEra, relicType;
  if (['meso', 'neo', 'axi', 'lith'].includes(relic)) {
      relicEra = relic[0].toLocaleUpperCase() + relic.slice(1)
      relicType = message.content.split(' ')[1].toLocaleUpperCase() ?? false
      
      if (!relicType) return false
      return `${relicEra} ${relicType}`
  } else {
      if (!isNaN(relic)) return false;
      else if (relic[0] === 'a') relicEra = "Axi"
      else if (relic[0] === 'n') relicEra = "Neo"
      else if (relic[0] === 'm') relicEra = "Meso"
      else if (relic[0] === 'l') relicEra = "Lith"
      relicType = relic.slice(1).toUpperCase();
      if (relicType == '') return false;
      return `${relicEra} ${relicType}`
  }
}

/**
 * Updates fissures in fissure channel every 3 minutes: 1192962141205045328
 * @param {Client} client 
 */
async function updateFissures(client) {
  const channel = await client.channels.cache.get(fissureChannel).messages.fetch({ limit: 4 })
  const missions = ['Extermination ', 'Capture', 'Sabotage', 'Rescue']
  const response = (await axios.get("https://api.warframestat.us/pc/fissures")).data.filter(
    (f) => !f["isStorm"] && missions.includes(f["missionType"]) && f['active']
  )
  
  const fissures = response.map(fis => [titleCase(fis['tier']), `${fis['missionType']} - ${fis['node']} - 🕗 ${fis['eta']}`, fis['isHard']])
  const activeEras = fissures.map(x => `${x[0]}${x[2]}`)

  const NormEmbed = new EmbedBuilder().setTitle('Normal Fissures');
  activeEras.some(x => x == 'Lithfalse') ? NormEmbed.addFields({ name: 'Lith', value: fissures.filter(x => x[0] == 'Lith' && !x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Mesofalse') ? NormEmbed.addFields({ name: 'Meso', value: fissures.filter(x => x[0] == 'Meso' && !x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Neofalse') ? NormEmbed.addFields({ name: 'Neo', value: fissures.filter(x => x[0] == 'Neo' && !x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Axifalse') ? NormEmbed.addFields({ name: 'Axi', value: fissures.filter(x => x[0] == 'Axi' && !x[2]).map(x => x[1]).join('\n') }) : null;

  const SPEmbed = new EmbedBuilder().setTitle('Steel Path fissures').setTimestamp();
  activeEras.some(x => x == 'Lithtrue') ? SPEmbed.addFields({ name: 'Lith', value: fissures.filter(x => x[0] == 'Lith' && x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Mesotrue') ? SPEmbed.addFields({ name: 'Meso', value: fissures.filter(x => x[0] == 'Meso' && x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Neotrue') ? SPEmbed.addFields({ name: 'Neo', value: fissures.filter(x => x[0] == 'Neo' && x[2]).map(x => x[1]).join('\n') }) : null;
  activeEras.some(x => x == 'Axitrue') ? SPEmbed.addFields({ name: 'Axi', value: fissures.filter(x => x[0] == 'Axi' && x[2]).map(x => x[1]).join('\n') }) : null;

  await channel.forEach(async (msg) => msg.author.id == client.user.id ? (await msg.edit({ embeds: [NormEmbed, SPEmbed] })) : null)
}

function titleCase(str) {
  const words = str.split(' ');

  for (let i = 0; i < words.length; i++) {
    if (words[i] == 'bp') {
      words[i] = 'BP';
      continue;
    }
    words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase();
  }
  return words.join(' ');
}

module.exports = {
  err,
  alert,
  checkForRelic,
  updateFissures,
  titleCase
}

/* Fissures are like
        {
            "id": "65c4d10588bd9d4881fa1dff",
            "activation": "2024-02-08T13:03:01.723Z",
            "startString": "-1h 38m 27s",
            "expiry": "2024-02-08T14:47:49.920Z",
            "active": true,
            "node": "E Gate (Venus)",
            "missionType": "Extermination",
            "missionKey": "Extermination",
            "enemy": "Corpus",
            "enemyKey": "Corpus",
            "nodeKey": "E Gate (Venus)",
            "tier": "Lith",
            "tierNum": 1,
            "expired": false,
            "eta": "6m 20s",
            "isStorm": false,
            "isHard": true
        },
*/