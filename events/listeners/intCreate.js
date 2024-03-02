const { CommandInteraction, Client, ButtonInteraction } = require('discord.js')
const config = require('../../data/config.json')
const { alert, info } = require('../../scripts/utility');

module.exports = {
    name: 'interactionCreate', 
    once: false,
    /**
    * @param {CommandInteraction|ButtonInteraction} interaction
    * @param {Client} client
    */
    async listen(client, interaction) {
        if (interaction.isChatInputCommand()) {
            client.treasury.get(interaction.commandName)?.execute(client, interaction)
            client.farmers.get(interaction.commandName)?.execute(client, interaction)
            info('CMD', `"${interaction.user.username}" Ran interaction command "${interaction.commandName}" with arguments: ${interaction.options.data.map(x=>`"${x.name}": ${x.value}`).join(', ')}`)
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('paginate')) return;
            client.buttons?.get(interaction.customId.split('-')[0])?.execute(client, interaction)
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.farmers.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
    
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error(error);
            }
        }
    },
};