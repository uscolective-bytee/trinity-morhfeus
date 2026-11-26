# Trinity environment

This branch includes a Node.js 22 development container for VS Code Dev Containers or GitHub Codespaces. It does not change the network policy of the ChatGPT execution environment. Codespaces availability depends on the account's current billing and access; a local container does not depend on GitHub Actions.

Check out branch `codex/trinity-integrations-verified-2026-10-14`. On a PC with Docker and VS Code Dev Containers, open the repository and select **Dev Containers: Reopen in Container**. Dependency installation runs automatically. Creating a Codespace or container has not been performed or verified here.

Inside the container, from repository root:

```bash
bash scripts/trinity-environment.sh check
bash scripts/trinity-environment.sh login
bash scripts/trinity-environment.sh deploy
```

On an existing Linux/WSL machine with Node.js 22+, first run `bash scripts/trinity-environment.sh setup`. No credentials are written into repository files. OAuth login requires user approval in Cloudflare. Deployment tests first, checks existing Worker access, saves a private ignored production D1 backup, deploys Knowledge and Integrations Workers, applies tracked D1 migrations and deploys Trinity. Backups may contain private data; retain them securely outside public repositories.

The integration Worker needs `FIREBASE_SERVICE_ACCOUNT_JSON` and `FIRECRAWL_API_KEY` via `wrangler secret put`, run inside Integrations-Worker. Existing Ollama credentials stay in Trinity's Cloudflare Secrets Store. Missing provider credentials do not imply a successful connection. Check authenticated integration status and perform real provider calls after deployment.

Verified here: shell syntax, JSON parsing, Node/dependency installation and local Worker build/tests. Not verified: container image startup, cloud workspace creation, production backup, migrations, deploy or live provider access.
