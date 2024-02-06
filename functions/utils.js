const chalk = require('chalk')

/**
* @description 
  Utility functions file:
  Functions such as error logging, but fancier
  and uhhh idk
*/

export function err(err, txt) {
    console.log(`${chalk.red(`ℹ`)}: ${txt}`)
    console.log(`[${chalk.red(`ERROR | ${err.name}`)}]: ${err.message}`)
}
export function success(nm, txt) {
    console.log(`[${chalk.red(`${nm}`)}]: ${txt}`)
}