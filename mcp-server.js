/**
 * @module TRINITY_MCP_STDIO_BRIDGE
 * @description Standard Stdio MCP Server konvertujuci JSON-RPC volania z AI (Claude/Cursor)
 * na privilegovane HTTP volania na lokálny most http://127.0.0.1:7788
 */
import readline from 'readline';

const BRIDGE_URL = 'http://127.0.0.1:7788';
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

function sendResponse(id, result, error = null) {
  const payload = { jsonrpc: "2.0", id };
  if (error) payload.error = error;
  else payload.result = result;
  process.stdout.write(JSON.stringify(payload) + '\n');
}

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    const { id, method, params } = msg;

    if (method === 'initialize') {
      return sendResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "trinity-mcp-bridge", version: "12.0.0" }
      });
    }

    if (method === 'tools/list') {
      return sendResponse(id, {
        tools: [
          {
            name: "trinity_execute_command",
            description: "Spusti nativny PowerShell prikaz na hostitelskom Windows PC pod pravami Basterixa.",
            inputSchema: {
              type: "object",
              properties: { command: { type: "string", description: "PowerShell prikaz" } },
              required: ["command"]
            }
          },
          {
            name: "trinity_launch_app",
            description: "Otvori zaregistrovanu aplikaciu (whatsapp, code, browser) na hostitelskom PC.",
            inputSchema: {
              type: "object",
              properties: { 
                target: { type: "string", description: "Nazov appky alebo URL" },
                payload: { type: "string", description: "Argument (subor, telefonne cislo)" }
              },
              required: ["target"]
            }
          }
        ]
      });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const args = params?.arguments || {};

      let endpoint = '/api/exec-command';
      let reqBody = {};

      if (toolName === 'trinity_execute_command') {
        endpoint = '/api/exec-command';
        reqBody = { command: args.command };
      } else if (toolName === 'trinity_launch_app') {
        endpoint = '/api/launch';
        reqBody = { target: args.target, payload: args.payload || '' };
      } else {
        return sendResponse(id, null, { code: -32601, message: "Neznamy tool" });
      }

      const res = await fetch(`${BRIDGE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
      });
      const data = await res.json();
      return sendResponse(id, { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
    }

  } catch (err) {
    // Tichy error handling podla specifikacie MCP
  }
});
