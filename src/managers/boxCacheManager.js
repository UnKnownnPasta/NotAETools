import { extractItems } from "../services/nlp.js";

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

  resetStored(chID='--') {
    if (chID != '--') {
      this.channelCache.find(channel => channel.id == chID).stored = [];
    } else {
      this.channelCache.forEach(channel => channel.stored = []);
    }
  }

  setBoxCache() {
    this.boxCache = [];
    for (const channel of this.channelCache) {
      const cacheItems = channel.stored.map(msg => msg.data).flat();
      for (const item of cacheItems) {
        const tItem = this.boxCache.find(i => i.item == item.item)
        if (tItem) {
          tItem.amount += item.amount
        } else {
          this.boxCache.push(item);
        }
      }
    }
  }

  async updateCache(channelID="--") {
    if (!this._client) return;
    console.time("box::updateCache");

    if (channelID == "--") {
      this.resetStored();
    } else {
      this.resetStored(channelID);
    }

    for (const channel of this.channelCache) {
      if (channelID != "--" && channelID != channel.id) continue;
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

      channel.stored.push(...messages);
    }

    this.setBoxCache();

    console.timeEnd("box::updateCache");
  }
}

const boxCacheManager = new BoxCacheManager();
export default boxCacheManager;