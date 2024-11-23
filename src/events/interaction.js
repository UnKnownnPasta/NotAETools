import { Events } from 'discord.js';

/** @type {import('../config/types').Event} */
export default {
    name: Events.InteractionCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Interaction} interaction
     */
    async execute(client, interaction) {
        console.log(message);
    }
}