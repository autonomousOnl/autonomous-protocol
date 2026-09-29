// tvl.js — reads Chain TVL for chain id 4663 from DeFiLlama's public,
// no-key-required API (https://api.llama.fi/chains). Read-only GET only.

export const DEFAULT_POLL_MS = 10 * 60_000;
export const DEFILLAMA_CHAINS_URL = "https://api.llama.fi/chains";
export const TARGET_CHAIN_ID = 4663;

/**
 * @typedef {{ ok: boolean, tvl: number|null, name: string|null, fetchedAt: number }} TvlSnapshot
 */

/**
 * Finds the DeFiLlama chain entry matching our chain id. Pure function so
 * it can be unit tested with a synthetic fixture array instead of a live
 * network response.
 * @param {any[]} chains
 * @param {number} chainId
 */
export function pickChainEntry(chains, chainId = TARGET_CHAIN_ID) {
  if (!Array.isArray(chains)) return null;
  return (
    chains.find((c) => Number(c?.chainId) === chainId) ||
    null
  );
}

/**
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<TvlSnapshot>}
 */
export async function fetchChainTvl(fetchImpl = fetch, timeoutMs = 10_000) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(DEFILLAMA_CHAINS_URL, {
      signal: controller ? controller.signal : undefined,
    });
    if (!res.ok) throw new Error(`DeFiLlama HTTP ${res.status}`);
    const chains = await res.json();
    const entry = pickChainEntry(chains, TARGET_CHAIN_ID);
    if (!entry || typeof entry.tvl !== "number") {
      return { ok: false, tvl: null, name: null, fetchedAt: Date.now() };
    }
    return { ok: true, tvl: entry.tvl, name: entry.name || null, fetchedAt: Date.now() };
  } catch {
    return { ok: false, tvl: null, name: null, fetchedAt: Date.now() };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * @param {(snapshot: TvlSnapshot) => void} onUpdate
 * @param {{ intervalMs?: number, fetchImpl?: typeof fetch, schedule?: typeof setInterval, clear?: typeof clearInterval }} [options]
 */
export function startTvlPolling(onUpdate, options = {}) {
  const {
    intervalMs = DEFAULT_POLL_MS,
    fetchImpl = fetch,
    schedule = setInterval,
    clear = clearInterval,
  } = options;

  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const snapshot = await fetchChainTvl(fetchImpl);
    if (!stopped) onUpdate(snapshot);
  };

  tick();
  const handle = schedule(tick, intervalMs);
  return () => {
    stopped = true;
    clear(handle);
  };
}
