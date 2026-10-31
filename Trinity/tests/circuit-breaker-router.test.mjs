import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CircuitBreaker,
  CIRCUIT_STATES,
  circuitBreakers,
  callCopilotStudioDirectLine,
  callGeminiApi,
  fetchWithTimeout,
  createReceiptId,
  routePentadTask
} from '../src/circuit-breaker-router.js';

test('CircuitBreaker: State transitions and failure threshold', () => {
  const breaker = new CircuitBreaker('test-service', {
    failureThreshold: 2,
    resetTimeoutMs: 100
  });

  assert.equal(breaker.state, CIRCUIT_STATES.CLOSED);
  assert.equal(breaker.isOpen(), false);

  // First failure
  breaker.recordFailure();
  assert.equal(breaker.state, CIRCUIT_STATES.CLOSED);
  assert.equal(breaker.isOpen(), false);

  // Second failure -> Trips to OPEN
  breaker.recordFailure();
  assert.equal(breaker.state, CIRCUIT_STATES.OPEN);
  assert.equal(breaker.isOpen(), true);

  // After cooldown timeout -> transitions to HALF_OPEN
  breaker.lastFailureTime = Date.now() - 150;
  assert.equal(breaker.isOpen(), false);
  assert.equal(breaker.state, CIRCUIT_STATES.HALF_OPEN);

  // Success in HALF_OPEN resets to CLOSED
  breaker.recordSuccess();
  assert.equal(breaker.state, CIRCUIT_STATES.CLOSED);
  assert.equal(breaker.failureCount, 0);
});

test('createReceiptId: Generates valid sovereign receipt ID', () => {
  const id = createReceiptId('PNT');
  assert.match(id, /^PNT-RCPT-[A-Z0-9]+-[A-Z0-9]+$/);
});

test('routePentadTask: Edge execution returns receipt_id and 0 external tokens', async () => {
  const mockEnv = {
    AI: {
      run: async (model, params) => {
        return { response: 'Test Edge Response from Llama' };
      }
    },
    Mastermind: {
      put: async (key, val) => {}
    }
  };

  const res = await routePentadTask({
    prompt: 'Hello Trinity',
    preferredNode: 'edge',
    env: mockEnv
  });

  assert.equal(res.text, 'Test Edge Response from Llama');
  assert.equal(res.fallback_used, false);
  assert.match(res.receipt_id, /^PNT-RCPT-/);
  assert.equal(res.deed, 'TRINITY-DEED-20261025-001');
});

test('routePentadTask: Copilot failure gracefully falls back to Edge AI', async () => {
  const mockEnv = {
    COPILOT_STUDIO_SECRET: 'mock-secret',
    DIRECTLINE_URL: 'https://invalid-nonexistent-copilot-url.local',
    AI: {
      run: async (model, params) => {
        return { response: 'Fallback Edge AI Response' };
      }
    },
    Mastermind: {
      put: async (key, val) => {}
    }
  };

  const res = await routePentadTask({
    prompt: 'Query Copilot',
    preferredNode: 'copilot',
    env: mockEnv
  });

  assert.equal(res.text, 'Fallback Edge AI Response');
  assert.equal(res.fallback_used, true);
  assert.match(res.receipt_id, /^PNT-RCPT-/);
});

test('Copilot returns a real reply and persists the deployed copilot_sessions schema', async () => {
  const originalFetch = globalThis.fetch;
  const statements = [];
  let activityReads = 0;
  globalThis.fetch = async (input, options = {}) => {
    const target = String(input);
    if (target.endsWith('/tokens/generate')) return Response.json({ token: 'direct-line-token' });
    if (target.endsWith('/conversations') && options.method === 'POST') return Response.json({ conversationId: 'conv-123', token: 'conversation-token' });
    if (target.endsWith('/activities') && options.method === 'POST') return Response.json({ id: 'activity-1' });
    if (target.includes('/activities') && options.method === 'GET') {
      activityReads += 1;
      return Response.json(activityReads === 1
        ? { watermark: '1', activities: [{ type: 'message', from: { id: 'copilot' }, text: 'Skutočná odpoveď Copilota' }] }
        : { watermark: String(activityReads), activities: [] });
    }
    throw new Error(`Unexpected fetch: ${target}`);
  };
  const env = {
    COPILOT_STUDIO_SECRET: 'test-only-secret',
    DIRECTLINE_URL: 'https://directline.example.test/v3/directline',
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            statements.push({ sql, values });
            return { run: async () => ({ success: true }) };
          }
        };
      }
    }
  };
  try {
    circuitBreakers.copilot.recordSuccess();
    const result = await callCopilotStudioDirectLine('Over stav', env, 5000, { pollMs: 0 });
    assert.equal(result.text, 'Skutočná odpoveď Copilota');
    assert.equal(result.conversationId, 'conv-123');
    assert.equal(statements.length, 1);
    assert.match(statements[0].sql, /session_id, history, updated_at/);
    assert.doesNotMatch(statements[0].sql, /\bprompt\b|\bstatus\b|created_at/);
    assert.equal(statements[0].values.some(value => value === undefined), false);
    assert.match(statements[0].values[1], /Skutočná odpoveď Copilota/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Gemini API key stays in a header instead of the request URL', async () => {
  const originalFetch = globalThis.fetch;
  let captured;
  globalThis.fetch = async (input, options) => {
    captured = { input: String(input), options };
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Gemini reply' }] } }] });
  };
  try {
    circuitBreakers.gemini.recordSuccess();
    const result = await callGeminiApi('Ahoj', '', { GEMINI_API_KEY: 'secret-key', GEMINI_MODEL: 'gemini-test' });
    assert.equal(result.text, 'Gemini reply');
    assert.equal(captured.input.includes('secret-key'), false);
    assert.equal(captured.options.headers['x-goog-api-key'], 'secret-key');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
