import { Message, Events } from "discord.js";

export default {
    TYPE: Events.MessageCreate,
    ENABLED: false,
    /**
     * Message create event listener
     * @param {Message} m
     */
    async listener(client, m) {
        if (m.author.bot) return;
    },
};
