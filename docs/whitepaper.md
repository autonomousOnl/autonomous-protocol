# Autonomous — Protocol Overview

*Working draft. This document describes intent and direction, not a
finished specification. Where it disagrees with the live register on
autonomous.onl, the register is correct.*

## 1. Why this exists

Most coordination happens off to the side of the systems meant to support
it: in chat threads, in spreadsheets, in someone's memory of what was
agreed last quarter. The record of who did what, who holds what, and what
was promised tends to live anywhere except the place people actually look.

Autonomous starts from a narrower, more mechanical question: what would it
look like if a coordination layer refused to say anything it couldn't
currently verify? Not a philosophy of transparency as a slogan, but as a
literal constraint on what the interface is allowed to render.

## 2. The register, as a design constraint

Every external fact Autonomous displays — a contract address, a social
account, a chain identity — is tracked in one register with exactly one of
three states:

- **stated** — sourced, dated, and rendered as live
- **absent** — not yet provided, rendered visibly inert, never invented
- **unconfirmed** — seen somewhere, not yet verified against the register

There is no fourth state where something is "probably true" or "coming
soon" dressed up as fact. A contract that hasn't been deployed reads
`Not yet deployed`, not a placeholder address, not a countdown, not a
teaser. This is a constraint on the builders as much as a promise to
everyone else.

## 3. Why Robinhood Chain

Autonomous runs on Robinhood Chain (chain ID `4663`). A coordination layer
is only as credible as the ledger underneath it — every action, transfer,
and permission needs a settlement layer that a third party can check
without asking anyone's permission first. Building against a public RPC
from day one, rather than a private indexer or a trusted API, is a
deliberate choice: it means the numbers on the site and the numbers on the
chain are the same numbers, checked the same way, by anyone.

## 4. What "autonomous" means here

Not autonomy from oversight — the opposite. The name refers to a system
that can state its own facts without a person manually updating a page
every time something changes. Block height, gas price, and network TVL
already update themselves, live, without a human in the loop. The longer
arc of the project is extending that same principle — read the source,
state only what's confirmed, never backfill a guess — to the parts of
coordination that are currently manual: proposals, resource pools,
contributor credit, and task completion.

## 5. Design principles

1. **One register, one source of truth.** A fact is stated once, with a
   date and a source, and referenced everywhere it appears.
2. **Absent is a valid, honest state.** A missing fact is not an error to
   paper over; it's information.
3. **No fabricated numbers.** If something can't be verified right now,
   the interface shows a dash, not a placeholder that looks like data.
4. **Verify without asking permission.** The RPC is public. The register
   is a plain file. Nothing requires trusting the team's word over the
   chain's.

## 6. What comes next

The roadmap in [`docs/roadmap.md`](roadmap.md) lays out the phases in
more concrete terms. In short: the network layer exists today: this
document, the register, and the live RPC read. What doesn't yet exist —
a deployed contract, a treasury, a governance surface — will be added to
the register the same day it's real, and not before.
