# Trinity operations: verified code versus live state

## Current evidence

The repository configures PC_BRIDGE_V2 and PC_BRIDGE_SERVICE bindings, scheduled health checks every 30 minutes, structured audit events and observability. Bindings and tests do not prove live connectivity. Separate development infrastructure, current PC connection, IAM/MFA and provider credentials require account-side verification. GitHub hosted jobs are blocked by account billing as observed on 2026-10-14.

Wrangler configuration files are the versioned nonsecret manifest. Keep credential values exclusively in platform secret storage; do not mirror gateway secrets into ordinary KV or the repository.

## PC Bridge incident procedure

1. Record the observation timestamp and last successful heartbeat. Read authenticated Trinity `check_services` / `pc_status` MCP results. Distinguish an available gateway from a fresh connected PC.
2. Check public bridge `/health`, then authenticated bridge `/v1/status` from an authorized client. Never include secrets in URLs, screenshots or tickets.
3. On the PC, inspect Local Gateway process and recent connection errors. Check outbound network access and matching credential names. Restart the known gateway process only; do not disable its allowlist or open router ports.
4. Recheck a new heartbeat and perform a permitted read-only operation. A queued action, screenshot from an old session or successful health response alone does not prove task execution.

## Secret rotation

Inventory which gateway and bridge component uses each credential before changing it. Stage coordinated updates on both ends and verify fresh heartbeat. Current single-key validation does not provide overlapping versions: unattended rotation may disconnect the PC. Implement dual-key transition and expiry before enabling scheduled rotation. Account MFA is configured by the account owner; this document does not enable it.

## Backup and recovery

The direct deployment script creates an ignored private D1 SQL export before applying migrations. A local export is not an external replicated backup. Verify the D1 storage version and available Time Travel bookmark with Wrangler; retention depends on the plan. Never run a production restore automatically: it overwrites database state and cancels in-flight queries. Test restore on isolated data before choosing an external encrypted backup destination and retention policy.

References: https://developers.cloudflare.com/d1/reference/time-travel/

## Next delivery gates

First obtain valid deployment access, verify the staging/production resource separation, then deploy and capture authenticated readiness, schema and provider receipts. Only afterwards enable five-minute monitoring and choose an explicit alert destination. No Slack/email messages, IAM changes, MFA changes, external backup uploads, secret rotation or rollback have been executed by creating this runbook.
