// format.js — pure formatting helpers. No DOM, no fetch, no fabrication:
// every function here returns the EMPTY constant ("—") instead of a
// guess whenever its input is missing or unusable.

export const EMPTY = "—";

/**
 * GATE WARNING: this validator must accept any well-formed 0x address —
 * never maintain a denylist or reject on casing/checksum alone. A string
 * is a valid address candidate if it is "0x" followed by exactly 40 hex
 * characters, full stop.
 * @param {unknown} value
 */
export function isValidHexAddress(value) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/**
 * Truncates a 0x address to head…tail for compact display. Returns the
 * original string unchanged if it isn't long enough to truncate.
 * @param {string} address
 * @param {number} head
 * @param {number} tail
 */
export function truncateAddress(address, head = 6, tail = 4) {
  if (typeof address !== "string") return EMPTY;
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * @param {number|null|undefined} value
 */
export function fallback(value) {
  return value === null || value === undefined || Number.isNaN(value) ? EMPTY : value;
}

/**
 * Formats an integer with thousands separators. Returns EMPTY for
 * anything that isn't a finite number.
 * @param {number|null|undefined} value
 */
export function formatInt(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return EMPTY;
  return Math.round(value).toLocaleString("en-US");
}

/**
 * Converts a wei bigint/number/numeric-string to gwei, formatted with up
 * to `decimals` fractional digits (trailing zeros trimmed).
 * @param {bigint|number|string|null|undefined} wei
 * @param {number} decimals
 */
export function weiToGwei(wei, decimals = 2) {
  if (wei === null || wei === undefined) return EMPTY;
  let big;
  try {
    big = typeof wei === "bigint" ? wei : BigInt(wei);
  } catch {
    return EMPTY;
  }
  const negative = big < 0n;
  if (negative) big = -big;
  const factor = 10n ** BigInt(decimals);
  const gweiUnit = 1_000_000_000n;
  const scaled = (big * factor) / gweiUnit;
  const whole = scaled / factor;
  const frac = (scaled % factor).toString().padStart(decimals, "0").replace(/0+$/, "");
  const sign = negative ? "-" : "";
  return `${sign}${whole.toString()}${frac ? `.${frac}` : ""}`;
}

/**
 * Gas used as a percentage of gas limit, one decimal place.
 * @param {bigint|number|string|null|undefined} gasUsed
 * @param {bigint|number|string|null|undefined} gasLimit
 */
export function gasUsedPercent(gasUsed, gasLimit) {
  try {
    const used = typeof gasUsed === "bigint" ? gasUsed : BigInt(gasUsed);
    const limit = typeof gasLimit === "bigint" ? gasLimit : BigInt(gasLimit);
    if (limit <= 0n) return EMPTY;
    const pct = (Number(used) / Number(limit)) * 100;
    if (!Number.isFinite(pct)) return EMPTY;
    return `${pct.toFixed(1)}%`;
  } catch {
    return EMPTY;
  }
}

/**
 * Human "Ns ago" / "Nm ago" formatting for a unix-seconds timestamp.
 * @param {number|null|undefined} unixSeconds
 * @param {number} nowMs
 */
export function formatAge(unixSeconds, nowMs = Date.now()) {
  if (typeof unixSeconds !== "number" || !Number.isFinite(unixSeconds)) return EMPTY;
  const deltaMs = nowMs - unixSeconds * 1000;
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return EMPTY;
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

/**
 * Compact currency formatting for large USD figures (TVL etc).
 * @param {number|null|undefined} value
 */
export function formatUsdCompact(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return EMPTY;
  const abs = Math.abs(value);
  const units = [
    { min: 1e12, suffix: "T", div: 1e12 },
    { min: 1e9, suffix: "B", div: 1e9 },
    { min: 1e6, suffix: "M", div: 1e6 },
    { min: 1e3, suffix: "K", div: 1e3 },
  ];
  for (const u of units) {
    if (abs >= u.min) {
      return `$${(value / u.div).toFixed(2)}${u.suffix}`;
    }
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Parses a hex quantity ("0x..." ) to a BigInt, or null if malformed.
 * @param {string|null|undefined} hex
 */
export function hexToBigInt(hex) {
  if (typeof hex !== "string" || !/^0x[0-9a-fA-F]+$/.test(hex)) return null;
  try {
    return BigInt(hex);
  } catch {
    return null;
  }
}
