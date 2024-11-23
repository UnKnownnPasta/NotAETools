import { Events } from 'discord.js';

/** @type {import('../config/types').Event} */
export default {
    name: Events.MessageCreate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} message 
     * @param {import('discord.js').Client} client
     */
    async execute(client, message) {
        console.log(message);
    }
}