import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runTool, TOOL_SCHEMAS} from '../src/tools.js';
import {RUN_TASKS} from '../../Local-Gateway/src/policy.mjs';

test('enhancement 1: Local-Gateway policy and pc_run include new allowed commands', () => {
  assert.ok(RUN_TASKS.deploy, 'RUN_TASKS should include deploy');
  assert.ok(RUN_TASKS.start, 'RUN_TASKS should include start');
  assert.ok(RUN_TASKS['run-start'], 'RUN_TASKS should include run-start');
  assert.ok(RUN_TASKS['docker-compose-up'], 'RUN_TASKS should include docker-compose-up');
  assert.ok(RUN_TASKS['docker-compose-ps'], 'RUN_TASKS should include docker-compose-ps');
  assert.ok(RUN_TASKS['docker-ps'], 'RUN_TASKS should include docker-ps');
  assert.ok(RUN_TASKS['git-log'], 'RUN_TASKS should include git-log');
});

test('enhancement 2: web_search caches results in Mastermind KV with TTL', async () => {
  const store = new Map();
  let ollamaCalled = 0;
  const mockMastermind = {
    async get(key) {
      return store.get(key) || null;
    },
    async put(key, val, options) {
      store.set(key, val);
    }
  };

  // Mockovanie fetch pre Ollama
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes('web_search')) {
      ollamaCalled++;
      return new Response(JSON.stringify({
        results: [{title: 'Test Web', url: 'https://example.com', content: 'Obsah vyhladavania'}]
      }), {status: 200, headers: {'Content-Type': 'application/json'}});
    }
    return origFetch(url);
  };

  try {
    const env = {
      OLLAMA_API_KEY: 'test-api-key',
      Mastermind: mockMastermind,
      DB: {prepare: () => ({bind: () => ({first: async () => ({installed: 1, enabled: 1})})})}
    };
    const agent = {tools: ['web_search']};

    // 1. volanie - vola Ollama API
    const res1 = await runTool(env, agent, 'web_search', {query: 'Cloudflare Workers'});
    assert.equal(res1.cached, false);
    assert.equal(res1.results.length, 1);
    assert.equal(ollamaCalled, 1);

    // 2. volanie s rovnakým dopytom - vráti z cache
    const res2 = await runTool(env, agent, 'web_search', {query: 'Cloudflare Workers'});
    assert.equal(res2.cached, true);
    assert.equal(res2.results.length, 1);
    assert.equal(ollamaCalled, 1); // Nezavolá externé API znova!
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('enhancement 3: generate_image preview returns plan without writing to ARTIFACTS', async () => {
  let r2PutCalled = false;
  let aiRunCalled = false;
  const env = {
    AI: {
      run: async () => {
        aiRunCalled = true;
        return {image: Buffer.from('fake').toString('base64')};
      }
    },
    ARTIFACTS: {
      put: async () => {
        r2PutCalled = true;
      }
    },
    DB: {prepare: () => ({bind: () => ({first: async () => ({installed: 1, enabled: 1})})})}
  };
  const agent = {tools: ['generate_image']};

  // S preview: true
  const previewRes = await runTool(env, agent, 'generate_image', {
    prompt: 'Krásna vesmírna hmlovina',
    preview: true
  });
  assert.equal(previewRes.preview, true);
  assert.equal(previewRes.type, 'image_preview');
  assert.equal(r2PutCalled, false, 'Do R2 by sa nemalo zapísať pri preview');
  assert.equal(aiRunCalled, false, 'Plné AI generovanie by sa nemalo spustiť pri preview');

  // Bez preview (alebo preview: false) - klasické generovanie
  const fullRes = await runTool(env, agent, 'generate_image', {
    prompt: 'Krásna vesmírna hmlovina'
  });
  assert.equal(fullRes.type, 'image');
  assert.equal(r2PutCalled, true, 'Pri plnom generovaní sa uloží do R2');
  assert.equal(aiRunCalled, true);
});
