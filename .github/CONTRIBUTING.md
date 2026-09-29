# Contributing to Autonomous

Thanks for taking the time to look at this. Autonomous is a small,
deliberately plain codebase — a static site with no build framework and
no external runtime dependencies — and contributions are welcome,
especially ones that keep it that way.

## Before you start

- **Open an issue first** for anything beyond a typo fix or a small bug —
  a short description of the problem and your proposed approach saves
  everyone a rewritten pull request later.
- **Read `docs/whitepaper.md`** if your change touches the register,
  the live network panel, or anything described as a design principle
  there. The five rules below are not stylistic preferences; they're the
  reason this project exists in its current form.

## The rules that aren't optional

1. **Register pattern.** Every external fact (contract address, social
   account, chain identity, and anything like them) is one record in
   `src/scripts/register.js` with a state of `stated`, `absent`, or
   `unconfirmed`. Don't hardcode a fact anywhere else.
2. **Link rule.** A record only gets a clickable `href` if it's `stated`
   and has a URL. Never construct a link from a handle or a guess.
3. **Gate warning.** Address validation is a shape check (`0x` + 40 hex
   characters) — full stop. Don't add a denylist, a checksum requirement,
   or any other heuristic that could reject a legitimate address.
4. **Palette rule.** Color literals live only in `src/styles/tokens.css`.
   Every other stylesheet references a `var(--token)`. If you're adding a
   color sampled from a brand asset, include a provenance comment (source
   file, sampling method, pixel coordinate) the same way the existing
   tokens do.
5. **Never fabricate a number.** If a value can't be verified right now —
   an RPC call fails, an API doesn't have the data — render `—`, not a
   cached guess, a zero, or a placeholder that looks like real data.

## Local checks

```bash
npm run build   # copies src/ into dist/ and verifies every required file
npm run gates   # synthetic, offline checks — no real network, no real
                # timers, exits 0 whether the register is absent or stated
```

Run both before opening a pull request. `npm run gates` is intentionally
fast (well under 30 checks, a few seconds) — if a change makes it slower
or heavier, that's worth flagging in the PR description.

## Code style

- No build framework, no bundler, no runtime dependencies. If a change
  needs one, open an issue to discuss it before writing the code.
- Vanilla ES modules in `src/scripts/`, plain CSS custom properties in
  `src/styles/`. Keep pure logic (formatting, gating, register resolution)
  free of DOM access so it stays testable from `scripts/gates.mjs`.
- Match the existing comment density and naming — short, direct, no
  marketing language in code comments.

## What we won't merge

- Anything that hardcodes a fact the register doesn't have as `stated`.
- Anything that adds a color literal outside `tokens.css`.
- Anything that fabricates a number instead of showing `—`.
- Wallet-signing flows, custody of funds or keys, or any request for a
  private key, seed phrase, or credential. This site reads public data;
  it does not and will not ask for a signature.

## Reporting a problem

If you find a factual error — a stale register record, a broken RPC call,
a figure that doesn't match the chain — please open an issue rather than
a discreet fix; the register's whole point is a visible, checkable
history of what was true and when.
