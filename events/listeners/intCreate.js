const { CommandInteraction, Client } = require('discord.js')
const config = require('../../data/config.json')
const { alert, info } = require('../../data/utility');

module.exports = {
    name: 'interactionCreate', 
    once: false,
    /**
    * @param {CommandInteraction} interaction
    * @param {Client} client
    */
    async listen(client, interaction) {
        
    },
};