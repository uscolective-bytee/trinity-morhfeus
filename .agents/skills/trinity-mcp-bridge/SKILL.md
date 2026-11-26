---
name: trinity-mcp-bridge
description: >-
  Interact with the live Trinity MCP Bridge (https://auru.space/mcp) for readiness checks, capability status, service-binding health, memory search, task dispatch, and bounded PC bridge operations. Use when calling or troubleshooting Trinity MCP tools.
---

# Trinity Secure MCP Bridge

The `trinity` MCP server connects Antigravity and Codex to `https://auru.space/mcp` using a Windows DPAPI-encrypted credential (`C:\Users\saboi\Trinity-antigravity\Trinity\.credentials\gemini-mcp.dpapi`).

## Available MCP Tools

- `trinity_status`: Read verified Trinity readiness and active plugin count.
- `get_capability_status`: Read capability configuration, connectivity, and execution evidence without secrets.
- `check_services`: Check live reachability of bound Cloudflare Worker services.
- `list_agents`: List all 45 Trinity specialist roles.
- `search_memory`: Search shared Trinity D1 memory (`ops_memory`).
- `dispatch_task` / `get_task`: Queue a bounded workflow job in Trinity and poll its verified receipt.
- `pc_status` / `list_system_actions` / `request_project_action` / `get_project_action`: Inspect or propose bounded PC Bridge actions.

## Verifying the MCP Bridge Locally

Run the non-printing verification script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\saboi\Trinity-antigravity\Trinity\scripts\test-gemini-mcp.ps1"
```
