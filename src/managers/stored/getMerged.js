// Load relicsdb.json, load boxCacheManager's sstored box amounts, and add the box amount to all parts in relicsdb.json
import { range } from '../../services/utils.js';
import boxCacheManager from '../boxCacheManager.js';
import relicCacheManager from '../relicCacheManager.js';

export async function getMerged() {
  const relicObject = structuredClone(relicCacheManager.relicCache);
  const boxData = structuredClone(boxCacheManager.boxCache);

  // Process box data to key: value pairs
  const boxObject = {};
  for (const box of boxData) {
    boxObject[box.item] = box.amount;
  }

  // Add box amounts to relicsdb.json
  for (const relic of relicObject.relics) {
    for (const part of relic.rewards) {
      if (boxObject[part.item]) {
        part.stock = (part.stock || 0) + (boxObject[part.item] || 0);
        part.color = range(part.stock);
      }
    }
  }

  // add for primes
  for (const prime of relicObject.primes) {
    if (boxObject[prime.item]) {
      prime.stock = (prime.stock || 0) + (boxObject[prime.item] || 0);
      prime.color = range(prime.stock);
    }
  }

  return relicObject;
}