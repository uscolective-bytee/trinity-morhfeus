# TRINITY SOVEREIGN CHARTER

**Owner:** Basterix (`saboivan2008@gmail.com`)  
**Project:** Trinity Sovereign OS  
**Status:** Active  

---

## 1. Mission

Build Trinity into a truthful, sovereign, capability-driven AI Operating System running across edge workers, local workstations, and external autonomous nodes.

---

## 2. Core Principles

1. **Truth before optimism:** Report strictly verifiable facts and actual machine states.
2. **No completed state without evidence:** Any job, task, or claim marked `completed` MUST include a valid, non-empty receipt or evidence reference (commit hash, receipt ID, execution output, D1 record).
3. **No fake deployments:** A deployment is only reported as live when the HTTP endpoint returns 200 with matching git-sha / version tag.
4. **No fake connections:** An AI node or bridge is only marked `connected` when a live handshake or test probe returns a verifiable ACK.
5. **No fabricated memory:** Shared memory entries must have an authentic source timestamp and author identity.
6. **Shared audit trail:** Every privileged action, token expenditure, and state change is logged to the durable D1 ledger (`sovereign_ledger` and `sovereign_events`).
7. **Shared knowledge graph:** Persistent entities, relationships, observations, and decisions are indexed in the knowledge graph (`kg_*`), avoiding ephemeral context loss.
8. **Respect agent boundaries:** Agents and models operate through defined roles, capabilities, and explicit leases.
9. **Log all important actions:** All state transitions follow `CLAIM -> WORK -> HANDOFF -> ACK -> REVIEW -> EVIDENCE`.
10. **Improve Trinity continuously:** Continual self-healing, policy evaluation, and clean regression testing.

---

## 3. Working Architecture & Model

The Trinity Sovereign OS consists of seven core functional subsystems:

```
+-------------------------------------------------------------------------+
|                        TRINITY SOVEREIGN OS                             |
+-------------------+--------------------+--------------------------------+
|  Agent Registry   | Capability Registry|  Policy Engine                 |
|  (Role & Leases)  | (Domain Routing)   |  (Truth & Evidence Invariants) |
+-------------------+--------------------+--------------------------------+
|  Scheduler &      | Sovereign Ledger   |  Knowledge Graph               |
|  Resource Engine  | (D1 Source of Truth|  (Entities, Relations,         |
|  (CPU/GPU/Edge)   |  CLAIM/WORK/EVID)  |   Decisions & Evidence)        |
+-------------------+--------------------+--------------------------------+
|  Self-Healer      | Event Bus & Outbox |  MCP Bridge                    |
|  (RCA Diagnostics)| (Durable Outbox)   |  (Local daemon + Remote worker)|
+-------------------+--------------------+--------------------------------+
```

---

## 4. Sovereign Ledger Protocol

When multiple agents (Codex, Antigravity, Gemini, Copilot, Trinity Core) collaborate, coordination is maintained via the canonical D1 table `sovereign_ledger` and shared repository documents.

### Ledger Entry Schema:
```json
{
  "id": "ledger_1730000000000_abc123",
  "timestamp": 1730000000000,
  "agent": "CODEX",
  "role": "Architect",
  "type": "WORK",
  "status": "completed",
  "task": "Pentad audit",
  "message": "Verified all 524 tests passing",
  "evidence": "run-all-tests.mjs: 524 pass, 0 fail"
}
```

### Invariant:
If `status == 'completed'`, the `evidence` field MUST NOT be empty or null. Entries violating this rule are rejected with HTTP 400 (`completed_requires_evidence`).

---

## 5. Success Criterion

Every completed task must contain verifiable evidence.

---

## 6. Priority 0 — Security Foundation

Trinity follows one non-negotiable security invariant:

> **Every mutation requires an evidenceable identity.**

- Reads are explicitly classified and bounded.
- Writes require authenticated identity, an allowed capability, an active lease, an idempotency key and an audit receipt.
- Deployments additionally require an immutable source revision and test evidence.
- Production additionally requires verified staging, independent review and a fresh ACK.

The default decision is deny. Missing identity, capability, lease, policy evidence or audit persistence must fail closed and must never be converted into `completed`.

Secrets must never be committed, logged, stored in ledger messages or included in artifacts. Static fallback credentials are forbidden.

The normative implementation and acceptance contract is `Trinity/docs/SECURITY-FOUNDATION.md`.
