import { Client, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { relicExists } from "../../utils/generic.js";

export default {
    NAME: 'ping',
    /**
     * pong
     * @param {Client} client 
     * @param {CommandInteraction} i 
     */
    async execute(client, i) {
        await i.reply({ content: `Websocket heartbeat: ${client.ws.ping}ms.` })
    },
    SLASH: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('just ping'),
}
