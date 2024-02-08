const chalk = require('chalk')
const axios = require('axios')

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


async function updateFissures(client) {
  const response = await axios.get("https://api.warframestat.us/pc/")
  const fissures = response.data.fissures
  let normFissureString = ""
  let spFissureString = ""
  fissures.forEach(async (fis) => {
    if (fis["isHard"]) {
      
    }
  })
}

module.exports = {
  err,
  alert,
  checkForRelic,
  updateFissures
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