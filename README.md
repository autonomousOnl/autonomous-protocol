# Autonomous

**An open coordination protocol on Robinhood Chain.**

Autonomous is a small, honest piece of infrastructure: a public page that reads
live network state directly from the chain and keeps every external claim —
the contract address, the social accounts, the chain itself — in a single
open register with one of three states: `stated`, `absent`, or `unconfirmed`.
Nothing is shown as fact until it can be sourced, and nothing is ever typed in
by hand where a live read is possible.

Live at **[autonomous.onl](https://autonomous.onl)**.

## Network

| Field | Value |
| --- | --- |
| Chain | Robinhood Chain |
| Chain ID | `4663` (`0x1237`) |
| RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Source | Client statement, batch-level, 2026-09-02 |

The live network panel on the site reads block height, gas price, base fee,
gas used, and block age directly from the RPC above every 15 seconds, and
chain TVL from DeFiLlama every 10 minutes. Both are public, read-only, and
require no API key.

## Contract

```
Not yet deployed
```

The contract slot at the top of the site is real, not decorative — it is
wired up and ready to render a full address, with copy-to-clipboard, the
moment a contract is deployed and the register is updated. Until then it
stays visibly, honestly inert.

## Social

Autonomous has not announced official social accounts yet. The icons in the
header are real, rendered, and inert — no placeholder handles, no invented
links. This document and the site will be updated the same day any account
is confirmed.

- **X** — not yet announced
- **GitHub** — not yet announced

## Documentation

- [`docs/whitepaper.md`](docs/whitepaper.md) — protocol overview and vision
- [`docs/tokenomics.md`](docs/tokenomics.md) — proposed token structure and distribution
- [`docs/roadmap.md`](docs/roadmap.md) — development phases

## Repository layout

```
src/        editable site source (HTML, CSS, ES modules)
scripts/    build.mjs (src → dist) and gates.mjs (fast synthetic checks)
dist/       the complete, deployable build output
brand/      source brand assets
docs/       protocol documentation
```

## Local development

```bash
npm run build   # copies and verifies src/ into dist/
npm run gates   # fast synthetic checks — register logic, formatting,
                # palette provenance, tap targets, repo hygiene
```

Both commands are dependency-free and run entirely offline against
synthetic fixtures; neither one touches the production register or makes a
real network call.

## Contributing

See [`.github/CONTRIBUTING.md`](.github/CONTRIBUTING.md).

## License

[MIT](LICENSE).
