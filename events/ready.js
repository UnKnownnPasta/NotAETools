const { Client, ActivityType } = require('discord.js')
const { success } = require('../data/utils');

module.exports = {
    name: 'ready', 
    once: true,
    /**
    * @param {Client} client
    */
    async execute(client) {
        client.user.setPresence({ 
            activities: [{
                name: 'noone 👒', 
                type: ActivityType.Watching
             }],
            status: 'dnd'
        });
        success('LOGIN', `Logged in as ${client.user.username} at ${new Date().toJSON().slice(0,10).replace(/-/g,'/')}`)
        client.startuptime = new Date().getTime()
    },
};