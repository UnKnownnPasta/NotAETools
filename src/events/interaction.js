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
        const command = interaction.commandName;

        if (command) client.cmd_handler.find(`${command}-interaction`).execute(client, interaction);
    }
}