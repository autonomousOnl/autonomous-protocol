// register.js — the single source of truth for every external fact this
// site displays. Each record has exactly one state: "stated", "absent",
// or "unconfirmed". Nothing outside this file should hardcode a fact
// value; everything else reads from here.
//
// This module has no DOM dependency so it can be imported by both the
// browser bundle and the Node gate checks.

/**
 * @typedef {"stated"|"absent"|"unconfirmed"} FactState
 * @typedef {{ state: FactState, value: any, url: string|null, source: string|null, asOf: string|null }} Record
 */

/** @type {Record<string, Record>} */
export const REGISTER = Object.freeze({
  contractAddress: Object.freeze({
    state: "absent",
    value: null,
    url: null,
    source: null,
    asOf: null,
  }),
  socialX: Object.freeze({
    state: "absent",
    value: null,
    url: null,
    source: null,
    asOf: null,
  }),
  socialGithub: Object.freeze({
    state: "absent",
    value: null,
    url: null,
    source: null,
    asOf: null,
  }),
  chainName: Object.freeze({
    state: "stated",
    value: "Robinhood Chain",
    url: null,
    source: "client statement",
    asOf: "2026-09-02",
  }),
  chainId: Object.freeze({
    state: "stated",
    value: 4663,
    hex: "0x1237",
    url: null,
    source: "client statement",
    asOf: "2026-09-02",
  }),
  rpcUrl: Object.freeze({
    state: "stated",
    value: "https://rpc.mainnet.chain.robinhood.com",
    url: "https://rpc.mainnet.chain.robinhood.com",
    source: "client statement",
    asOf: "2026-09-02",
  }),
});

export const STATES = Object.freeze(["stated", "absent", "unconfirmed"]);

/**
 * Returns true when a record is not in the "stated" state, i.e. it must
 * render inert (no href, no live value, disabled controls).
 * @param {Record} record
 */
export function isInert(record) {
  if (!record || !STATES.includes(record.state)) return true;
  return record.state !== "stated";
}

/**
 * LINK RULE: derive a display handle from a stored URL. Never construct
 * a URL from a handle — only the reverse. Returns null for anything that
 * isn't a stated record with a URL.
 * @param {Record} record
 */
export function deriveHandle(record) {
  if (!record || record.state !== "stated" || !record.url) return null;
  try {
    const u = new URL(record.url);
    const path = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    return path.length ? `@${path}` : u.hostname;
  } catch {
    return null;
  }
}

/**
 * LINK RULE: only a stated record gets an href. Everything else is
 * rendered as inert (no navigation).
 * @param {Record} record
 */
export function hrefFor(record) {
  if (!record || record.state !== "stated") return null;
  return record.url || null;
}
