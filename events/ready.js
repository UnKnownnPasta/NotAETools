const { Client, ActivityType } = require('discord.js')
const { alert, err } = require('../data/utils');
const { spreadsheet } = require('../configs/config.json')

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

        alert('LOGIN', `Logged in as ${client.user.username} at ${new Date().toJSON().slice(0,10).replace(/-/g,'/')} // ${new Date().toLocaleTimeString()}`);
        client.startuptime = new Date().getTime();
        await client.guilds.fetch({ force: true });

        // try {
        //     await require('../data/utils').updateFissures(client)
        //     alert('UPDATE', 'Started updating fissures channel successfully.')   
        // } catch (error) {err(error, 'Could not update fissures. Maybe fissure channel is not there?', true)}
        
        // try {
        //     await require('../treasury/messagetype/refresh.js').fetchAllPrimeParts(spreadsheet.ranges[0])
        //     await require('../treasury/messagetype/refresh.js').fetchUserIds(spreadsheet.ranges[1])
        //     alert('UPDATE', 'Loaded relic and user data.')
        // } catch (error) {err(error, 'Could not fetch relics data and/or user data.')}
    },
};