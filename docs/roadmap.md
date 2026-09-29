# Autonomous — Roadmap

Phases, not dates. Each phase below ends when its listed items are true
and confirmed in the register — not on a calendar. Nothing moves from
"planned" to "done" here until it also moves from `absent`/`unconfirmed`
to `stated` on the live site.

## Phase 0 — Foundations (current)

- [x] Public site live at autonomous.onl
- [x] Register pattern shipped: every external fact tracked as
      `stated`, `absent`, or `unconfirmed`
- [x] Live network panel reading block height, gas price, base fee, gas
      used, and block age directly from the Robinhood Chain RPC
- [x] Chain TVL panel, sourced from DeFiLlama
- [ ] Public documentation set (this repository)

## Phase 1 — Network confirmation

- [ ] Independent confirmation of Robinhood Chain network parameters
      beyond the initial client statement
- [ ] Publish a changelog for register updates, so every flip from
      `absent`/`unconfirmed` to `stated` has a visible history
- [ ] Open the repository for external review and issue reports

## Phase 2 — Contract deployment

- [ ] Publish final tokenomics parameters (supersedes the proposal in
      `docs/tokenomics.md`)
- [ ] Third-party review of the contract prior to deployment
- [ ] Deploy the contract; flip the register's `contractAddress` record
      from `absent` to `stated` with a source and a date
- [ ] Contract address and verification link appear in the site's
      contract slot — full address, click-to-copy, no countdown, no
      teaser state in between

## Phase 3 — Social & governance surface

- [ ] Announce official X and GitHub accounts; flip both from `absent`
      to `stated` the same day, in this repository and on the site
- [ ] Publish the treasury address and its governance rules
- [ ] Open a public proposal and voting flow, so "who decided what" is
      as checkable as "what block are we on"

## Phase 4 — Coordination layer

- [ ] Extend the register's discipline — one source of truth, absent is
      honest, nothing fabricated — from network facts to coordination
      facts: contributor credit, task completion, resource pools
- [ ] Public API for the register itself, so third parties can build on
      the same verified data the site uses

## A note on this list

Anything not checked off is not happening yet, regardless of how it's
described elsewhere. If a claim about Autonomous conflicts with what's
checked here or what the live register states, the register wins.
