import { Events } from 'discord.js';

/** @type {import('../other/types.js').Event} */
export default {
  name: Events.Error,
  enabled: true,
  trigger: "on",
  execute: (client, error) => console.error(error)
}