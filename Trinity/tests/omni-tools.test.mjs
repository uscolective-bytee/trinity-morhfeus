import test from 'node:test';
import assert from 'node:assert/strict';
import { cfD1Query, cfKVStore, cfR2Manage, cfSelfDeploy, httpFetchPro, pcFsRead, pcFsWrite, pcFsPatch, pcShellExec, pcSystemTelemetry } from '../src/omni-tools.js';
import { loadDynamicSkills, registerDynamicSkill, routeSkillsSemantic, getSelfAwarenessDirective } from '../src/skill-matrix.js';
import { applySelfModification, validateScriptSyntax } from '../src/self-evolution.js';

test('Omni-Tools: cfD1Query executes queries with evidence receipts', async () => {
  const mockDB = {
    prepare: (query) => ({
      bind: (...args) => ({
        all: async () => ({ results: [{ count: 42 }], meta: { changes: 0 } }),
        run: async () => ({ changes: 1 })
      }),
      all: async () => ({ results: [{ count: 42 }], meta: { changes: 0 } }),
      run: async () => ({ changes: 1 })
    })
  };
  const env = { DB: mockDB };

  const resSelect = await cfD1Query(env, { query: 'SELECT count FROM test' });
  assert.equal(resSelect.ok, true);
  assert.equal(resSelect.is_select, true);
  assert.ok(resSelect._evidence?.receipt_id);

  const resMut = await cfD1Query(env, { query: 'UPDATE test SET a=1' });
  assert.equal(resMut.ok, true);
  assert.equal(resMut.is_select, false);
  assert.equal(resMut.changes, 1);
});

test('Omni-Tools: cfKVStore handles get, put, delete and list with evidence', async () => {
  const store = new Map();
  const mockKV = {
    get: async (k) => store.get(k) || null,
    put: async (k, v) => store.set(k, v),
    delete: async (k) => store.delete(k),
    list: async () => ({ keys: Array.from(store.keys()).map(name => ({ name })) })
  };
  const env = { Mastermind: mockKV };

  const putRes = await cfKVStore(env, { action: 'put', key: 'test_key', value: { hello: 'world' } });
  assert.equal(putRes.ok, true);
  assert.ok(putRes._evidence?.receipt_id);

  const getRes = await cfKVStore(env, { action: 'get', key: 'test_key' });
  assert.equal(getRes.ok, true);
  assert.deepEqual(getRes.value, { hello: 'world' });

  const listRes = await cfKVStore(env, { action: 'list', key: '*' });
  assert.equal(listRes.ok, true);
  assert.deepEqual(listRes.keys, ['test_key']);

  const delRes = await cfKVStore(env, { action: 'delete', key: 'test_key' });
  assert.equal(delRes.ok, true);
});

test('Omni-Tools: cfR2Manage handles list, upload and download', async () => {
  const r2Store = new Map();
  const mockR2 = {
    put: async (key, data) => {
      r2Store.set(key, data);
      return { size: data.length, httpEtag: 'test_etag' };
    },
    get: async (key) => {
      const data = r2Store.get(key);
      if (!data) return null;
      return { text: async () => data, size: data.length };
    },
    list: async () => ({ objects: Array.from(r2Store.entries()).map(([k, v]) => ({ key: k, size: v.length, uploaded: new Date().toISOString() })) })
  };
  const env = { ARTIFACTS: mockR2 };

  const up = await cfR2Manage(env, { action: 'upload', key: 'test.txt', body: 'hello r2' });
  assert.equal(up.ok, true);
  assert.ok(up._evidence?.receipt_id);

  const down = await cfR2Manage(env, { action: 'download', key: 'test.txt' });
  assert.equal(down.ok, true);
  assert.equal(down.content, 'hello r2');
});

test('Omni-Tools: cfSelfDeploy records deployment receipt', async () => {
  const env = { DB: null };
  const deploy = await cfSelfDeploy(env, { reason: 'Test deploy' });
  assert.equal(deploy.ok, true);
  assert.equal(deploy.action, 'deploy');
  assert.ok(deploy._evidence?.receipt_id);
});

test('Skill-Matrix: routeSkillsSemantic includes core skills and ranks candidates', async () => {
  const env = { AI: null };
  const allSkills = [
    { id: 'custom_crypto', name: 'Crypto Tool', description: 'Real-time crypto and blockchain token data' },
    { id: 'custom_weather', name: 'Weather Tool', description: 'Weather forecasts' }
  ];

  const routed = await routeSkillsSemantic(env, 'analyzuj krypto trh a blockchain', allSkills, 5);
  assert.ok(routed.includes('calculate'));
  assert.ok(routed.includes('pc_fs_read'));
  assert.ok(routed.includes('custom_crypto'));
});

test('Skill-Matrix: getSelfAwarenessDirective contains Trinity identity and PC bridge context', () => {
  const prompt = getSelfAwarenessDirective(['calculate', 'pc_fs_read']);
  assert.ok(prompt.includes('TRINITY Sovereign AI OS'));
  assert.ok(prompt.includes('PRISLUB_TRINITY.txt'));
  assert.ok(prompt.includes('trinity-v03'));
});

test('Self-Evolution: syntax validation catches critical syntax errors', () => {
  const valid = validateScriptSyntax('const a = 1; export default a;');
  assert.equal(valid.ok, true);

  const invalid = validateScriptSyntax('const a = ;');
  assert.equal(invalid.ok, false);
});

test('Self-Evolution: applySelfModification fails closed without verified Basterix consent and succeeds when authorized', async () => {
  const env = { DB: null, Mastermind: null, ARTIFACTS: null };
  const blocked = await applySelfModification(env, {
    filePath: 'Trinity/src/studio.js',
    originalContent: 'export const x = 1;',
    newContent: 'export const x = 2;'
  });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 'blocked');

  const allowed = await applySelfModification(env, {
    filePath: 'Trinity/src/studio.js',
    originalContent: 'export const x = 1;',
    newContent: 'export const x = 2;',
    operatorIdentity: 'Basterix',
    verifiedSession: true,
    basterixManualConsent: true,
    basterixEscalationApproved: true,
    gitDiff: '--- a/Trinity/src/studio.js\n+++ b/Trinity/src/studio.js\n@@ -1 +1 @@\n-export const x = 1;\n+export const x = 2;'
  });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.status, 'completed');
  assert.ok(allowed.receipt_id);
});
