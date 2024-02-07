const { Client, Message } = require('discord.js')
const { success, err } = require('../data/utils');
const prefix = require('../configs/config.json').prefix
const fs = require('node:fs')

module.exports = {
    name: 'messageCreate', 
    once: false,
    /**
    * This is a event listener with all stuff related to Queri commands 
    * @param {Message} message
    * @param {Client} client
    */
    async execute(client, message) { 
        if (!message.content.startsWith(prefix) || message.author.bot) return;
        // if (!member.roles.cache.some(role => role.id == '890240560319856711')) return;

        var word = "";
        try {
            word = message.content.split(' ')[0].slice(2)
            const command = client.treasury.get(word.toLocaleLowerCase())
            if (command.data) {
                const reply = await message.reply({ content: `Unknown command. Perhaps its a slash command?` })
                setTimeout(() => {
                    reply.delete()
                }, 3000);
                return;
            } else {
                command.execute(client, message)
            }
            success(`COMMAND`, `"${word}" by ${message.member.nickname??message.member.user.username}`)
            
            // Checking if its something like ++lg1, similar to soup
            var era, type, howmany, firstindex, currentEra, finalRelic;

            try {
                firstindex = word.search(/[a-zA-Z]/)
            } catch (e) { return; }
            howmany = word.slice(0, firstindex)
            currentEra = word.slice(firstindex)
            if (!howmany) return;
            else if (!isNaN(word)) return;
            else if (currentEra[0] === 'a') era = "Axi"
            else if (currentEra[0] === 'n') era = "Neo"
            else if (currentEra[0] === 'm') era = "Meso"
            else if (currentEra[0] === 'l') era = "Lith"
            type = word.slice(firstindex + 1).toUpperCase()

            let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
            for (const relic of jsfile) {
                if (relic[0][0] == `${era} ${type}`) finalRelic = relic.map(x => x[0]), relic.map(x => x[1])
            }
            console.log(finalRelic)
        } catch (error) {
            err(error, `"${word}" by ${message.member.nickname??message.member.user.username}`)
        }
    },
};