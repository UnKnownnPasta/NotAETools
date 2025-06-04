/**
 * @typedef {Object} Event
 * @property {string} name - The name of the event.
 * @property {boolean} enabled - Whether the event is enabled.
 * @property {boolean} disabled - Whether the event is disabled.
 * @property {"on" | "once"} trigger - The trigger type (either "on" or "once").
 * @property {function(...args: any[]): any} execute - The function to execute for the event.
 */

import { Client, CommandInteraction, Message } from "discord.js";

/**
 * @typedef {(client: Client, trigger: CommandInteraction | Message) => void} ExecuteFunction
 */

/**
 * @typedef {Object} Command
 * @property {string} name - The name of the command.
 * @property {ExecuteFunction} execute - The function to execute when the command is run.
 * @property {boolean} enabled - Whether the command is enabled.
 * @property {boolean} disabled - Whether the command is disabled.
 * @property {"message" | "interaction" | "button"} trigger - The trigger type.
 */

/**
 * @typedef {Command} InteractionCommand
 * @property {Object} data - The interaction command data.
 */

/**
 * @typedef {Object} dataItem
 * @property {string} item - Item Name.
 * @property {string} amount - Amount of the item.
 */

/**
 * @typedef {Object} CacheOfDataItem
 * @property {string} author - Author ID.
 * @property {string} id - Message ID.
 * @property {dataItem[]} data - Data object parsed from the message.
 */

/**
 * @typedef {Object} CacheOfSoupMessage
 * @property {string} author - Message author.
 * @property {string} id - Message ID.
 * @property {string} content - Message content.
 * @property {dataItem[]} contains - Data object parsed from the message.
 */

/**
 * @typedef {Object} CacheOfSoupChannel
 * @property {string} id - Channel ID.
 * @property {CacheOfSoupMessage[]} stored - Array of soup messages.
 * @property {string[]} tags - Array of tags.
 */

/**
 * @typedef {Object} primeItem
 * @property {string} item - The name of the prime item.
 * @property {boolean} x2 - Whether the prime item is dual equipped.
 * @property {number} stock - The stock of the prime item.
 * @property {string} color - The color of the prime item.
 * @property {number} rarity - The rarity of the prime item.
 * @property {string[]} relicFrom - The relic from which the prime item is obtained.
 */

export default {};