// Load relicsdb.json, load boxCacheManager's sstored box amounts, and add the box amount to all parts in relicsdb.json
import fs from 'node:fs';
import boxCacheManager from '../boxCacheManager.js';

export async function getMerged() {
  const relicData = fs.readFileSync('../../data/relicsdb.json', 'utf-8');
  const boxData = boxCacheManager.boxCache;

  // Process box data to key: value pairs
  const boxObject = {};
  for (const box of boxData) {
    boxObject[box.item] = box.amount;
  }

  const relicObject = JSON.parse(relicData);

  // Add box amounts to relicsdb.json
  for (const relic of relicObject.relics) {
    for (const part of relic.rewards) {
      if (boxObject[part.item]) {
        part.stock += boxObject[part.item];
      }
    }
  }

  // add for primes
  for (const prime of relicObject.primes) {
    if (boxObject[prime.item]) {
      prime.stock += boxObject[prime.item];
    }
  }

  return relicObject;
}