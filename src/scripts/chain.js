// chain.js — reads live telemetry straight from the Robinhood Chain RPC.
// Read-only JSON-RPC calls only: eth_blockNumber, eth_gasPrice,
// eth_chainId, eth_getBlockByNumber("latest", false). No wallet, no
// signing, no write calls, no secrets.

import { hexToBigInt } from "./format.js";

export const DEFAULT_POLL_MS = 15_000;

let rpcId = 0;

/**
 * @param {string} rpcUrl
 * @param {string} method
 * @param {any[]} params
 * @param {typeof fetch} fetchImpl
 */
async function rpcCall(rpcUrl, method, params, fetchImpl, timeoutMs = 8000) {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
      signal: controller ? controller.signal : undefined,
    });
    if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message || "RPC error");
    return json.result;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * @typedef {{
 *   ok: boolean,
 *   blockNumber: bigint|null,
 *   gasPriceWei: bigint|null,
 *   baseFeeWei: bigint|null,
 *   gasUsed: bigint|null,
 *   gasLimit: bigint|null,
 *   timestamp: number|null,
 *   chainIdHex: string|null,
 *   fetchedAt: number,
 * }} ChainStats
 */

/**
 * Fetches one snapshot of chain telemetry. Never throws — on any failure
 * it returns ok:false with every field null so callers can render "—"
 * instead of fabricating a value.
 * @param {string} rpcUrl
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<ChainStats>}
 */
export async function fetchChainStats(rpcUrl, fetchImpl = fetch) {
  try {
    const [blockNumberHex, gasPriceHex, chainIdHex, block] = await Promise.all([
      rpcCall(rpcUrl, "eth_blockNumber", [], fetchImpl),
      rpcCall(rpcUrl, "eth_gasPrice", [], fetchImpl),
      rpcCall(rpcUrl, "eth_chainId", [], fetchImpl),
      rpcCall(rpcUrl, "eth_getBlockByNumber", ["latest", false], fetchImpl),
    ]);

    return {
      ok: true,
      blockNumber: hexToBigInt(blockNumberHex),
      gasPriceWei: hexToBigInt(gasPriceHex),
      baseFeeWei: block ? hexToBigInt(block.baseFeePerGas) : null,
      gasUsed: block ? hexToBigInt(block.gasUsed) : null,
      gasLimit: block ? hexToBigInt(block.gasLimit) : null,
      timestamp: block ? Number(hexToBigInt(block.timestamp)) : null,
      chainIdHex: chainIdHex || null,
      fetchedAt: Date.now(),
    };
  } catch {
    return {
      ok: false,
      blockNumber: null,
      gasPriceWei: null,
      baseFeeWei: null,
      gasUsed: null,
      gasLimit: null,
      timestamp: null,
      chainIdHex: null,
      fetchedAt: Date.now(),
    };
  }
}

/**
 * Starts polling the RPC on an interval, calling `onUpdate` with each
 * snapshot (including failures). Returns a stop function. The scheduling
 * primitive is injectable so tests can use a fake clock instead of
 * waiting on a real 15s timer.
 * @param {string} rpcUrl
 * @param {(stats: ChainStats) => void} onUpdate
 * @param {{ intervalMs?: number, fetchImpl?: typeof fetch, schedule?: typeof setInterval, clear?: typeof clearInterval }} [options]
 */
export function startChainPolling(rpcUrl, onUpdate, options = {}) {
  const {
    intervalMs = DEFAULT_POLL_MS,
    fetchImpl = fetch,
    schedule = setInterval,
    clear = clearInterval,
  } = options;

  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const stats = await fetchChainStats(rpcUrl, fetchImpl);
    if (!stopped) onUpdate(stats);
  };

  tick();
  const handle = schedule(tick, intervalMs);
  return () => {
    stopped = true;
    clear(handle);
  };
}
