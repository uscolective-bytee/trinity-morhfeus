import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDesktopRequest} from '../src/desktop.mjs';

test('desktop controller allows extended applications (whatsapp, vscode, terminal, browser)', () => {
  for (const app of ['whatsapp', 'vscode', 'terminal', 'browser', 'notepad', 'calculator', 'paint', 'explorer', 'chrome', 'edge']) {
    const validated = validateDesktopRequest({task: 'desktop-control', operation: 'launch', app});
    assert.equal(validated.app, app);
    assert.equal(validated.operation, 'launch');
  }
});

test('desktop controller allows screenshot operation', () => {
  const validated = validateDesktopRequest({task: 'desktop-control', operation: 'screenshot'});
  assert.equal(validated.operation, 'screenshot');
});

test('desktop controller rejects unlisted application', () => {
  assert.throws(() => {
    validateDesktopRequest({task: 'desktop-control', operation: 'launch', app: 'malicious_app'});
  }, /Aplikácia nie je v povolenom zozname/);
});
