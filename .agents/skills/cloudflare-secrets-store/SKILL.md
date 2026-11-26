---
name: cloudflare-secrets-store
description: >-
  Configure and diagnose Cloudflare account Secrets Store bindings for Trinity
  Workers, Gemini, Copilot and Antigravity/Codex agents. Use before editing
  Wrangler configuration, adding provider keys or staging deployments.
---

# Cloudflare Secrets Store — Trinity + Google Antigravity

The authoritative repository is uscolective-byte/Trinity-antigravity.
Read AGENTS.md and TEAM-HANDOFF.md; claim files before editing.

## Three different mechanisms

1. Account-level Cloudflare Secrets Store securely holds encrypted values.
2. Per-Worker Secrets are injected as ordinary encrypted environment strings.
3. Account Secrets Store bindings are objects: **await env.BINDING.get()**.
   Never treat such a binding as a string, print its value, put credentials
   into a URL, expose them through a public API or store them in Git.

TRINITY_MASTER is the *Trinity controller name*, not a secret store name
or a universal admin token. Binding presence is not proof of provider login.

## Current configuration (metadata only)

| Worker | Binding | Cloudflare secret |
| --- | --- | --- |
| production auru.space | OLLAMA_SECRET | ollama |
| staging auru.dev | OLLAMA_SECRET | ollama |
| staging auru.dev | TRINITY_MASTER_GOOGLE | apigoogle |
| staging auru.dev | TRINITY_MASTER_COPILOT | copilot |

Use Trinity/wrangler.jsonc with environment name **staging**.
Do not follow older instructions using --env development.
The staging and production configs share some D1/KV/R2 resources,
so state-changing staging tests are blocked until isolation is verified.

## Read-only preflight (PowerShell)

~~~powershell
Set-Location C:\Users\saboi\Trinity-antigravity
node Trinity/scripts/secrets-store-doctor.mjs
node Trinity/scripts/cloudflare-env-audit.mjs --strict
~~~

Then inspect remote metadata *without displaying secret values*:

~~~powershell
Set-Location C:\Users\saboi\Trinity-antigravity\Trinity
npx wrangler secrets-store store list --remote
npx wrangler secrets-store secret list <STORE_ID> --remote --per-page 100
~~~

Find STORE_ID in the existing Wrangler config or Secrets Store dashboard.
The list is metadata only: names, status, scope, not plaintext values.
A Worker binding needs the secret scope **workers**. AI Gateway-only
scope is not enough. Binding deploy needs Account Secrets Store **Edit**
API permission, or the Super Administrator / Secrets Store Deployer role.

## Add new binding safely

1. Confirm actual account, existing store, secret name and scopes.
2. Use the correct staging-only config property: env.staging.secrets_store_secrets.
3. A binding record consists of three fields: binding, store_id, secret_name.
   Example mapping: TRINITY_MASTER_GOOGLE / existing store ID / apigoogle.
4. In trusted runtime code: await env.TRINITY_MASTER_GOOGLE.get().
   Prefer readTrinityMasterSecret(env, 'gemini') from
   Trinity/src/trinity-master-secrets.js for existing supported providers.
5. Do not add broad GitHub token GITHUBE_FINE_TOKEN or PC key BASTERIX
   to the public chat Worker. Use a separately authenticated privileged
   service with a scoped, auditable API instead.
6. Run the check and tests, then a dry-run:

~~~powershell
Set-Location C:\Users\saboi\Trinity-antigravity\Trinity
node --test tests/secrets-store-doctor.test.mjs tests/trinity-master-secrets.test.mjs tests/trinity-master-wrangler.test.mjs tests/trinity-master-provider-resolution.test.mjs
npx wrangler deploy --env staging --dry-run
~~~

Do a real staging deployment ONLY after storage isolation, successful CI,
valid permissions and a verified staging rollback plan. Production requires
a separate release review; never deploy while the checks are failing.

## Secrets policy

NEVER paste key material into ChatGPT, PowerShell history, logs, GitHub
commits, URLs, Wrangler vars or AI prompts. If exposed, rotate now.
Do not use --value in a secret-creation CLI command; it leaves plaintext
in command history. Use the dashboard or an interactive secure prompt.
Do not call secret get to display production secrets during troubleshooting.

Local Wrangler Secrets Store without --remote is separate from production:
local tests do NOT prove that remote keys are valid or have correct scopes.

## Who learns what

- Trinity can use allowlisted server-side .get() bindings without disclosing
  values. It reports configured separately from verified and connected.
- Antigravity / Codex can read THIS Git skill and execute its commands
  only if their Windows PC agent and Cloudflare identity are truly online.
- ChatGPT/Copilot/Claude connections need their own independent auth and
  scopes. A Gemini key cannot authorize those accounts.
- GitHub Action-based Morpheus sync uses its own GITHUB_TOKEN, not a key
  from Cloudflare Secrets Store; GitHub runners remain a separate blocker.

Record real execution receipts and update TEAM-HANDOFF.md; never mark
a step completed just because its instruction is in this skill.

## Official references

https://developers.cloudflare.com/secrets-store/integrations/workers/
https://developers.cloudflare.com/secrets-store/access-control/
https://developers.cloudflare.com/workers/wrangler/commands/secrets-store/
https://developers.cloudflare.com/workers/wrangler/configuration/
