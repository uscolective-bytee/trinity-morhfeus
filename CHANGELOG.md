# CHANGELOG — TRINITY OMNI-CORE

## [11.0.0-omni-core] — 2026-11-01

### Security & Ring 0 Hardening (P0 / P1 Audit Remediation)
- **P0 Fix 1 (Zero Plain-Text Identity Spoofing):** `verifyTrinityIdentity()` v `Trinity/src/trinity-auth-core.js` a `Local-Gateway/src/trinity-auth-core.mjs` je plne fail-closed. Samotný textový e-mail, telefónne číslo alebo `windowsUser` bez kryptografického/OS dôkazu (`verifiedGoogleToken: true`, `verifiedWebhookSignature: true`, `osTokenVerified: true` + platný Windows SID) je okamžite zablokovaný ako `SPOOFED_UNVERIFIED_*_INPUT` (`403 ACCESS DENIED`).
- **P0 Fix 2 (Zero Synthetic Windows SID):** Odstránený syntetický fallback `S-1-5-21-BASTERIX-...`. Funkcia `inspectWindowsSession()` vyžaduje skutočný Windows SID formátu `/^S-1-5-21-\d+-\d+-\d+-\d+$/` získaný priamo zo systémového prístupového tokenu `[System.Security.Principal.WindowsIdentity]::GetCurrent()` a ignoruje podvrhnuteľné premenné prostredia (`process.env.USERNAME`).
- **P0 Fix 3 (Durable Atomic Nonce Vault):** `verifySignedConsentEnvelope()` v `Trinity/src/sovereign-lock.js` ukladá spotrebované jednorazové `nonce` atomicky do trvalého úložiska (`ops_consumed_nonces` v Cloudflare D1, KV `Mastermind` a lokálny Disk Vault), čím blokuje Replay útoky aj po reštarte procesu alebo medzi inštanciami Workera.

### Features & Architecture
- **Local System Bridge (Port 7788):** Pridaný obojsmerný lokálny most `system-bridge.js` (`Local-Gateway/src/system-bridge.mjs`) prepojený s `trinity-auth-core.mjs` a diagnostikou `OmniDev Studio`.
- **Edge Status Endpoint (`GET /api/status`):** Pridaný verejný stavový endpoint v `Trinity/src/index.js` pre `auru.dev` a `auru.space`.
- **OMNI-CORE Tool Registry Wiring:** Zaregistrované nástroje `sovereign_ledger_v3`, `sovereign_lock_check`, `truth_guard_verify`, `tmac_consensus`, `state_replay_provenance` a `omnidev_diagnose` do `Trinity/src/tools.js`, `Trinity/src/plugins.js`, `Trinity/src/registry.js`, `Trinity/src/skill-matrix.js` a `Trinity/src/engine.js`.
- **Documentation Overhaul:** Pridané štandardizované `@module TRINITY_OMNI_CORE` hlavičky a vytvorené súbory `ARCHITECTURE.md`, `API_REFERENCE.md`, `SOVEREIGN_CHARTER.md`, `CHANGELOG.md` a `DEPLOYMENT_RECEIPT.json`.
