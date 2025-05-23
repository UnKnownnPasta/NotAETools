import { Events } from 'discord.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.InteractionCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(client, interaction) {
        if (!client.finishedSequence) return;
        
        const command = interaction.commandName;
        if (interaction.isChatInputCommand()) {
            client.cmd_handler.find(`${command}-interaction`)?.execute(client, interaction);
            console.log(`${interaction.user.username} used /${command} as ${interaction.options?.data?.map(x=>`"${x.name}": ${x.value}`)?.join(', ')}`);
        } else if (interaction.isAutocomplete()) {
            client.cmd_handler.find(`${command}-interaction`)?.autocomplete(interaction);
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('paginate')) return;
            client.cmd_handler.find(`${interaction.customId.split('-')[0]}-button`)?.execute(client, interaction);
            console.log(`${interaction.user.username} used button ${interaction.customId}`);
        }
    }
}