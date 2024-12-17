/** @type {import('../../other/types').Command} */
export default {
  name: "status",
  enabled: true,
  trigger: "message",
  execute: async (message) => message.reply("Status!"),
}