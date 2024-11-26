import { Events } from 'discord.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.ClientReady,
    enabled: true,
    trigger: "once",
    /**
     * @param {import('discord.js').Client} client
     */
    async execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}