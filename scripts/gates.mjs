#!/usr/bin/env node
// gates.mjs — fast, synthetic gate checks. Target: under 5 minutes,
// under 30 checks, no real network, no real timers, no per-viewport
// screenshot harness. Behavioral (absent/stated) checks use synthetic
// fixtures only — never the live production register.

import { strict as assert } from "node:assert";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveCaView } from "../src/scripts/gate.js";
import {
  isValidHexAddress,
  truncateAddress,
  fallback,
  formatInt,
  weiToGwei,
  gasUsedPercent,
  formatAge,
  formatUsdCompact,
  EMPTY,
} from "../src/scripts/format.js";
import { hrefFor, deriveHandle, STATES } from "../src/scripts/register.js";
import { fetchChainStats, startChainPolling, DEFAULT_POLL_MS as CHAIN_POLL_MS } from "../src/scripts/chain.js";
import { fetchChainTvl, pickChainEntry, startTvlPolling, DEFAULT_POLL_MS as TVL_POLL_MS } from "../src/scripts/tvl.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const distDir = path.join(root, "dist");

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
}

async function acheck(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed++;
    failures.push(name);
    console.log(`  FAIL ${name}\n       ${err.message}`);
  }
}

function fakeFetchFactory(byMethod, { ok = true } = {}) {
  return async (url, init) => {
    let method = null;
    try {
      method = init && init.body ? JSON.parse(init.body).method : null;
    } catch {
      /* GET request (DeFiLlama) — no body */
    }
    const result = method ? byMethod[method] : byMethod.__default;
    return {
      ok,
      status: ok ? 200 : 500,
      async json() {
        if (method) return { jsonrpc: "2.0", id: 1, result };
        return result;
      },
    };
  };
}

const nowSeconds = Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------------
console.log("\n[gates] 1. CA gate — synthetic fixtures (absent + stated must both exit clean)");

check("resolveCaView(absent fixture) is inert with no copy value", () => {
  const view = resolveCaView({ state: "absent", value: null, url: null });
  assert.equal(view.inert, true);
  assert.equal(view.state, "absent");
  assert.equal(view.copyValue, null);
  assert.equal(typeof view.displayValue, "string");
});

check("resolveCaView(stated fixture, valid address) is active with copy value", () => {
  const addr = "0x" + "a1b2".repeat(10); // 40 hex chars
  const view = resolveCaView({ state: "stated", value: addr, url: null });
  assert.equal(view.inert, false);
  assert.equal(view.state, "stated");
  assert.equal(view.copyValue, addr);
  assert.equal(view.displayValue, addr);
});

check("resolveCaView never throws on unconfirmed / malformed fixtures", () => {
  const a = resolveCaView({ state: "unconfirmed", value: "0x1234", url: null });
  assert.equal(a.inert, true);
  const b = resolveCaView({ state: "stated", value: "not-an-address", url: null });
  assert.equal(b.inert, true);
  const c = resolveCaView(undefined);
  assert.equal(c.inert, true);
});

check("GATE WARNING: isValidHexAddress is a shape rule, not a blanket 0x rejector", () => {
  // Accepts any well-formed 0x + 40 hex chars, case-insensitive...
  assert.equal(isValidHexAddress("0x" + "ab".repeat(20)), true);
  assert.equal(isValidHexAddress("0x" + "AB".repeat(20)), true);
  assert.equal(isValidHexAddress("0x" + "aB".repeat(20)), true);
  // ...but still requires the shape (not a blanket accept-everything either).
  assert.equal(isValidHexAddress("0x1234"), false);
  assert.equal(isValidHexAddress("not-hex-at-all"), false);
  assert.equal(isValidHexAddress(""), false);
});

// ---------------------------------------------------------------------
console.log("\n[gates] 2. LINK RULE — synthetic fixtures");

check("LINK RULE: absent record has no href/handle, stated record derives both from its URL", () => {
  const absentRec = { state: "absent", value: null, url: null };
  assert.equal(hrefFor(absentRec), null);
  assert.equal(deriveHandle(absentRec), null);

  const statedRec = { state: "stated", value: "handle", url: "https://x.com/example" };
  assert.equal(hrefFor(statedRec), "https://x.com/example");
  assert.equal(deriveHandle(statedRec), "@example");
});

check("STATES enum is exactly stated | absent | unconfirmed", () => {
  assert.deepEqual([...STATES].sort(), ["absent", "stated", "unconfirmed"]);
});

// ---------------------------------------------------------------------
console.log("\n[gates] 3. format.js — never fabricate, always fall back to —");

