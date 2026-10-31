import assert from 'node:assert/strict';
import test from 'node:test';
import {executeWithCircuitBreaker, routeWithCircuitBreakers} from '../src/pentad-circuit-breaker.js';

function memoryStore() {
  const values = new Map();
  return {
    values,
    async get(key) {
      return values.has(key) ? JSON.parse(values.get(key)) : null;
    },
    async put(key, value) {
      values.set(key, value);
    }
  };
}

test('circuit closes after a successful provider call', async () => {
  const store = memoryStore();
  let clock = 100;
  const result = await executeWithCircuitBreaker({
    provider: 'gemini',
    store,
    now: () => clock += 5,
    invoke: async ({probe}) => ({text: 'ok', probe})
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.text, 'ok');
  assert.equal(JSON.parse(store.values.get('circuit:v1:gemini')).status, 'closed');
});

test('circuit opens at the threshold and skips calls during cooldown', async () => {
  const store = memoryStore();
  let calls = 0;
  const invoke = async () => {
    calls += 1;
    throw new Error('secret provider detail must not escape');
  };
  const options = {provider: 'copilot', store, invoke, failureThreshold: 2, now: () => 1_000, openMs: 500};
  assert.equal((await executeWithCircuitBreaker(options)).reason, 'provider-error');
  const opened = await executeWithCircuitBreaker(options);
  assert.equal(opened.reason, 'provider-error');
  assert.equal(opened.retry_at, 1_500);
  const skipped = await executeWithCircuitBreaker(options);
  assert.deepEqual({reason: skipped.reason, skipped: skipped.skipped}, {reason: 'circuit-open', skipped: true});
  assert.equal(calls, 2);
  assert.doesNotMatch(JSON.stringify(skipped), /secret provider detail/);
});

test('half-open probe closes the circuit after cooldown', async () => {
  const store = memoryStore();
  store.values.set('circuit:v1:gemini', JSON.stringify({provider: 'gemini', status: 'open', failures: 3, retry_at: 900}));
  const result = await executeWithCircuitBreaker({
    provider: 'gemini',
    store,
    now: () => 1_000,
    invoke: async ({probe}) => ({probe})
  });
  assert.equal(result.ok, true);
  assert.equal(result.value.probe, true);
  assert.equal(JSON.parse(store.values.get('circuit:v1:gemini')).status, 'closed');
});

test('router falls through open and unavailable providers to edge', async () => {
  const store = memoryStore();
  store.values.set('circuit:v1:gemini', JSON.stringify({provider: 'gemini', status: 'open', failures: 3, retry_at: 5_000}));
  const result = await routeWithCircuitBreakers({
    order: ['gemini', 'copilot', 'edge'],
    providers: {
      gemini: async () => {
        throw new Error('open circuit must skip this function');
      },
      edge: async () => ({text: 'edge answer'})
    },
    store,
    options: {now: () => 1_000}
  });
  assert.equal(result.ok, true);
  assert.equal(result.provider, 'edge');
  assert.deepEqual(result.attempts.map(item => item.reason || 'success'), ['circuit-open', 'not-configured', 'success']);
});
