# Source reconciliation, 17 October 2026

Production `trinity` was serving 10.0.0 from Cloudflare version `2d1091dc-4736-4ec7-a9e7-67ee3695efbe`, while GitHub `main` at `afead17` still contained 9.4.3. The former local Morhfeus checkout also had many tracked files missing. Those files and existing changes were preserved; reconciliation happened in a clean checkout.

The recoverable local checkpoint `00d5f58` and the OneDrive 10.0.0 copies contain matching core sources. Building that recovered core reproduced the deployed JavaScript except for the imported refresh stylesheet filename. All eight UI module contents were accounted for; differences in styles remain ordinary source changes. The wider local inventory recorded 113 Wrangler configurations, including archives and prototypes. They are an inventory, not 113 production instances.

This change restores the already deployed 10.0.0 features onto current `main`, retains the newer integration wrapper sources and audit migrations, and uses migration `0034_trinity_2.sql` to avoid colliding with `0032_ci_audit.sql`. It does not deploy the optional Knowledge or Integrations workers or claim their external connections are configured.

Live service probes additionally found drift in `aura_architect`, `aura_codegen` and `aura_planner`. Their deployed action implementations were recovered and combined with the repository actions. The bounded wrapper now accepts both sets, requires idempotency for recovered writes and restores `aura.status` without AI calls. Existing approval checks remain enabled.

Release 10.1.0 uses a shared version constant and Cloudflare version metadata in health and MCP status. Every release is tagged with its exact source commit. Production routes only `auru.space`; development routes only `auru.dev` and uses its separate resources.

Validation before rollout: 138 core tests passed before the Aura changes, with zero reported dependency vulnerabilities. Additional Aura regression tests cover restored status and recovered action contracts. Live production test jobs requested Workers AI, Gemini and Ollama and all completed with `42`. Provider requests and their completion are recorded separately from local mocked tests. Final rollout receipts are recorded after deployment.

The MCP bridge uses the existing DPAPI-protected, scoped credential. The older Gemini CLI rejected personal-account authentication because Google moved those accounts to Antigravity CLI on 18 June 2026. The supported Antigravity CLI was installed from Google's published manifest with SHA-512 verification and successfully answered a prompt using the existing Google account sign-in. Its Trinity MCP server is configured separately from the Worker's Gemini API credential.

Production had a pre-existing `audit_log` table with a different schema. CI ingestion now uses `ops_ci_audit_log`; migration `0035_ci_audit_namespace.sql` also covers development environments that had already applied 0032/0033. No legacy audit table is renamed, cleared or dropped. A runtime regression test seeds the old schema before migrations and verifies its record survives.

The original account's GitHub Actions jobs could not start because GitHub reported a billing lock. This is recorded separately from code validation; no success status is manufactured and no repository protections are disabled. Local core tests, Audit Worker tests, gateway tests, PC Bridge tests, optional integration builds/runtime tests, and JSON policy validation are used as explicit evidence. New account creation is unnecessary for direct authenticated Cloudflare deployments.

References: [Cloudflare version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/), [Worker custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [Gemini CLI authentication](https://geminicli.com/docs/get-started/authentication/), [Gemini MCP](https://geminicli.com/docs/tools/mcp-server/).
