const { Client, Message, EmbedBuilder } = require('discord.js')
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
        if (!member.roles.cache.some(role => role.id == '890240560319856711')) return;

        var word = "";
        try {
            word = message.content.split(' ')[0].slice(2)
            const command = client.treasury.get(word.toLocaleLowerCase())
            if (command?.data) {
                const reply = await message.reply({ content: `Unknown command. Perhaps its a slash command?` })
                setTimeout(() => {
                    reply.delete()
                }, 3000);
                return;
            } else if (command) {
                command?.execute(client, message)
            } else {
                success(`COMMAND`, `"${word}" by ${message.member.nickname??message.member.user.username}`)

                // Checking if its something like ++lg1, similar to soup
                var relicEra, relicType, relicShort, finalRelic;

                if (['meso', 'neo', 'axi', 'lith'].includes(word)) {
                    relicEra = word[0].toLocaleUpperCase() + word.slice(1)
                    relicType = message.content.split(' ')[1].toLocaleUpperCase() ?? 'a'
                } else {
                    relicShort = word.slice(0, 1)
                    if (!isNaN(word)) return;
                    else if (relicShort[0] === 'a') relicEra = "Axi"
                    else if (relicShort[0] === 'n') relicEra = "Neo"
                    else if (relicShort[0] === 'm') relicEra = "Meso"
                    else if (relicShort[0] === 'l') relicEra = "Lith"
                    relicType = word.slice(1).toUpperCase()
                }

                let jsfile = await JSON.parse(await fs.readFileSync('./data/relicdata.json', 'utf-8'))
                for (const relic of jsfile) {
                    if (relic[0][0] == `${relicEra} ${relicType}`) finalRelic = relic.map(x => x[0]), relic.map(x => x[1])
                }

                if (finalRelic) {
                    var descstring = ""
                    for (var n = 0; n < 5; n++) {
                        var bindex = finalRelic[n+1].indexOf('[') ?? -1
                        descstring += `${`${finalRelic[n+1].slice(bindex == -1 ? 100 : bindex+1, -1)}`.padEnd(3)} | ${finalRelic[n+1].slice(0, bindex == -1 ? 100 : bindex)}\n`
                    }
                    await message.reply({ embeds: [
                        new EmbedBuilder()
                        .setTitle(`[ ${finalRelic[0]} ] {${finalRelic[7]}}`)
                        .setDescription(`
\`\`\`ml
${descstring}
\`\`\`
`) ] })
                }
            }
        } catch (error) {
            err(error, `"${word}" by ${message.member.nickname??message.member.user.username}`)
            console.log(error)
        }
    },
};