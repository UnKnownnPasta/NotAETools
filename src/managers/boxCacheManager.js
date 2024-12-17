import { extractItems } from "../services/utils.js";

class BoxCacheManager {
  constructor() {
    this._client = {};
    this.boxChannelID = "1221032022919872572";
    this.channelCache = [
      {
        id: "1221695831875256441",
        tags: ['atom', 'warframe'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: "1221695851231973386",
        tags: ['ntoz', 'warframe'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: "1221388067806384168",
        tags: ['melee', 'other', 'misc', 'weapon'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      },
      {
        id: "1221032209893294101",
        tags: ['primary', 'secondary', 'weapon'],
        /** @type {import("../other/types").CacheOfDataItem[]} */
        stored: []
      }
    ];
    /** @type {import("../other/types").dataItem[]} */
    this.boxCache = [];
  }

  setBoxCache() {
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

  async updateCache() {
    console.time("updateCache");
    /** @type {import("discord.js").ThreadManager} */
    const thread = this._client.channels.cache.get(this.boxChannelID)?.threads;

    for (const channel of this.channelCache) {
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

    console.timeEnd("updateCache");
  }
}

const boxCacheManager = new BoxCacheManager();
export default boxCacheManager;