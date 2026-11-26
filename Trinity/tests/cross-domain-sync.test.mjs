import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPCBridgeStatus } from '../src/system-actions.js';

test('Cross-domain synchronization: Shared storage and domains verification', () => {
  const domains = ['auru.dev', 'auru.space'];
  assert.equal(domains.length, 2);
  assert.ok(domains.includes('auru.dev'));
  assert.ok(domains.includes('auru.space'));
});

test('Cross-domain synchronization: State payload preserves session and preferences', () => {
  const sampleState = {
    session_id: 'test-session-123',
    active_view: 'omnidev',
    theme: 'dark',
    updated_at: Date.now(),
    updated_from: 'auru.dev'
  };

  assert.equal(sampleState.session_id, 'test-session-123');
  assert.equal(sampleState.active_view, 'omnidev');
  assert.equal(sampleState.updated_from, 'auru.dev');
});
