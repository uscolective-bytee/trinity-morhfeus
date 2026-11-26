import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveProviderSecret} from '../src/secret-vault.js';

test('configured Secrets Store Gemini provider reads asynchronously, server-side',async()=>{
  let calls=0;
  const env={TRINITY_MASTER_GOOGLE:{get:async()=>{calls++;return ' synthetic-google-key ';}}};
  assert.equal(await resolveProviderSecret(env,'gemini'),'synthetic-google-key');
  assert.equal(calls,1);
});

test('ordinary Worker credentials take precedence over account-level fallback',async()=>{
  let reads=0;
  const env={GEMINI_API_KEY:'worker-direct-secret',
    TRINITY_MASTER_GOOGLE:{get:async()=>{reads++;return 'fallback-secret';}}};
  assert.equal(await resolveProviderSecret(env,'gemini'),'worker-direct-secret');
  assert.equal(reads,0);
});

test('Copilot is opt-in, not a verified OAuth account',async()=>{
  assert.equal(await resolveProviderSecret({
    TRINITY_MASTER_COPILOT:{get:async()=> 'synthetic-copilot-secret'}
  },'copilot'),'synthetic-copilot-secret');
  assert.equal(await resolveProviderSecret({},'copilot'),null);
});

test('GitHub fine token is never sourced from TRINITY_MASTER',async()=>{
  let called=0;
  const env={TRINITY_MASTER_GITHUB:{get:async()=>{called++;return 'unapproved-github-token';}}};
  assert.equal(await resolveProviderSecret(env,'github'),null);
  assert.equal(called,0);
});
