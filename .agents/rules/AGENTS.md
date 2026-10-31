# Trinity Sovereign Ecosystem & Triad Rules (Trinity + GPT/Codex + Antigravity)

- Always communicate with the owner (Sabo Ivan / Basterix) in Slovak.
- Canonical repository: `C:\Users\saboi\Trinity-antigravity` (`main` branch).
- **Environments & Strict Resource Separation**:
  - **Development**: Worker `trinity-development` (`https://auru.dev`), D1 `trinity-development` (`1cce5249-e044-4c93-868c-0df534a778b5`), KV `759143cfa6fb44d6a0f4c8e4951945c8`, R2 `trinity-development-artifacts`, Workflow `trinity-development-operations`.
  - **Production**: Worker `trinity` (`https://auru.space`), D1 `trinity-v03` (`ca8ea24e-f7db-431e-b8bf-97f713ae4533`), KV `0b92ed2717d742daa860f1827797297f`, R2 `trinity-artifacts`, Workflow `trinity-operations`.
  - Never share D1, KV, R2, or Workflow IDs between `development` and `production` (`source-environments.test.mjs`).
- **29 Bound Cloudflare Workers on Trinity**:
  - 10× AURA specialists (`AURA_ANALYZER`, `AURA_ARCHITECT`, `AURA_CODEGEN`, `AURA_DEPLOYER`, `AURA_EVOLVER`, `AURA_MEMORY`, `AURA_OPTIMIZER`, `AURA_PLANNER`, `AURA_SENTINEL`, `AURA_TESTER` + aliases `admin`, `admino`, `Trinity`).
  - 8× Trinity Core workers (`CORE`, `BUILDER`, `DISPATCHER`, `CONNECTORS`, `GUARDIAN`, `MEMORY`, `SENTINEL`, `SKILLS`).
  - 8× Specialized & RPC workers (`KNOWLEDGE_SERVICE`, `CAPACITY_SERVICE`, `INTEGRATIONS_SERVICE`, `PC_BRIDGE_SERVICE`, `PC_BRIDGE_V2`, `AUDIT_SERVICE`, `JERICHO_SERVICE`, `CHAT_INFERENCE_SERVICE`).
- **Truth Policy 2.0 & Guarded Rollout**:
  - Run `npm run check` (`436/436` tests across `Trinity`, `Audit-Worker`, `Capacity-Worker`, `Jericho-Worker`) before deploying.
  - Deploy `development` (`https://auru.dev`) first with `--tag <git-sha>` and verify with `node Trinity/scripts/verify-deployment.mjs https://auru.dev --version-id <id>`, then deploy and verify `production` (`https://auru.space`).
  - Never print, log, or commit plaintext secrets, `.credentials/*.dpapi`, or API keys.
