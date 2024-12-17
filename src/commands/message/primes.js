/** @type {import('../../other/types').Command} */
export default {
  name: "primes",
  enabled: true,
  trigger: "message",
  execute: async (message) => message.reply("Primes!"),
}