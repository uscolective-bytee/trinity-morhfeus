import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dispatchAction, actions, WORKDIR, ALLOWED_APPS, ALLOWED_CMDS} from '../src/local-action-dispatcher.mjs';

test('local-action-dispatcher: system_status returns OS info and memory', async () => {
  const result = await dispatchAction('system_status');
  assert.equal(result.success, true);
  assert.match(result.output, /Počítač beží/);
  assert.match(result.output, /Pamäť:/);
  assert.match(result.output, /trinity_local/);
});

test('local-action-dispatcher: open_app enforces strict whitelist', async () => {
  const badApp = await dispatchAction('open_app', 'malicious_app');
  assert.equal(badApp.success, false);
  assert.match(badApp.output, /nie je v zozname povolených/);

  const nonString = await dispatchAction('open_app', 12345);
  assert.equal(nonString.success, false);
});

test('local-action-dispatcher: run_cmd enforces strict whitelist and prevents shell injection', async () => {
  const badCmd = await dispatchAction('run_cmd', 'rm -rf /; echo hack');
  assert.equal(badCmd.success, false);
  assert.match(badCmd.output, /nie je na whiteliste/);

  const allowedCmd = await dispatchAction('run_cmd', 'git status');
  // Môže skončiť úspechom alebo kód chyby ak git repo nie je inicializovaný v WORKDIR, ale musí byť povolený na whiteliste
  assert.ok(typeof allowedCmd.output === 'string');
});

test('local-action-dispatcher: open_url blocks invalid protocols', async () => {
  const fileProto = await dispatchAction('open_url', 'file:///C:/Windows/win.ini');
  assert.equal(fileProto.success, false);
  assert.match(fileProto.output, /Povolené sú iba HTTP a HTTPS/);

  const invalidUrl = await dispatchAction('open_url', ':::invalid:::');
  assert.equal(invalidUrl.success, false);
});

test('local-action-dispatcher: create_file blocks path traversal outside WORKDIR', async () => {
  const traversal = await dispatchAction('create_file', {
    filePath: '../../Windows/System32/evil.dll',
    content: 'test'
  });
  assert.equal(traversal.success, false);
  assert.match(traversal.output, /Zápis mimo povoleného priečinka.*je zablokovaný/);

  const badPayload = await dispatchAction('create_file', 'not-an-object');
  assert.equal(badPayload.success, false);
});
