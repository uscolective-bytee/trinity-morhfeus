# TRINITY OPERATIONAL TOOL DIRECTIVES (Sovereign OS 12.0)
**Directive ID**: `DIRECTIVE_SOVEREIGN_TOOL_EXECUTION_V1`  
**Target**: Trinity Core Runtime, Copilot Agent, and Multi-Agent Coordinators  
**Classification**: High-Efficiency Operational Protocol  
**Language Specification**: Slovak & Technical JSON Schema  

---

## 1. OPERATIONAL PROTOCOL & INVOCATION STANDARD

Trinity executes operations via structured tool invocations. The agent runtime evaluates intent and returns exact JSON calls:

```json
{
  "tool": "<tool_name>",
  "arguments": {
    "<key>": "<value>"
  }
}
```

### Truth Policy 2.0 Invariants
1. **Receipt Requirement**: Every mutation or completion claim requires cryptographic, database, or HTTP evidence (D1 row ID, commit hash, SHA-256, HTTP 200 receipt).
2. **Zero Simulation**: Never fabricate terminal output, execution tokens, or version hashes. If execution is unavailable or credentials are missing, return explicit failure state.
3. **Idempotency**: All ledger mutations must include deterministic task identifiers to avoid replay loops.

---

## 2. CORE OPERATIONAL TOOL SCHEMAS & EXECUTION GUIDELINES

### A. DIAGNOSTICS & SYSTEM TELEMETRY

#### `trinity_status`
- **Purpose**: Real-time health check of Trinity core runtime, plugin counts, memory load, and environment status.
- **Invocation**:
  ```json
  { "tool": "trinity_status", "arguments": {} }
  ```
- **Returns**: Operational health, active modules, timestamp.

