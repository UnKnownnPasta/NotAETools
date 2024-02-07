const { CommandInteraction, Client } = require('discord.js')
const { err, alert } = require('../data/utils.js');

module.exports = {
    name: 'interactionCreate', 
    once: false,
    /**
    * @param {CommandInteraction} interaction
    * @param {Client} client
    */
    async execute(client, interaction) {
        if (interaction.isChatInputCommand()) {
            // Run the slash commands, if exists
            const command = client.treasury.get(interaction.commandName);
        
            if (!command) {
                alert(`WARNING`, `No command matching ${interaction.commandName} was found, even though it was run.`)
                return;
            }
            
            try {
                await command.execute(client, interaction);
                alert(`COMMAND`, `"${interaction.commandName}" by ${interaction.member.nickname??interaction.user.username} @ ${new Date().toLocaleTimeString()}`)
            } catch (error) {
                console.log(error)
                err(error, `"${interaction.commandName}" by ${interaction.member.nickname??interaction.user.username} @ ${new Date().toLocaleTimeString()}`)
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
        
        else if (interaction.isButton()) {
            if (interaction.message.createdTimestamp < client.startuptime) return;
            const button = client.buttons.get(interaction.customId.split('-')[0])
            if (!button) return
            try {
                await button.execute(client, interaction)
            }
            catch(error) { 
                err(error, 'Button Failure');
                await interaction.channel.send({ content: 'There was an error while executing the button script!', ephemeral: true});
            }
        }
    },
};