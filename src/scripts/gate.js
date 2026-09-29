// gate.js — pure gating logic for the contract-address (CA) slot and any
// other "stated | absent | unconfirmed" controlled UI. No DOM here so it
// can run identically in the browser and in the Node gate checks.
//
// GATE WARNING: never blanket-reject a 0x hex string. The only shape
// check allowed is "0x" + 40 hex chars (see format.js#isValidHexAddress).
// A value that satisfies that shape is always accepted here — this file
// must not add extra denylists, checksum enforcement, or heuristics that
// would reject a legitimate address.

import { isValidHexAddress, truncateAddress, EMPTY } from "./format.js";

/**
 * @typedef {import("./register.js").Record} Record
 * @typedef {{
 *   state: "stated"|"absent"|"unconfirmed",
 *   inert: boolean,
 *   displayValue: string,
 *   copyValue: string|null,
 *   note: string|null,
 * }} CaView
 */

/**
 * Resolves how the CA slot should render for a given register record.
 * Exit behavior must be identical whether the record is absent or
 * stated — this function always returns a well-formed view, never
 * throws, and never fabricates a value.
 * @param {Record} record
 * @returns {CaView}
 */
export function resolveCaView(record) {
  if (!record || record.state === "absent") {
    return {
      state: "absent",
      inert: true,
      displayValue: "Not yet deployed",
      copyValue: null,
      note: "Contract has not been announced.",
    };
  }

  if (record.state === "unconfirmed") {
    const shaped = isValidHexAddress(record.value);
    return {
      state: "unconfirmed",
      inert: true,
      displayValue: shaped ? record.value : "Unconfirmed",
      copyValue: null,
      note: "Address seen but not yet confirmed by the register.",
    };
  }

  // state === "stated"
  if (isValidHexAddress(record.value)) {
    return {
      state: "stated",
      inert: false,
      displayValue: record.value,
      copyValue: record.value,
      note: null,
    };
  }

  // Stated but malformed: still never fabricate — surface as unconfirmed
  // shape rather than silently accepting or silently rejecting.
  return {
    state: "unconfirmed",
    inert: true,
    displayValue: record.value ? String(record.value) : EMPTY,
    copyValue: null,
    note: "Stated value does not match the 0x + 40 hex-char shape.",
  };
}

/**
 * Generic inert/active resolver reused for social + other link records.
 * @param {Record} record
 */
export function resolveLinkView(record) {
  const inert = !record || record.state !== "stated" || !record.url;
  return { inert, url: inert ? null : record.url };
}

export { truncateAddress };
