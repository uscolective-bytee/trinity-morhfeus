# Trinity Audit Worker (development)

Audit-only Cloudflare Worker for CI/CD; it has **no execution, deployment or PC Bridge API**. It accepts authenticated `POST /v1/audit` messages after checking an HMAC signature and validates all fields before parameterized D1 writes.

## Configuration

1. Create a **separate staging D1 database**, identify its real database ID, and bind it as `DB` in a local Wrangler config for this Worker. Never guess a D1 ID or reuse production by default.
2. Apply `Trinity/migrations/0032_ci_audit.sql` to that staging database after reviewing the migration.
3. Store `AUDIT_HMAC_KEY` as a **Worker secret**, minimum 32 characters. On GitHub, store the corresponding scoped key in `TRINITY_AUDIT_HMAC_KEY`; store the HTTPS endpoint in `TRINITY_AUDIT_URL`. These are not administrator or deployment tokens.
4. Set nonsecret Worker variable `AUDIT_ALLOWED_REPOS=uscolective-byte/trinity-morhfeus`.
5. Test via `node --test Audit-Worker/tests/*.test.mjs` from repository root.

Signed headers: `X-Trinity-Audit-Timestamp` is Unix seconds; `X-Trinity-Audit-Signature` equals `sha256=<HMAC_SHA256(timestamp + '.' + raw_json)>`. Reject timestamps older than five minutes. Use `event_id` UUID as idempotency key, and allowlisted commit/repo/trigger/status values.

`GET /health` gives readiness only; no secrets. For protection in depth, restrict network access with Cloudflare Access when feasible. **This code does not deploy anything automatically.**

`GET /openapi.json` documents the existing signed `/v1/audit` contract. There is no public audit-log read endpoint. UUID and ISO time are already generated in application code; the existing `ts TEXT` column is retained. Migration `0033_audit_time_index.sql` adds global chronological lookup alongside the existing repository/time and SHA indexes. Apply it after 0032 to the database actually bound to the Audit Worker, not an assumed production database.