check("fallback + formatInt: EMPTY for anything unusable, real formatting otherwise", () => {
  assert.equal(fallback(null), EMPTY);
  assert.equal(fallback(undefined), EMPTY);
  assert.equal(fallback(Number.NaN), EMPTY);
  assert.equal(fallback(5), 5);
  assert.equal(formatInt(1234567), "1,234,567");
  assert.equal(formatInt(null), EMPTY);
});

check("weiToGwei + gasUsedPercent convert exactly and guard div-by-zero", () => {
  assert.equal(weiToGwei(1_000_000_000n), "1");
  assert.equal(weiToGwei(1_500_000_000n), "1.5");
  assert.equal(weiToGwei(null), EMPTY);
  assert.equal(gasUsedPercent(50n, 100n), "50.0%");
  assert.equal(gasUsedPercent(1n, 0n), EMPTY);
});

check("formatAge / formatUsdCompact / truncateAddress never fabricate a value", () => {
  assert.match(formatAge(nowSeconds), /^\d+s ago$/);
  assert.equal(formatAge(nowSeconds + 999), EMPTY); // future timestamp, never fabricate
  assert.equal(formatAge(null), EMPTY);
  assert.equal(formatUsdCompact(1_230_000), "$1.23M");
  assert.equal(formatUsdCompact(null), EMPTY);
  const addr = "0x" + "c".repeat(40);
  assert.equal(truncateAddress(addr), `${addr.slice(0, 6)}…${addr.slice(-4)}`);
  assert.equal(truncateAddress("short"), "short");
});

// ---------------------------------------------------------------------
console.log("\n[gates] 4. chain.js — synthetic RPC fixture, no real network");

await acheck("fetchChainStats aggregates a synthetic RPC fixture correctly", async () => {
  const fixture = fakeFetchFactory({
    eth_blockNumber: "0x64",
    eth_gasPrice: "0x3b9aca00",
    eth_chainId: "0x1237",
    eth_getBlockByNumber: {
      baseFeePerGas: "0x1dcd6500",
      gasUsed: "0x2710",
      gasLimit: "0x4e20",
      timestamp: "0x" + nowSeconds.toString(16),
    },
  });
  const stats = await fetchChainStats("https://fixture.invalid/rpc", fixture);
  assert.equal(stats.ok, true);
  assert.equal(stats.blockNumber, 100n);
  assert.equal(stats.gasPriceWei, 1_000_000_000n);
  assert.equal(stats.baseFeeWei, 500_000_000n);
  assert.equal(stats.gasUsed, 10_000n);
  assert.equal(stats.gasLimit, 20_000n);
  assert.equal(stats.chainIdHex, "0x1237");
  assert.equal(weiToGwei(stats.gasPriceWei), "1");
  assert.equal(gasUsedPercent(stats.gasUsed, stats.gasLimit), "50.0%");
});

await acheck("fetchChainStats never throws on a failing RPC — returns ok:false, all null", async () => {
  const brokenFetch = async () => {
    throw new Error("network down");
  };
  const stats = await fetchChainStats("https://fixture.invalid/rpc", brokenFetch);
  assert.equal(stats.ok, false);
  assert.equal(stats.blockNumber, null);
  assert.equal(stats.gasPriceWei, null);
});

await acheck("startChainPolling schedules a 15s interval via injected fake clock (no real timer)", async () => {
  let capturedMs = null;
  let clearedHandle = null;
  let updates = 0;
  const fixture = fakeFetchFactory({
    eth_blockNumber: "0x1",
    eth_gasPrice: "0x1",
    eth_chainId: "0x1237",
    eth_getBlockByNumber: { baseFeePerGas: "0x1", gasUsed: "0x1", gasLimit: "0x2", timestamp: "0x1" },
  });
  const fakeSchedule = (fn, ms) => {
    capturedMs = ms;
    return "handle-123";
  };
  const fakeClear = (handle) => {
    clearedHandle = handle;
  };
  const stop = startChainPolling(
    "https://fixture.invalid/rpc",
    () => updates++,
    { fetchImpl: fixture, schedule: fakeSchedule, clear: fakeClear }
  );
  assert.equal(capturedMs, CHAIN_POLL_MS);
  assert.equal(CHAIN_POLL_MS, 15_000);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(updates >= 1, "onUpdate should fire at least once from the immediate tick");
  stop();
  assert.equal(clearedHandle, "handle-123");
});

// ---------------------------------------------------------------------
console.log("\n[gates] 5. tvl.js — synthetic DeFiLlama fixture, no real network");

