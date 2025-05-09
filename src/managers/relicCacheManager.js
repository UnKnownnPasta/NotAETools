import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path';
import { extractSoup, titleCase } from '../services/utils.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
import crypto from "node:crypto";
import { Mutex } from "async-mutex";
const mutex = new Mutex();

class RelicCacheManager {
  constructor() {
    /** @type {import("discord.js").Client} */
    this._client = {};
    /** @type {import("../other/types").CacheOfSoupChannel[]} */
    this.soupCache = [];
    this.relicCache = { relics: [], primes: [] };
  }

  init(clientInstance) {
    this._client = clientInstance;
    this.soupCache = [
      {
        id: process.env.CHANNELS_RELIC_intact,
        tags: ['intact', 'soup'],
        stored: []
      },
      {
        id: process.env.CHANNELS_RELIC_radded,
        tags: ['radded', 'soup'],
        stored: []
      }
    ]
  }

  async setRelicCache() {
    if (!this._client.readyTimestamp) return;
    await mutex.runExclusive(async () => {
      const specialID = crypto.randomBytes(20).toString('hex');
      console.time(`relic::setRelicCache [${specialID}]`);
      // Relic Cache
      const data = readFileSync(join(__dirname, '../data/relicsdb.json'), 'utf-8');
      const relics = await JSON.parse(data);
      this.relicCache = relics;
      console.timeEnd(`relic::setRelicCache [${specialID}]`);
    })
  }

  async setSoupCache(channelID='--') {
    if (!this._client.readyTimestamp) return;
    await mutex.runExclusive(async () => {
      const specialID = crypto.randomBytes(20).toString('hex');
      console.time(`relic::setSoupCache [${specialID}]`);
  
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
            url: msg.url,
            author: msg.author.username,
            contains: [...prepData],
          }
        });
        channel.stored = [];
        channel.stored.push(...messages);
      }
      console.timeEnd(`relic::setSoupCache [${specialID}]`);
    })
  }

  /** @returns {import("../other/types").dataItem} */
  searchForSoupCache(relic) {
    const matches = []
    for (const cache of this.soupCache) {
      for (const msg of cache.stored) {
        const test = msg.contains.find(item => item.item === relic);
        if (test) {
          matches.push([test, msg, cache.tags[0]]);
        }
      }
    }
    return matches; // Return null if no match is found
  }
}

const relicCacheManager = new RelicCacheManager();
export default relicCacheManager;