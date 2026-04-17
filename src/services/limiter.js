/**
 * Generic Discord API Fetcher that respects ratelimits.
 */

let globalNextAllowedAt = 0;
const bucketRatelimits = new Map();
const lastLogTime = new Map();

function throttledLog(key, message) {
    const now = Date.now();
    if (!lastLogTime.has(key) || now - lastLogTime.get(key) > 60000) { // Log once per minute per key
        console.warn(message);
        lastLogTime.set(key, now);
    }
}

/**
 * A simple fetch wrapper that respects Discord ratelimits.
 * @param {string} url 
 * @param {RequestInit} options 
 * @returns {Promise<Response>}
 */
export async function discordFetch(url, options = {}) {
    const now = Date.now();
    
    // Check global ratelimit - return immediately if limited
    if (now < globalNextAllowedAt) {
        throttledLog('global', `[RATELIMIT] Global limit active. Skipping request.`);
        return { 
            status: 429, 
            ok: false, 
            headers: new Headers({ 'retry-after': (globalNextAllowedAt - now) / 1000 }),
            text: async () => 'Global ratelimit active',
            json: async () => ({ error: 'Global ratelimit' })
        };
    }

    // Identify bucket and return immediately if limited
    const bucketKey = url.split('?')[0];
    const bucketResetAt = bucketRatelimits.get(bucketKey) || 0;
    if (now < bucketResetAt) {
        throttledLog(bucketKey, `[RATELIMIT] Bucket limit active for ${bucketKey}. Skipping request.`);
        return { 
            status: 429, 
            ok: false, 
            headers: new Headers({ 'retry-after': (bucketResetAt - now) / 1000 }),
            text: async () => 'Bucket ratelimit active',
            json: async () => ({ error: 'Bucket ratelimit' })
        };
    }

    const response = await fetch(url, options);

    // Read ratelimit headers
    const remaining = response.headers.get('x-ratelimit-remaining');
    const resetAfter = response.headers.get('x-ratelimit-reset-after'); // Seconds
    const globalLimit = response.headers.get('x-ratelimit-global');

    if (globalLimit) {
        const wait = resetAfter ? parseFloat(resetAfter) * 1000 : 1000;
        globalNextAllowedAt = Date.now() + wait;
    } else if (remaining === '0' && resetAfter) {
        const wait = parseFloat(resetAfter) * 1000;
        bucketRatelimits.set(bucketKey, Date.now() + wait);
    }

    if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        throttledLog(bucketKey, `[RATELIMIT] 429 encountered for ${url}. Blocks for ${retryAfter || '??'}s`);
        return response; // Return the 429 response to let caller handle it gracefully
    }

    return response;
}

export function getLimiterStats() {
    const now = Date.now();
    const activeBuckets = [];
    bucketRatelimits.forEach((resetAt, key) => {
        if (resetAt > now) {
            activeBuckets.push({ key, resetIn: ((resetAt - now) / 1000).toFixed(1) + 's' });
        }
    });

    return {
        globalNextAllowedAt: globalNextAllowedAt > now ? ((globalNextAllowedAt - now) / 1000).toFixed(1) + 's' : '0s',
        activeBuckets
    };
}
