# Trinity Security Foundation

Status: Priority 0 normative contract  
Owner: Basterix  
Applies to: Cloudflare Workers, MCP, PC Bridge, local daemons, D1, KV, R2, Workflows and external provider adapters

## Core invariant

`mutation requires evidenceable identity`

A mutation is accepted only when the server can independently prove who requested it, what capability authorized it, whether the authorization is current, which exact input was accepted, and which durable receipt records the outcome.

## Mandatory rules

1. Deny by default.
2. Grant least privilege through explicit capabilities.
3. Authenticate and authorize every mutation on the server.
4. Audit every accepted and rejected privileged operation.
5. Never place secrets in source, logs, ledgers, error bodies or artifacts.
6. Never return `completed` without verified outcome evidence.
7. Never deploy production without verified staging, review and fresh ACK.
8. Treat CORS, private URLs and obscurity as non-security controls.
9. Fail closed when identity, policy, audit storage or dependencies are unavailable.

## Canonical authorization envelope

Every write, dispatch, PC action, memory mutation and deployment request must resolve to this server-derived record:

```json
{
  "request_id": "uuid",
  "principal_id": "server-derived identity",
  "agent_id": "registered agent",
  "capability": "memory.write",
  "lease_id": "active bounded lease",
  "issued_at": "RFC3339 timestamp",
  "expires_at": "RFC3339 timestamp",
  "nonce": "single-use value",
  "idempotency_key": "caller supplied bounded key",
  "input_hash": "sha256 canonical request",
  "environment": "staging",
  "evidence_policy": "receipt-required"
}
```

Client-supplied identity is never authoritative. The server derives the principal from verified credentials and rejects mismatches.

## Authorization pipeline

`authenticate -> validate expiry -> reject replay -> resolve agent -> validate lease -> authorize capability -> enforce policy -> reserve idempotency key -> execute bounded operation -> persist audit receipt -> return truthful status`

Failure at any stage stops execution. An audit-storage failure blocks privileged mutation rather than silently continuing.

## MCP Bridge security gate

WORKER #2 cannot be completed until all conditions pass:

- No hardcoded or fallback credential exists in source, tests, launchers or logs.
- The daemon refuses to start when a protected credential is unavailable.
- HTTP MCP uses the supported JSON-RPC lifecycle and explicit authentication.
- General shell strings are not an exposed capability.
- PC operations use a finite allowlist with typed schemas, fixed executables and bounded arguments.
- Every mutating tool declares its required capability and maximum execution scope.
- Nonce/replay protection and idempotency conflict detection are enforced.
- Per-principal and per-capability rate limits are enforced.
- Request and response sizes, timeouts and concurrency are bounded.
- Security receipts never contain tokens, cookies, authorization headers or raw credentials.
- The bridge binds only to the intended interface and exposes no accidental network listener.
- Shutdown targets only the verified PID belonging to the bridge instance.

## Secret Guard

Approved secret locations are platform secret stores or OS-protected local storage. Environment variables may carry a secret only for the lifetime of the intended process and must not be printed.

Forbidden locations:

- Git-tracked files and test fixtures
- command-line arguments and process titles
- application, audit and deployment logs
- D1 ledger messages, KV values used as ordinary cache, R2 artifacts and generated reports
- browser storage accessible to page scripts

Secret scanning is required before every commit and deployment. A detected secret blocks the gate and triggers rotation; deleting it from the latest commit alone is insufficient.

## Audit Shield

Security events are append-only and include at minimum:

- `failed_auth`
- `permission_denied`
- `expired_lease`
- `replay_detected`
- `idempotency_conflict`
- `invalid_receipt`
- `policy_violation`
- `rate_limit_exceeded`
- `secret_exposure_detected`

Every record contains a server timestamp, principal when known, action, capability, environment, request hash, outcome and correlation ID. It contains no secret values.

Audit tables deny `UPDATE` and `DELETE` to application identities. Retention or legal erasure is a separate owner-authorized administrative workflow with its own evidence.

## Anti-spam and duplicate safety

- Canonicalize bounded request fields and compute a request hash.
- Require an idempotency key for every mutation.
- Repeated key plus identical hash returns the original receipt without repeating the operation.
- Repeated key plus different hash is an `idempotency_conflict` and is rejected.
- Apply rate limits per principal, IP risk class and capability; never rely only on IP.
- Queue depth and concurrency limits protect D1, KV, R2, Workflows and external providers.

## Anti-hijack agent model

Every agent has an immutable `agent_id`, explicit capabilities, trust state and bounded lease. An agent without the required capability or with an expired/revoked lease cannot execute the task. Trust score can reduce access but can never grant a capability absent from policy.

## Environment gates

| Operation | Required proof |
| --- | --- |
| Read | classified endpoint and bounded query |
| Write | authenticated principal, capability, lease, idempotency and audit receipt |
| Deploy staging | immutable commit, green tests and deployment receipt |
| Deploy production | verified staging, independent review, fresh ACK and matching immutable commit |

Production credentials cannot be reused by staging. Staging must not inherit production schedules or writable production data bindings.

## Acceptance evidence

Security completion requires all of the following:

1. Unit tests for authorization, capabilities, lease expiry, replay and idempotency.
2. Adversarial tests for missing/invalid credentials, payload smuggling, traversal, command injection, oversized bodies and request bursts.
3. Secret scan with zero findings in tracked content and generated artifacts.
4. Dependency audit with recorded tool version and zero unresolved critical/high findings.
5. Live staging receipts proving unauthorized mutation is rejected and authorized bounded mutation produces an append-only audit receipt.
6. Independent review and fresh ACK.

Passing functional tests alone is not security evidence.
