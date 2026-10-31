import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const contractPath = new URL('../public/openapi-pentad.json', import.meta.url);
const contract = JSON.parse(await readFile(contractPath, 'utf8'));

test('Pentad OpenAPI contract is 3.1 and targets both canonical domains', () => {
  assert.equal(contract.openapi, '3.1.0');
  assert.deepEqual(
    contract.servers.map(server => server.url),
    ['https://auru.space', 'https://auru.dev']
  );
});

test('Pentad OpenAPI contract requires a scoped bearer credential', () => {
  const [requirement] = contract.security;
  const [schemeName] = Object.keys(requirement || {});
  const scheme = contract.components.securitySchemes[schemeName];
  assert.ok(schemeName);
  assert.equal(scheme.type, 'http');
  assert.equal(scheme.scheme, 'bearer');
  const serialized = JSON.stringify(contract);
  assert.doesNotMatch(serialized, /X-Trinity-Deed/i);
  assert.doesNotMatch(serialized, /COPILOT_DIRECTLINE_SECRET|GEMINI_API_KEY|trn_live_/i);
});

test('Pentad OpenAPI contract exposes authenticated MCP and bounded REST gateways', () => {
  const operation = contract.paths['/api/mcp/invoke']?.post;
  assert.ok(operation.operationId);
  assert.equal(operation.requestBody.required, true);
  assert.ok(operation.responses['401']);
  assert.ok(contract.paths['/mcp']?.post);
  assert.deepEqual(contract.paths['/health']?.get?.security, []);
  assert.notDeepEqual(contract.security, []);
});

test('Pentad REST gateway uses an allowlisted tool catalog', () => {
  const tool = contract.components.schemas.ToolInvokeRequest.properties.tool;
  assert.ok(Array.isArray(tool.enum));
  assert.ok(tool.enum.includes('trinity_status'));
  assert.ok(tool.enum.includes('trinity_memory_sync'));
  assert.ok(tool.enum.includes('dispatch_to_agent'));
  assert.equal(new Set(tool.enum).size, tool.enum.length);
});
