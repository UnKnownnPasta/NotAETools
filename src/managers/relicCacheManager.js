import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path';
import { extractSoup, titleCase } from '../services/utils.js';
import { channel } from 'node:diagnostics_channel';
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

class RelicCacheManager {
  constructor() {
    /** @type {import("discord.js").Client} */
    this._client = {};
    this.soupCache = [];
    this.relicCache = {};
  }

  init(clientInstance) {
    this._client = clientInstance;
    this.soupCache = [
      {
        id: process.env.CHANNELS_RELIC_intact,
        tags: ['intact', 'soup'],
        /** @type {import("../other/types").CacheOfSoupMessage[]} */
        stored: []
      },
      {
        id: process.env.CHANNELS_RELIC_radded,
        tags: ['radded', 'soup'],
        /** @type {import("../other/types").CacheOfSoupMessage[]} */
        stored: []
      }
    ]
  }

  async setCache(channelID='--') {
    if (!this._client.readyTimestamp) return;
    console.time("relic::setCache");
    // Relic Cache
    const data = readFileSync(join(__dirname, '../data/relics.json'), 'utf-8');
    const relics = await JSON.parse(data);
    this.relicCache = relics;

    // Soup Cache
    for (const channel of this.soupCache) {
      if (channelID != '--' && channelID != channel.id) continue;
      const msgC = await this._client.channels.fetch(channel.id);
      if (!msgC) {
        console.warn(`No cache for ${channel.id}): ${channel.name}`);
      }
      const messageCache = await msgC.messages.fetch({ limit: 100 });
      const messages = messageCache.map(msg => {
        const prepData = extractSoup(msg.content);
        return {
          id: msg.id,
          content: msg.content,
          author: msg.author.id,
          contains: [...prepData],
        }
      });
      channel.stored = [];
      channel.stored.push(...messages);
    }
    console.timeEnd("relic::setCache");
  }
  searchForCache(relic) {
    return this.soupCache.some(cache => cache.stored.some(msg => msg.contains.find(item => item.item == titleCase(relic))));
  }
}

const relicCacheManager = new RelicCacheManager();
export default relicCacheManager;