check("pickChainEntry finds chain 4663 when present, returns null when not indexed yet", () => {
  const chains = [
    { chainId: 1, name: "Ethereum", tvl: 999 },
    { chainId: 4663, name: "Robinhood Chain", tvl: 123456789 },
  ];
  const entry = pickChainEntry(chains, 4663);
  assert.ok(entry);
  assert.equal(entry.name, "Robinhood Chain");
  assert.equal(pickChainEntry([{ chainId: 1, tvl: 1 }], 4663), null);
});

await acheck("fetchChainTvl resolves a synthetic fixture without real network", async () => {
  const fixture = async () => ({
    ok: true,
    status: 200,
    async json() {
      return [{ chainId: 4663, name: "Robinhood Chain", tvl: 42_000_000 }];
    },
  });
  const snapshot = await fetchChainTvl(fixture);
  assert.equal(snapshot.ok, true);
  assert.equal(snapshot.tvl, 42_000_000);
});

await acheck("startTvlPolling schedules a 10-minute interval via injected fake clock", async () => {
  let capturedMs = null;
  const fixture = async () => ({ ok: true, async json() { return []; } });
  const stop = startTvlPolling(() => {}, {
    fetchImpl: fixture,
    schedule: (fn, ms) => {
      capturedMs = ms;
      return "h";
    },
    clear: () => {},
  });
  assert.equal(capturedMs, TVL_POLL_MS);
  assert.equal(TVL_POLL_MS, 600_000);
  stop();
});

// ---------------------------------------------------------------------
console.log("\n[gates] 6. Build artifact — dist/ presence + content hygiene");

const requiredDistFiles = [
  "index.html",
  "favicon.svg",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
  "styles/tokens.css",
  "styles/base.css",
  "styles/components.css",
  "styles/animations.css",
  "scripts/register.js",
  "scripts/format.js",
  "scripts/gate.js",
  "scripts/chain.js",
  "scripts/tvl.js",
  "scripts/copy.js",
  "scripts/reveal.js",
  "scripts/tilt.js",
  "scripts/toast.js",
  "scripts/main.js",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png",
  "assets/logo-mark.png",
  "assets/og-cover.jpg",
];

const BINARY_ASSET = /\.(png|jpg|jpeg)$/i;
let distFiles = {};
await acheck("dist/ exists with every required file (run `npm run build` first)", async () => {
  for (const rel of requiredDistFiles) {
    const full = path.join(distDir, rel);
    const buf = await fs.readFile(full);
    // Binary assets (png/jpg) just need to exist as a Buffer for the magic-byte
    // check below; text files are decoded so regex/JSON checks can run on them.
    distFiles[rel] = BINARY_ASSET.test(rel) ? buf : buf.toString("utf8");
  }
});

