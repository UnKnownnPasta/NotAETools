const { Client, Message } = require('discord.js')
const { success, err } = require('../data/utils');
const prefix = require('../configs/config.json').prefix

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
        
        try {
            const word = message.content.split(' ')[0].slice(2)
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
            return;
        } catch (error) {
            err(error, `"${word}" by ${message.member.nickname??message.member.user.username}`)
        }
        await message.reply({ content: `Unknown command.` })
    },
};