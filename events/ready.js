const { Client, ActivityType } = require('discord.js')
const { alert } = require('../data/utils');

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
        alert('LOGIN', `Logged in as ${client.user.username} at ${new Date().toJSON().slice(0,10).replace(/-/g,'/')} // ${new Date().toLocaleTimeString()}`)
        client.startuptime = new Date().getTime()
    },
};