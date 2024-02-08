const { Client, Message } = require('discord.js')
const { alert, err } = require('../data/utils');
const { prefix, dept } = require('../configs/config.json')

module.exports = {
    name: 'messageCreate', 
    once: false,
    /**
    * @param {Message} message
    * @param {Client} client
    */
    async execute(client, message) { 
        if (!message.content.startsWith(prefix) || message.author.bot) return;

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
                alert(`COMMAND`, `"${word}" by ${message.member.nickname??message.member.user.username} @ ${new Date().toLocaleTimeString()}`)
            } else {
                alert(`COMMAND`, `"${word}" by ${message.member.nickname??message.member.user.username} @ ${new Date().toLocaleTimeString()}`)

                // Checking if its something like ++lg1, similar to soup
                client.treasury.get('*').execute(client, message, word)
            }
        } catch (error) {
            err(error, `"${word}" by ${message.member.nickname??message.member.user.username} @ ${new Date().toLocaleTimeString()}`)
            console.log(error)
        }
    },
};