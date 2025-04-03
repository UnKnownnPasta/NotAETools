import { extractItems } from "../services/nlp.js";
import crypto from "node:crypto";
import { Mutex } from "async-mutex";
const mutex = new Mutex();

class BoxCacheManager {
  constructor() {
    /**
     * @type {import("discord.js").Client}
     */
    this._client = {};
    this.channelCache = [];
    
    /** @type {import("../other/types").dataItem[]} */
    this.boxCache = [];
  }

  init(clientInstance) {
    this._client = clientInstance;
    this.channelCache = [
      {
        id: process.env.CHANNELS_BOX_atom,
        tags: ['atom', 'warframe'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: process.env.CHANNELS_BOX_ntoz,
        tags: ['ntoz', 'warframe'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: process.env.CHANNELS_BOX_melee,
        tags: ['melee', 'other', 'misc', 'weapon'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: process.env.CHANNELS_BOX_primary,
        tags: ['primary', 'secondary', 'weapon'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      }
    ]
  }

  async updateCache(chID="--") {
    if (!this._client) return;
    await mutex.runExclusive(async () => {
      const specialID = crypto.randomBytes(20).toString('hex');
      console.time(`box::updateCache [${specialID}]`);
  
      for (const channel of this.channelCache) {
        if (chID != "--" && chID != channel.id) continue;

        const threadChannel = await this._client.channels.fetch(channel.id);

        if (!threadChannel) {
          console.warn(`No thread found for ${channel.id}`);
          continue;
        }

        const messageCache = await threadChannel.messages.fetch({ limit: 100 });
        const messages = messageCache.map(msg => {
          const msgContent = msg.content
            .replace(/\s*prime\s*/g, ' ')
            .replace(/\(.*?\)/g, "")
            .replace(/<@!?[^>]+>/g, ""); // User mentions regex

          return {
            author: msg.author.id,
            id: msg.id,
            data: extractItems(msgContent)
          }
        });
  
        channel.stored = structuredClone(messages);
      }
  
      const tempCache = [];

      for (const channel of this.channelCache) {
        const cacheItems = channel.stored.map(msg => msg.data).flat();
        for (const item of cacheItems) {
          const tItem = tempCache.find(i => i.item == item.item)
          if (tItem) {
            tItem.amount += item.amount
          } else {
            tempCache.push(item);
          }
        }
      }

      this.boxCache = structuredClone(tempCache);
  
      console.timeEnd(`box::updateCache [${specialID}]`);
    })
  }
}

const boxCacheManager = new BoxCacheManager();
export default boxCacheManager;