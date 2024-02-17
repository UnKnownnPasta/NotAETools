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
    (f) => !f["isStorm"] && missions.includes(f["missionType"]) && f['active'] && f['tier'] != 'Requiem'
  )
  
  const fissures = response.map(fis => [titleCase(fis['tier']), `${fis['missionType']} - ${fis['node']} - Ends <t:${new Date(fis['expiry']).getTime()/1000 | 0}:R>\n`, fis['isHard']])
  const [N_Embed, S_Embed] = Object.entries(fissures.reduce((acc, fissure) => {
    let currentEmbed = fissure[2] ? acc.S_Embed : acc.N_Embed

    currentEmbed[fissure[0]]
    ? currentEmbed[fissure[0]].value += fissure[1]
    : currentEmbed[fissure[0]] = { name: fissure[0], value: fissure[1] }

    return acc;
  }, {
    N_Embed: {},
    S_Embed: {}
  }))

  const NormEmbed = new EmbedBuilder()
   .setTitle('Normal Fissures')
   .setFields(Object.values(N_Embed[1]).sort((a, b) => b.name.localeCompare(a.name)));
  const SPEmbed = new EmbedBuilder()
   .setTitle('Steel Path Fissures')
   .setFields(Object.values(S_Embed[1]).sort((a, b) => b.name.localeCompare(a.name)))
   .setTimestamp();

  await channel.forEach(async (msg) => msg.author.id == client.user.id ? (await msg.edit({ embeds: [NormEmbed, SPEmbed] })) : null)
}


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