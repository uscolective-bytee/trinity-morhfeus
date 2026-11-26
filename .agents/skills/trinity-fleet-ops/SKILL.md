---
name: trinity-fleet-ops
description: >-
  Inspect and safely operate Trinity 11 Cloudflare Workers, Secrets Store,
  D1, KV, R2, AI and integrations. Use for staging and production work.
  Prefer proof of runner, permissions, isolation and deployment receipts.
---

# Trinity Fleet Operations — safe rollout

Use the dedicated Cloudflare Secrets Store skill in
.agents/skills/cloudflare-secrets-store/SKILL.md before binding credentials.
Source of truth: Trinity/wrangler.jsonc, not historical development screenshots.

## Preflight (PowerShell 7 / Antigravity / Codex)

~~~powershell
Set-Location C:\Users\saboi\Trinity-antigravity
git status --short
node Trinity/scripts/secrets-store-doctor.mjs
node Trinity/scripts/cloudflare-env-audit.mjs --strict
npm run check
~~~

A failing isolation audit is a genuine blocker. Currently some D1/KV/R2
identifiers are shared between staging and production. Do not run state-
changing staging tests against those until separate resources are verified.

## Wrangler environments

- Production auru.space: default config, Worker trinity.
- Staging auru.dev: Wrangler environment **staging**, Worker trinity-staging.
- Older docs mention development or trinity-development; these are historical,
  **not instructions to invent or deploy an environment**.
- Do not infer live version or external connection from configuration.

After successful checks and authorization:

~~~powershell
Set-Location C:\Users\saboi\Trinity-antigravity\Trinity
node scripts/build-mcp-app.mjs
npx wrangler deploy --env staging --dry-run
~~~

Actual staging deploy requires explicit approved access and verified
storage isolation, then post-deploy health/readiness and commit metadata.
Production deployment is a separate, later action after staging evidence.
Do not run deploy:all, enable all plugins, apply D1 migrations, alter secrets
or force-push simply because the owner asked for a general repair.

## Evidence

Record confirmed tests, deployment ID, git SHA, environment and actual
service-health results in TEAM-HANDOFF.md (CLAIM → UPDATE → HANDOFF).
CI run created is not CI run succeeded. Runner 0 and steps 0 is not tested.
PC offline means no Antigravity local install or command execution occurred.

References:
https://developers.cloudflare.com/workers/wrangler/configuration/
https://developers.cloudflare.com/secrets-store/integrations/workers/
