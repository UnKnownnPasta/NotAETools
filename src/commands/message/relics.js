/** @type {import('../../other/types').Command} */
export default {
  name: "relics",
  enabled: true,
  trigger: "message",
  execute: async (message) => message.reply("Relics!"),
}