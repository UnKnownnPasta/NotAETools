import { Client, Events } from "discord.js";

export default {
    TYPE: Events.ClientReady,
    ENABLED: true,
    /** * @param {Client} client */
    async listener(client) {
        console.log(`bot | Logged in as ${client.user.username}~ [${new Date().toLocaleDateString()} :: ${new Date().toLocaleTimeString()}]`);
    },
};
