import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMobileChatUI } from '../src/mobile-chat.js';
import { TRINITY_VERSION } from '../src/version.js';

test('renderMobileChatUI returns HTTP 200 with secure CSP and dark theme HTML', async () => {
  const env = { SYSTEM_NAME: 'TRINITY OMNI-CORE', ENVIRONMENT: 'production' };
  const res = renderMobileChatUI(env, 'auru.space');
  
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(res.headers.get('Cache-Control'), 'no-cache, no-store, must-revalidate');
  assert.equal(res.headers.get('X-Trinity-Host'), 'auru.space');
  
  const csp = res.headers.get('Content-Security-Policy');
  assert.ok(csp.includes("default-src 'self'"), 'CSP must restrict default-src');
  assert.ok(csp.includes("frame-ancestors 'none'"), 'CSP must prevent framing');

  const html = await res.text();
  assert.ok(html.includes('<title>TRINITY OMNI-CORE | Mobile</title>'));
  assert.ok(html.includes('id="chat-stream"'));
  assert.ok(html.includes('id="chat-input"'));
  assert.ok(html.includes('id="send-btn"'));
  assert.ok(html.includes('id="caller-id"'));
  assert.ok(html.includes('id="caller-token"'));
  assert.ok(html.includes('BASTERIX SOVEREIGN'));
  assert.ok(html.includes(TRINITY_VERSION));
  // Verify DOM XSS mitigation: must use textContent, not msg.innerHTML = text
  assert.ok(html.includes('.textContent = text'), 'Must use textContent for message content');
  assert.ok(!html.includes('msg.innerHTML = text'), 'Must not concatenate text into innerHTML');
});

test('renderMobileChatUI uses defaults when env is omitted', async () => {
  const res = renderMobileChatUI();
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('TRINITY OMNI-CORE'));
  assert.ok(html.includes('v' + TRINITY_VERSION));
});