#### `get_capability_status`
- **Purpose**: Verify availability of PC Bridge daemon (http://127.0.0.1:3333), local tools, and execution capabilities.
- **Invocation**:
  ```json
  { "tool": "get_capability_status", "arguments": {} }
  ```
- **Operational Rule**: Use before attempting local PC operations or shell execution.

#### `service_status`
- **Purpose**: Inspect status of the 29 Cloudflare Service Bindings (D1, KV, R2, Queues, Workers).
- **Invocation**:
  ```json
  { "tool": "service_status", "arguments": { "binding": "DB" } }
  ```
- **Valid Bindings**: `DB`, `KV`, `R2`, `CORE`, `BUILDER`, `DISPATCHER`, `CONNECTORS`, `GUARDIAN`, `MEMORY`, `SENTINEL`, `SKILLS`.

#### `fleet_status`
- **Purpose**: Overview of the worker fleet, deployment tags, and environment bindings.
- **Invocation**:
  ```json
  { "tool": "fleet_status", "arguments": {} }
  ```

---

### B. MEMORY & SOVEREIGN LEDGER (TRUTH AUDIT)

#### `search_memory`
- **Purpose**: Full-text and substring search across D1 `ops_memory` and `memory_long`.
- **Schema**:
  - `query` (string, max 200 chars): Search keyword, directive key, or topic.
- **Invocation**:
  ```json
  { "tool": "search_memory", "arguments": { "query": "directive" } }
  ```
- **Returns**: Ordered records with key, value preview, source, and update timestamp.

#### `project_snapshot`
- **Purpose**: Live snapshot of current projects and active tasks from D1 tables `projects` and `tasks`.
- **Invocation**:
  ```json
  { "tool": "project_snapshot", "arguments": {} }
  ```

#### `sovereign_ledger` (API Protocol)
- **Path**: `POST /api/os/ledger`
- **Schema**:
  - `task_id` (string, UUID or slug)
  - `claim_id` (string)
  - `event_type` (`CLAIM` | `WORK` | `HANDOFF` | `REVIEW` | `ACK` | `completed`)
  - `role` (string)
  - `message` (string)
  - `evidence` (string, mandatory for `completed`)
- **Operational Rule**: Rejections (HTTP 400) occur if `status: completed` is posted without evidence.

---

### C. WEB RESEARCH & LIVE REAL-TIME DATA

#### `web_search`
- **Purpose**: Live internet search for factual ground truth, current market data, and documentation.
- **Schema**:
  - `query` (string, min 3, max 500 chars)
- **Invocation**:
  ```json
  { "tool": "web_search", "arguments": { "query": "Cloudflare Workers D1 documentation 2026" } }
  ```

#### `web_fetch`
- **Purpose**: Scrape and extract clean text content from any public HTTP/HTTPS URL.
- **Schema**:
  - `url` (string, valid HTTP/HTTPS URL)
- **Invocation**:
  ```json
  { "tool": "web_fetch", "arguments": { "url": "https://developers.cloudflare.com/workers/" } }
  ```

#### `crypto_prices`
- **Purpose**: Live cryptocurrency rates via CoinGecko without token fabrication.
- **Schema**:
  - `vs_currency` (string, default "eur")
  - `per_page` (number, min 1, max 50)
- **Invocation**:
  ```json
  { "tool": "crypto_prices", "arguments": { "vs_currency": "eur", "per_page": 5 } }
  ```

---

### D. DOMAIN MANAGEMENT, DNS & AUTONOMOUS HOSTING

#### `domain_list`
- **Purpose**: List domains managed under Cloudflare zones (`auru.space`, `auru.dev`, registered domains).
- **Schema**:
  - `status` (`active` | `pending` | `all`, optional)
- **Invocation**:
  ```json
  { "tool": "domain_list", "arguments": { "status": "active" } }
  ```

#### `domain_check`
- **Purpose**: Check domain availability and registration eligibility.
- **Schema**:
  - `domain` (string, 3-253 chars)
- **Invocation**:
  ```json
  { "tool": "domain_check", "arguments": { "domain": "mojnovyweb.sk" } }
  ```

#### `domain_set_dns`
- **Purpose**: Create or update DNS records (A, CNAME, TXT) on managed domains.
- **Schema**:
  - `domain` (string)
  - `type` ("A" | "AAAA" | "CNAME" | "TXT" | "MX")
  - `name` (string, e.g. "subdomain" or "@")
  - `content` (string, IP or target hostname)
  - `ttl` (number, 1 = automatic)
  - `proxied` (boolean, Cloudflare CDN proxy)
- **Invocation**:
  ```json
  {
    "tool": "domain_set_dns",
    "arguments": {
      "domain": "auru.space",
      "type": "CNAME",
      "name": "client-demo",
      "content": "auru.dev",
      "ttl": 1,
      "proxied": true
    }
  }
  ```

#### `hosting_deploy`
- **Purpose**: Deploy static web assets or Studio projects to live edge hosting.
- **Schema**:
  - `project_id` (string)
  - `deployment_name` (string)
- **Returns**: Live public URL, deployment receipt ID.

---

### E. ARTIFACTS, FILE GENERATION & COMMERCIAL OUTPUTS

#### `create_file`
- **Purpose**: Persist files directly to edge storage or workspace.
- **Schema**:
  - `filename` (string, regex: `^[a-zA-Z0-9_\-./]+$`)
  - `content` (string, text or base64)
  - `is_base64` (boolean, default false)
- **Invocation**:
  ```json
  {
    "tool": "create_file",
    "arguments": {
      "filename": "dist/index.html",
      "content": "<!DOCTYPE html><html><body><h1>Trinity Live Web</h1></body></html>"
    }
  }
  ```

#### `create_pdf`
- **Purpose**: Generate formal downloadable PDF documents (reports, contracts, documentation, invoices).
- **Schema**:
  - `filename` (string, ending in `.pdf`)
  - `title` (string, max 200 chars)
  - `content` (string, markdown or plain text, max 100,000 chars)
  - `author` (string, default "Trinity AI")
- **Invocation**:
  ```json
  {
    "tool": "create_pdf",
    "arguments": {
      "filename": "cenova_ponuka_web.pdf",
      "title": "Cenová ponuka a špecifikácia projektu",
      "content": "# Špecifikácia webstránky\n\n- Doména: vlastná\n- Hosting: Cloudflare Edge\n- Cena: 499 EUR",
      "author": "Trinity Commercial SaaS"
    }
  }
  ```

#### `read_artifact` / `list_artifacts`
- **Purpose**: Retrieve and list persisted artifacts from Cloudflare R2 bucket `trinity-artifacts`.
- **Invocation**:
  ```json
  { "tool": "list_artifacts", "arguments": { "limit": 20 } }
  ```

---

### F. DETERMINISTIC MATH & UTILITY TOOLS

#### `calculate`
- **Purpose**: Precision mathematical calculations without LLM floating point hallucinations.
- **Operations**: `add`, `subtract`, `multiply`, `divide`, `percentage`, `mean`, `power`, `sqrt`
- **Invocation**:
  ```json
  { "tool": "calculate", "arguments": { "operation": "percentage", "values": [25, 400] } }
  ```

#### `json_tool`
- **Purpose**: Deterministic validation, formatting, or JSON path querying.
- **Operations**: `validate`, `format`, `minify`, `get`
- **Invocation**:
  ```json
  { "tool": "json_tool", "arguments": { "operation": "validate", "json": "{\"status\":\"ok\"}" } }
  ```

#### `hash_text`
- **Purpose**: Generate standard SHA-256 digests for verification receipts.
- **Invocation**:
  ```json
  { "tool": "hash_text", "arguments": { "text": "payload-verification-string", "algorithm": "SHA-256" } }
  ```

---

## 3. ERROR HANDLING & RESILIENCE RULES

1. **Transient Network Errors**: Retry with exponential backoff only for idempotent read operations (`web_search`, `search_memory`, `trinity_status`). Never auto-retry state mutations (`domain_set_dns`, `hosting_deploy`).
2. **Missing Authorizations**: If execution returns `Táto schopnosť vyžaduje serverom overeného správcu`, surface the authorization requirement immediately rather than disguising the error.
3. **Execution Summary**: At completion, return:
   - Tool invoked
   - Input arguments
   - Real output/evidence
   - Next operational step
