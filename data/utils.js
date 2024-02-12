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

function err(err, txt, log=false) {
    if (log) console.log(err)
    console.log(`[${chalk.red(`INFO`)}]: ${txt}`)
    console.log(`[${chalk.red(`${err.name}`)}]: ${err}`)
}
function alert(nm, txt) {
    console.log(`[${chalk.blue(`${nm}`)}]: ${txt}`)
}

function checkForRelic(relic) {
  let relicEra, relicType;
  if (['meso', 'neo', 'axi', 'lith'].some(x => relic.indexOf(x) !== -1)) {
      return `${relic[0].toUpperCase()}${relic.slice(1, relic.split(' ')[0].length).toLowerCase()} ${relic.slice(relic.split(' ')[0].length+1).toUpperCase()}`
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
  const channel = await client.channels.cache.get(fissureChannel).messages.fetch({ limit: 2 })
  const missions = ['Extermination', 'Capture', 'Sabotage', 'Rescue']
  const response = (await axios.get("https://api.warframestat.us/pc/fissures")).data.filter(
    (f) => !f["isStorm"] && missions.includes(f["missionType"]) && f['active']
  )
  
  const fissures = response.map(fis => [titleCase(fis['tier']), `${fis['missionType']} - ${fis['node']} - ends <t:${new Date(fis['expiry']).getTime()/1000 | 0}:R>`, fis['isHard']])
  const activeEras = fissures.map(x => `${x[0]}${x[2]}`)

  const NormEmbed = new EmbedBuilder().setTitle('Normal Fissures');
  const SPEmbed = new EmbedBuilder().setTitle('Steel Path fissures').setTimestamp();
  ['Lith', 'Meso', 'Neo', 'Axi'].forEach(f => {
    !activeEras.some(x => x == `${f}false`) || NormEmbed.addFields({ name: f, value: fissures.filter(x => x[0] == f && !x[2]).map(x => x[1]).join('\n') });
    !activeEras.some(x => x == `${f}true`) || SPEmbed.addFields({ name: f, value: fissures.filter(x => x[0] == f && x[2]).map(x => x[1]).join('\n') });
  })

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