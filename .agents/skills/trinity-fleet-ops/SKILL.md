---
name: trinity-fleet-ops
description: >-
  Manage, inspect, test, and deploy the Trinity 11.0 Cloudflare Worker fleet (29 bound workers, 150 trusted plugins, D1 databases, and Sovereign UI) across development (auru.dev) and production (auru.space). Use whenever working on Trinity chat, workers, bindings, skills, plugins, or deployments.
---

# Trinity Fleet Operations & Guarded Rollout

Use this skill when inspecting, testing, or deploying Trinity and her 29 Cloudflare Worker bindings.

## 1. Pre-Flight Verification & Full Test Suite

Run all 4 test suites from `C:\Users\saboi\Trinity-antigravity`:

```powershell
Set-Location C:\Users\saboi\Trinity-antigravity
npm run check
```

## 2. Enabling All 150 Trusted Plugins in D1

To ensure all 150 plugins (`CORE_PLUGINS` + `EXTENDED_PLUGINS`) are installed and enabled in both `trinity-development` and `trinity-v03`:

```powershell
Set-Location C:\Users\saboi\Trinity-antigravity
node scripts/enable-chat-tools.mjs development --apply
node scripts/enable-chat-tools.mjs production --apply
```

## 3. Guarded Rollout (`auru.dev` -> `auru.space`)

Always tag deployments with the exact 40-character Git commit SHA and verify `auru.dev` before `auru.space`:

```powershell
Set-Location C:\Users\saboi\Trinity-antigravity\Trinity
$sha = (git rev-parse HEAD).Trim()
node scripts/build-mcp-app.mjs
npx wrangler deploy --env development --tag $sha
node scripts/verify-deployment.mjs https://auru.dev --version-id <DEV_VERSION_ID>
npx wrangler deploy --env="" --tag $sha
node scripts/verify-deployment.mjs https://auru.space --version-id <PROD_VERSION_ID>
```
