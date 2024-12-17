import { Events } from 'discord.js';
import entityClassifierInstance from '../services/nlp.js';

/** @type {import('../other/types').Event} */
export default {
    name: Events.MessageUpdate,
    enabled: true,
    trigger: "on",
    /**
     * @param {import('discord.js').Message} message 
     * @param {import('discord.js').Client} client
     */
    async execute(client, oldMessage, newMessage) {
      console.log(oldMessage.content, newMessage.content);
    }
}