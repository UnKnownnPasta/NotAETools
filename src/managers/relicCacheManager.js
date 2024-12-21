import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

class RelicCacheManager {
  constructor() {
    this._client = {};
    this.soupCache = [
      {
        id: "1193415346229620758",
        tags: ['intact', 'soup'],
        /** @type {import("../other/types").CacheOfSoupMessage[]} */
        stored: []
      },
      {
        id: "1193414617490276423",
        tags: ['radded', 'soup'],
        /** @type {import("../other/types").CacheOfSoupMessage[]} */
        stored: []
      }
    ]
    this.relicCache = {};
  }
  async setCache() {
    const data = readFileSync(join(__dirname, '../data/relics.json'), 'utf-8');
    const relics = await JSON.parse(data);
    this.relicCache = relics;
  }
}

const relicCacheManager = new RelicCacheManager();
export default relicCacheManager;