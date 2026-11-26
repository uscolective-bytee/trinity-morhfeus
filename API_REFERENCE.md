# TRINITY OMNI-CORE — API REFERENCE

**Verzia:** `11.0.0`  
**Autorita:** Basterix (Sole Owner & Chief Architect)

---

## 1. Cloudflare Edge Endpoints (`https://auru.space` & `https://auru.dev`)

### `GET /api/status`
Verejný stavový endpoint vracajúci živý stav jadra TRINITY OMNI-CORE, autoritu vlastníka Basterix, pripojené Cloudflare bindingy a stav integrácií.
- **Response (`200 OK`):**
```json
{
  "status": "ONLINE",
  "service": "TRINITY OMNI-CORE",
  "version": "11.0.0",
  "environment": "staging | production",
  "host": "auru.dev | auru.space",
  "mode": "omni-dev | production",
  "root_authority": {
    "sole_owner": "Basterix",
    "role": "Chief Architect & Root Administrator",
    "code_modification_policy": "STRICT_MANUAL_CONSENT_ONLY",
    "windows_users": ["saboi", "basterix"],
    "google_accounts": [
      "saboivan2008@gmail.com",
      "uscolective@gmail.com",
      "cadjavadvocecka013@gmail.com"
    ],
    "phone_channels": 4,
    "legal_clauses_count": 20
  },
  "bindings": {
    "d1_sovereign_ledger": true,
    "kv_mastermind": true,
    "kv_pc_state": true,
    "r2_artifacts": true,
    "workers_ai": true,
    "memory_service": true
  }
}
```

### `GET /health` & `GET /api/health`
Kontrola životnosti Workera, verzie, zdrojového repozitára (`uscolective-byte/Trinity-antigravity`) a `truth_mode: "evidence-required"`.

### `GET /ready`
Hĺbková kontrola pripravenosti D1 databázy, tabuliek a naviazaných služieb.

### `POST /mcp`
JSON-RPC 2.0 endpoint pre Model Context Protocol (MCP) klientov.

### `POST /api/mcp/invoke`
REST brána pre volanie registrovaných nástrojov Trinity s automatickým vystavením auditného dokladu `receipt_id`.

---

## 2. Local System Bridge (`http://127.0.0.1:7788` — `system-bridge.js`)

### `GET /health` | `GET /api/status` | `GET /api/auth/status`
Overí stav lokálneho mosta na porte `7788`, výsledok kontroly autentického Windows SID zo systémového tokenu `[System.Security.Principal.WindowsIdentity]::GetCurrent()` a stav modulu `OmniDev Studio`.
- **Response (`200 OK`):**
```json
{
  "status": "ONLINE",
  "service": "Trinity Local System Bridge (OmniDev & Ring 0 Gate)",
  "port": 7788,
  "binding": "127.0.0.1",
  "windows_sid_validation": true,
  "active_operator": "saboi",
  "domain": "basterix",
  "is_root_authorized": true,
  "system_role": "BASTERIX_ROOT",
  "os_token_verified": true,
  "sid_verified": true,
  "omnidev_studio": {
    "status": "READY",
    "diagnostics_engine": "OmniDev-AST-Recovery-v3",
    "bridge_connected": true
  }
}
```

### `POST /api/omnidev/diagnose`
Spustí deterministickú AST a stack-trace diagnostiku pre `OmniDev Studio` a pripraví opravný Git diff podliehajúci Ring 0 schváleniu Basterixa.
- **Request Body:**
```json
{
  "errorText": "SyntaxError: Expected corresponding JSX closing tag for <div>",
  "filePath": "Trinity/src/studio.js",
  "sourceCode": "..."
}
```

### `POST /api/execute-privileged`
Chránená exekučná brána (`executePrivileged`). Vyžaduje kryptograficky/OS overenú identitu Basterixa. Akýkoľvek neoverený textový vstup (`email`, `phone`, `windowsUser` bez platného tokenu/podpisu/SID) je okamžite odmietnutý stavom `403 ACCESS DENIED` (`SPOOFED_UNVERIFIED_*_INPUT`).
