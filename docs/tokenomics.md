# Autonomous — Tokenomics (Proposed)

> **Status: proposed, not deployed.** Every figure below is a design
> parameter, not a live fact. The register on autonomous.onl lists the
> contract as `absent`. Nothing here is an offer, a promise, or financial
> advice — it's the current thinking on structure, published so it can be
> reviewed before anything is finalized. If this document and the live
> register ever disagree, the register is correct.

## 1. Purpose of a token here

A coordination protocol needs a way to represent claims: who contributed
what, who holds a say in a decision, who has a stake in an outcome. A token
is one mechanism for making those claims transferable and checkable
on-chain instead of tracked in a private ledger. That's the only role it's
designed to play — a coordination and governance instrument, not a yield
product.

## 2. Proposed supply structure

| Allocation | Share | Notes |
| --- | --- | --- |
| Community & ecosystem | 40% | Grants, contributor rewards, task incentives |
| Treasury | 25% | Held under on-chain governance, not a private wallet |
| Contributors & early builders | 15% | Subject to vesting, see §3 |
| Liquidity & network bootstrap | 12% | Deployed only alongside a stated, audited contract |
| Reserve | 8% | Unallocated at launch; requires a governance vote to release |

These shares are a starting proposal for discussion, not a finalized cap
table. They will be revised in the open before any contract is deployed,
and the final, deployed parameters will be published as a `stated` record
in the register — not just in this document.

## 3. Vesting, in principle

The intent is straightforward and deliberately unglamorous:

- Contributor and early-builder allocations vest over time rather than
  unlocking at launch, so incentives stay aligned with work that's
  actually shipped.
- Treasury and reserve allocations move only through a recorded,
  checkable governance action — never a discretionary transfer.
- No allocation is designed to unlock in a way that isn't visible on-chain
  before it happens.

Exact vesting schedules (cliff length, release cadence) are still being
worked out and will be published here — and reflected in the deployed
contract's own terms — before launch, not after.

## 4. What this document is not

- It is not a whitepaper for a live asset. There is no live asset yet.
- It is not a guarantee of future value, liquidity, or exchange listing.
- It is not investment advice, and nobody associated with Autonomous is
  offering any.

## 5. How this becomes real

The moment a contract is deployed, its address moves from `absent` to
`stated` in the register with a source and a date, this document is
updated to match the deployed parameters exactly, and the difference
between "proposed" and "live" disappears. Until then, treat every number
above as a draft.
