import { Events } from 'discord.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.InteractionCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(client, interaction) {
        console.log(typeof interaction);
        
        if (!client.finishedSequence) return;
        
        const command = interaction.commandName;
        if (interaction.isChatInputCommand()) {
            client.cmd_handler.find(`${command}-interaction`).execute(client, interaction);
            console.log(`${interaction.user.username} used /${command}`);
        } else if (interaction.isAutocomplete()) {
            client.cmd_handler.find(`${command}-interaction`).autocomplete(interaction);
        } else if (interaction.isButton()) {
            client.cmd_handler.find(`${interaction?.message?.interaction?.commandName}-button`).execute(client, interaction);
        }
    }
}