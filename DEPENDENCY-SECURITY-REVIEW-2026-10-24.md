# Dependency security repair — 2026-10-24

Repository: uscolective-byte/Trinity-antigravity.

## Changes
- Capacity, Integrations, Knowledge and PC Bridge Worker lockfiles resolve undici 7.30.1 via explicit scoped overrides.
- Removed Ganache and its bundled obsolete dependency tree from Tetrakis test tooling.
- Local ERC20 tests now use the official @foundry-rs/anvil 1.7.1 platform binary, pinned in the npm lockfile. It binds only 127.0.0.1 on an ephemeral port and chain 31337; no forks, public transactions, saved wallets or secrets are used.
- Contract-local npm install hooks are disabled: the official platform package already contains the native binary, and the generic package's shell-style hook is incompatible with Windows.
- solc remains exactly 0.8.24 and OpenZeppelin remains 5.1.0. tmp is overridden to 0.2.7. Solidity input line endings are normalized to LF so Windows checkouts reproduce the previous deployed bytecode metadata.
- The new GitHub workflow audits all 11 lockfiles, including development tooling, and exercises local ERC20 tests.

## Verified results
All 11 npm package-lock audits report zero vulnerabilities, including low severity. These are npm advisory results, not confirmation that GitHub has finished updating its Dependabot dashboard.
Tetrakis: 15 tests pass on Anvil, including deployed runtime comparison.
Capacity: 10 tests pass. Knowledge: 5 tests pass. PC Bridge: 2 tests pass. Integrations production dry-run build passes.
The freshly compiled creation bytecode and runtime bytecode exactly match the previous artifact. Runtime keccak256:
0x5db6aa4e0b155cc4eb54b45ce1ecde5ec0feb55c12e4fc75153b1615c5c9652c

No on-chain deployment or financial action was performed.

## Primary references
https://github.com/advisories/GHSA-4qv8-2p9j-2685
https://github.com/advisories/GHSA-848j-6mx2-7j84
https://www.npmjs.com/package/@foundry-rs/anvil
https://www.getfoundry.sh/anvil/index.html

## GitHub execution blocker
The first dependency-security workflow run (40092202075) did not execute any steps. Its public check-run annotation states: "The job was not started because your account is locked due to a billing issue." This is distinct from the successful local audit/test results. No payment or billing setting was changed.
