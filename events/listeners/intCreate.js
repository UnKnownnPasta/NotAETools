const { CommandInteraction, Client, ButtonInteraction } = require('discord.js')
const logger = require('../../scripts/logger');

const authCategories = ["890240564916797457", "1193155346156503091"]

module.exports = {
    name: 'interactionCreate', 
    once: false,
    /**
    * @param {CommandInteraction|ButtonInteraction} interaction
    * @param {Client} client
    */
    async listen(client, interaction) {
        if (process.env.NODE_ENV !== 'development' && !interaction.channel.isDMBased() && client.dofilter && !authCategories.includes(interaction.channel.parentId)) 
            return logger.warn(`[UNAUTH/INT] ${interaction.user.username} @ ${interaction.channel.name}: ${interaction.commandName} &&& ${interaction.options?.data?.map(x=>`"${x.name}": ${x.value}`)?.join(', ')}`);

        if (interaction.isChatInputCommand()) {
            client.treasury.get(interaction.commandName)?.execute(client, interaction)
            client.farmers.get(interaction.commandName)?.execute(client, interaction)
            logger.info(`[CMD] "${interaction.user.username}" Ran interaction command "${interaction.commandName}" with arguments: ${interaction.options?.data?.map(x=>`"${x.name}": ${x.value}`)?.join(', ')}`)
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('paginate')) return;
            client.buttons?.get(interaction.customId.split('-')[0])?.execute(client, interaction)
        } else if (interaction.isAutocomplete()) {
            const command = interaction.client.farmers.get(interaction.commandName);

            if (!command) {
                logger.warn(`No command matching ${interaction.commandName} was found.`);
                return;
            }
    
            try {
                await command.autocomplete(interaction);
            } catch (error) {
                logger.error(error, `Error while trying to run a autocomplete`);
            }
        } else if (interaction.isUserContextMenuCommand()) {
            client.treasury.get(interaction.commandName)?.execute(client, interaction)
            logger.info(`[CTX] "${interaction.user.username}" Ran interaction command "${interaction.commandName}" [Context Menu]`)
        }
    },
};