/** @type {import('../../other/types').Command} */
export default {
    name: "ping",
    enabled: true,
    trigger: "message",
    execute: async (message) => message.reply("Pong!"),
}