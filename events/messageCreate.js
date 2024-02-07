const { Client, Message, EmbedBuilder } = require('discord.js')
const { success, err } = require('../data/utils');
const { prefix, dept } = require('../configs/config.json')
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
        if (!message.member.roles.cache.some(role => role.id == dept.roles.treasury)) return;

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
                
            }
        } catch (error) {
            err(error, `"${word}" by ${message.member.nickname??message.member.user.username}`)
            console.log(error)
        }
    },
};