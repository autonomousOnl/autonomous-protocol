// main.js — wires the static markup to live data. This file is the only
// place that touches the DOM for data rendering; register.js, format.js,
// gate.js, chain.js and tvl.js stay pure so the Node gate checks can
// import them directly.

import { REGISTER } from "./register.js";
import { startChainPolling } from "./chain.js";
import { startTvlPolling } from "./tvl.js";
import { initAllCopyButtons } from "./copy.js";
import { initReveal } from "./reveal.js";
import { initTilt } from "./tilt.js";
import { showToast } from "./toast.js";
import { weiToGwei, formatInt, gasUsedPercent, formatAge, formatUsdCompact, EMPTY } from "./format.js";

const STAT_IDS = ["stat-blocknumber", "stat-gasprice", "stat-basefee", "stat-gasused", "stat-blockage"];

let lastChainOk = null; // null = no reading yet; edge-triggers the reconnect toast

function setStat(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  const changed = el.textContent !== text && el.textContent !== "";
  el.textContent = text;
  el.dataset.empty = text === EMPTY ? "true" : "false";
  delete el.dataset.loading;
  if (changed) {
    el.classList.remove("is-ticking");
    void el.offsetWidth; // restart the tick animation
    el.classList.add("is-ticking");
  }
}

function setFoot(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function renderChainStats(stats) {
  setStat("stat-blocknumber", stats.blockNumber !== null ? formatInt(Number(stats.blockNumber)) : EMPTY);
  setStat("stat-gasprice", stats.gasPriceWei !== null ? `${weiToGwei(stats.gasPriceWei)} gwei` : EMPTY);
  setStat("stat-basefee", stats.baseFeeWei !== null ? `${weiToGwei(stats.baseFeeWei)} gwei` : EMPTY);
  setStat(
    "stat-gasused",
    stats.gasUsed !== null && stats.gasLimit !== null ? gasUsedPercent(stats.gasUsed, stats.gasLimit) : EMPTY
  );
  setStat("stat-blockage", stats.timestamp !== null ? formatAge(stats.timestamp) : EMPTY);

  const foot = stats.ok ? "Live · refreshed just now" : "RPC unreachable — retrying";
  STAT_IDS.forEach((id) => setFoot(`${id}-foot`, foot));

  const chainFoot = document.getElementById("stat-chainid-foot");
  if (chainFoot) {
    if (stats.chainIdHex) {
      const liveId = parseInt(stats.chainIdHex, 16);
      chainFoot.textContent = Number.isFinite(liveId) && liveId === REGISTER.chainId.value
        ? "Matches live RPC"
        : `RPC reports chain ${Number.isFinite(liveId) ? liveId : EMPTY}`;
    } else {
      chainFoot.textContent = "Awaiting RPC confirmation";
    }
  }

  const updated = document.getElementById("network-updated");
  if (updated) updated.textContent = stats.ok ? "Refreshes every 15s" : "Reconnecting…";

  // Edge-triggered, not level-triggered: one toast per state change, never
  // one every 15s while a real outage is ongoing.
  if (lastChainOk !== null && stats.ok !== lastChainOk) {
    showToast(stats.ok ? "Reconnected to Robinhood Chain" : "RPC unreachable — retrying every 15s");
  }
  lastChainOk = stats.ok;
}

function renderTvl(snapshot) {
  setStat("stat-tvl", snapshot.ok ? formatUsdCompact(snapshot.tvl) : EMPTY);
  setFoot(
    "stat-tvl-foot",
    snapshot.ok ? "via DeFiLlama · refreshed just now" : "via DeFiLlama · not indexed yet"
  );
}

function init() {
  initReveal();
  initAllCopyButtons();
  initTilt();

  document.addEventListener("autonomous:copied", (event) => {
    const value = event.detail?.value || "";
    const label = /^0x[0-9a-fA-F]{40}$/.test(value)
      ? "Copied contract address"
      : /^https?:\/\//.test(value)
        ? "Copied RPC endpoint"
        : "Copied";
    showToast(label);
  });

  const rpc = REGISTER.rpcUrl;
  if (rpc.state === "stated" && rpc.value) {
    startChainPolling(rpc.value, renderChainStats);
  }
  startTvlPolling(renderTvl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
