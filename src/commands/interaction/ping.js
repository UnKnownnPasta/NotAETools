import { SlashCommandBuilder } from 'discord.js';

/** @type {import('../../other/types').InteractionCommand} */
export default {
    name: "ping",
    enabled: true,
    trigger: "interaction",
    execute: async (client, interaction) => {
        await interaction.reply("Pong!");
    },
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong!"),
}