if (Object.keys(distFiles).length === requiredDistFiles.length) {
  check("static assets: favicon is a clean 32x32 SVG, manifest references real brand icons", () => {
    const svg = distFiles["favicon.svg"];
    assert.match(svg, /viewBox="0 0 32 32"/);
    assert.ok(!svg.includes("<!--"), "favicon.svg must not contain XML comments");
    const manifest = JSON.parse(distFiles["site.webmanifest"]);
    assert.equal(manifest.icons[0].src, "favicon.svg");
    assert.ok(manifest.icons.some((i) => i.src === "assets/icon-512.png"));
    for (const rel of ["assets/icon-192.png", "assets/icon-512.png", "assets/apple-touch-icon.png", "assets/logo-mark.png"]) {
      const sig = distFiles[rel].subarray(0, 8);
      assert.deepEqual([...sig], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], `${rel} is not a valid PNG`);
    }
    assert.deepEqual([...distFiles["assets/og-cover.jpg"].subarray(0, 3)], [0xff, 0xd8, 0xff], "og-cover.jpg is not a valid JPEG");
  });

  check("PALETTE RULE: literals live only in tokens.css; neutrals are achromatic, brand blues are pinned to their sampled provenance", () => {
    const colorLiteral = /#[0-9a-fA-F]{3,8}\b|rgba?\(/;
    for (const rel of ["styles/base.css", "styles/components.css", "styles/animations.css"]) {
      assert.equal(
        colorLiteral.test(distFiles[rel]),
        false,
        `${rel} must reference var(--token) only, found a literal color`
      );
    }
    const tokens = distFiles["styles/tokens.css"].toString("utf8");
    const grayHexes = tokens.match(/--gray-\d+:\s*(#[0-9a-fA-F]{6})/g) || [];
    assert.ok(grayHexes.length > 0, "expected --gray-* tokens");
    for (const line of grayHexes) {
      const hex = line.match(/#[0-9a-fA-F]{6}/)[0];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      assert.ok(r === g && g === b, `${line} is not achromatic (r=${r} g=${g} b=${b})`);
    }
    // Brand blues pinned to the k-means-sampled, pixel-snapped provenance
    // recorded in tokens.css (see its header comment for the sample).
    const expectedBrandBlues = {
      "--brand-blue-600": "#034ae4",
      "--brand-blue-500": "#0e63f8",
      "--brand-blue-400": "#2a7ffa",
      "--brand-blue-300": "#499af9",
      "--brand-blue-200": "#6cb5f9",
      "--brand-blue-100": "#8dcdf9",
    };
    for (const [name, hex] of Object.entries(expectedBrandBlues)) {
      assert.match(tokens, new RegExp(`${name}:\\s*${hex}\\b`), `${name} should equal its sampled provenance ${hex}`);
    }
    assert.match(tokens, /--gray-1000:\s*#090909\b/, "--gray-1000/--bg should equal its sampled provenance #090909");
  });

  check("no `ch` CSS unit anywhere in the shipped styles", () => {
    for (const rel of ["styles/tokens.css", "styles/base.css", "styles/components.css", "styles/animations.css"]) {
      assert.equal(/\b\d+(\.\d+)?ch\b/.test(distFiles[rel]), false, `${rel} uses a ch unit`);
    }
  });

  check("tap targets: icon/copy/button controls declare the 48px minimum token", () => {
    const css = distFiles["styles/components.css"];
    for (const selector of [".icon-btn", ".ca-copy", ".btn"]) {
      const block = css.slice(css.indexOf(selector), css.indexOf(selector) + 400);
      assert.match(block, /min-height:\s*var\(--tap-min\)/, `${selector} missing min-height tap target`);
    }
  });

  check("CA slot ships inert (absent) in the production build, full address never leaked", () => {
    const html = distFiles["index.html"];
    assert.match(html, /data-ca-shell/);
    assert.match(html, /data-state="absent"/);
    assert.match(html, /Not yet deployed/);
    assert.equal(/0x[0-9a-fA-F]{40}/.test(html), false, "no live-looking address should ship while CA is absent");
  });

  check("Social icons render but are inert (no href) while absent", () => {
    const html = distFiles["index.html"];
    const socialSpans = html.match(/<span class="icon-btn[^"]*" data-inert="true"[^>]*>/g) || [];
    assert.ok(socialSpans.length >= 4, "expected inert X + GitHub icons in header and footer");
    assert.equal(/<a[^>]+class="icon-btn"[^>]+href="https:\/\/x\.com/.test(html), false);
    assert.equal(/<a[^>]+class="icon-btn"[^>]+href="https:\/\/github\.com/.test(html), false);
  });

  check("chain identity is present and dated in the shipped page", () => {
    const html = distFiles["index.html"];
    assert.match(html, /Robinhood Chain/);
    assert.match(html, /4663/);
    assert.match(html, /2026.09.02/);
  });

  check("no secrets and no wallet-signing RPC methods ship anywhere in the bundle", () => {
    const secretLike = /(api[_-]?key|secret|private[_-]?key)\s*[:=]\s*["'][a-z0-9]{8,}/i;
    const signingMethods = /eth_sendTransaction|eth_sign\b|personal_sign|eth_requestAccounts|eth_signTypedData/;
    for (const [rel, content] of Object.entries(distFiles)) {
      assert.equal(secretLike.test(content), false, `${rel} looks like it embeds a secret`);
      if (rel.startsWith("scripts/")) {
        assert.equal(signingMethods.test(content), false, `${rel} references a signing RPC method`);
      }
    }
  });
} else {
  console.log("  (skipping content-hygiene checks — dist/ was incomplete)");
}

// ---------------------------------------------------------------------
console.log("\n[gates] 7. Repo hygiene");

await acheck("no CLAUDE.md and no .claude/ at project root", async () => {
  await assert.rejects(fs.access(path.join(root, "CLAUDE.md")));
  await assert.rejects(fs.access(path.join(root, ".claude")));
});

// ---------------------------------------------------------------------
console.log(`\n[gates] ${passed} passed, ${failed} failed (${passed + failed} total checks)`);
if (failed > 0) {
  console.log("Failed:", failures.join(", "));
  process.exitCode = 1;
}
