import relicCacheManager from '../../managers/relicCacheManager.js'

/** @type {import('../../other/types').Command} */
export default {
  name: "status",
  enabled: true,
  trigger: "message",
  execute: async (message) => {
    const allData = relicCacheManager.relicCache.primes.sort((a, b) => {
      return a.amount - b.amount;
    })
    message.reply(`${allData.length} Primes`);
  },
}