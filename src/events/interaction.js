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
            const cmd = client.cmd_handler.find(`${command}-interaction`);
            if (!cmd || !client.cmd_handler.isCommandEnabled(command, 'interaction')) return;
            cmd.execute(client, interaction);
            console.log(`${interaction.user.username} used /${command} as ${interaction.options?.data?.map(x=>`"${x.name}": ${x.value}`)?.join(', ')}`);
        } else if (interaction.isAutocomplete()) {
            const cmd = client.cmd_handler.find(`${command}-interaction`);
            if (!cmd || !client.cmd_handler.isCommandEnabled(command, 'interaction')) {
                return interaction.respond([]);
            }
            cmd.autocomplete(interaction);
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('paginate')) return;
            const [cmdName] = interaction.customId.split('-');
            const cmd = client.cmd_handler.find(`${cmdName}-button`);
            if (!cmd || !client.cmd_handler.isCommandEnabled(cmdName, 'button')) {
                return interaction.reply({ 
                    content: 'This button is currently disabled.', 
                    ephemeral: true 
                });
            }
            cmd.execute(client, interaction);
            console.log(`${interaction.user.username} used button ${interaction.customId}`);
        }
    }
}