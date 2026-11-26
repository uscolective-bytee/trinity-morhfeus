import test from 'node:test';
import assert from 'node:assert/strict';
import {runTool} from '../src/tools.js';
import {runAgent} from '../src/engine.js';

test('admin pc_open_app validates extended applications', async () => {
  const payloads = [];
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            if (sql.startsWith('INSERT INTO ops_system_actions')) payloads.push(JSON.parse(values[2]));
            return this;
          },
          async run() { return {}; },
          async first() {
            return sql.includes('ops_plugins')
              ? {installed: 1, enabled: 1}
              : {id: 'test-action', action: 'open_app', status: 'completed', payload_json: '{}', receipt_json: JSON.stringify({opened: true, window: {title: 'App'}})};
          },
          async all() { return {results: [{id: 'computer-control', installed: 1, enabled: 1}]}; }
        };
      }
    }
  };

  const agent = {tools: ['pc_open_app']};
  for (const target of ['whatsapp', 'vscode', 'terminal', 'browser', 'notepad', 'calculator', 'paint', 'explorer', 'chrome', 'edge']) {
    await runTool(env, agent, 'pc_open_app', {target}, {adminAuthorized: true});
    assert.equal(payloads.at(-1).target, target);
  }

  await assert.rejects(
    runTool(env, agent, 'pc_open_app', {target: 'unknown_app'}, {adminAuthorized: true})
  );
});

test('Natural language router recognizes "Trinity, otvor mi WhatsApp"', async () => {
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind() { return this; },
          async run() { return {}; },
          async first() {
            return sql.includes('ops_plugins')
              ? {installed: 1, enabled: 1}
              : {id: 'whatsapp-action', action: 'open_app', status: 'completed', payload_json: '{}', receipt_json: JSON.stringify({opened: true, window: {title: 'WhatsApp'}})};
          },
          async all() { return {results: [{id: 'computer-control', installed: 1, enabled: 1}]}; }
        };
      }
    }
  };

  const response = await runAgent(env, 'orchestrator', 'Trinity, otvor mi WhatsApp', '', 'internal', 500, 'sk', true);
  assert.ok(response);
  assert.ok(response.text.includes('WhatsApp'));
  assert.equal(response.tool_log[0].tool, 'pc_open_app');
});

test('Natural language router recognizes "otvor terminál" and "otvor VS Code"', async () => {
  const env = {
    DB: {
      prepare(sql) {
        return {
          bind() { return this; },
          async run() { return {}; },
          async first() {
            return sql.includes('ops_plugins')
              ? {installed: 1, enabled: 1}
              : {id: 'app-action', action: 'open_app', status: 'completed', payload_json: '{}', receipt_json: JSON.stringify({opened: true, window: {title: 'App'}})};
          },
          async all() { return {results: [{id: 'computer-control', installed: 1, enabled: 1}]}; }
        };
      }
    }
  };

  const r1 = await runAgent(env, 'orchestrator', 'otvor terminál', '', 'internal', 500, 'sk', true);
  assert.ok(r1.text.includes('Terminál') || r1.text.includes('PowerShell'));
  assert.equal(r1.tool_log[0].tool, 'pc_open_app');

  const r2 = await runAgent(env, 'orchestrator', 'Trinity, otvor mi VS Code', '', 'internal', 500, 'sk', true);
  assert.ok(r2.text.includes('Visual Studio Code'));
  assert.equal(r2.tool_log[0].tool, 'pc_open_app');
});
