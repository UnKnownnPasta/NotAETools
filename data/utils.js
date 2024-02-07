const chalk = require('chalk')

/**
* @description 
  Utility functions file:
  Functions such as error logging, but fancier
  and uhhh idk
*/

function err(err, txt) {
    console.log(`[${chalk.red(`info`)}]: ${txt}`)
    console.log(`[${chalk.red(`ERROR | ${err.name}`)}]: ${err.message}`)
}
function alert(nm, txt) {
    console.log(`[${chalk.blue(`${nm}`)}]: ${txt}`)
}

module.exports = {
  err,
  alert
}