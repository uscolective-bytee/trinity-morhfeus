import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRINITY_MASTER_NAME,TRINITY_MASTER_BINDINGS,
  trinityMasterBindingStatus,readTrinityMasterSecret
} from '../src/trinity-master-secrets.js';

test('TRINITY_MASTER status exposes only metadata, not secret values',()=>{
  const secret='synthetic-never-expose-me';
  let accessCount=0;
  const env={TRINITY_MASTER_GOOGLE:{get:async()=>{accessCount++;return secret;}},
    TRINITY_MASTER_COPILOT:{get:async()=>secret}};
  const status=trinityMasterBindingStatus(env);
  assert.equal(status.controller,TRINITY_MASTER_NAME);
  assert.equal(status.live_verified,false);
  assert.equal(status.providers.gemini.configured,true);
  assert.equal(status.providers.copilot.verified,false);
  assert.equal(accessCount,0,'Status may never call Secrets Store binding.get()');
  assert.doesNotMatch(JSON.stringify(status),new RegExp(secret));
});

test('only allowlisted server-side provider adapters may read bindings',async()=>{
  const calls=[];
  const env={
    TRINITY_MASTER_GOOGLE:{get:async()=>{calls.push('gemini');return ' synthetic-google-key ';}},
    TRINITY_MASTER_COPILOT:{get:async()=>{calls.push('copilot');return 'synthetic-copilot-key';}},
    GITHUBE_FINE_TOKEN:{get:async()=>{throw Error('Must not access broad GitHub key');}}
  };
  assert.equal(await readTrinityMasterSecret(env,'gemini'),'synthetic-google-key');
  assert.equal(await readTrinityMasterSecret(env,'copilot'),'synthetic-copilot-key');
  assert.equal(await readTrinityMasterSecret(env,'github'),null);
  assert.equal(await readTrinityMasterSecret(env,'constructor'),null);
  assert.deepEqual(calls,['gemini','copilot']);
  assert.deepEqual(Object.keys(TRINITY_MASTER_BINDINGS),['gemini','copilot']);
});

test('missing, malformed or unavailable bindings fail closed without leaking errors',async()=>{
  assert.equal(await readTrinityMasterSecret({},'gemini'),null);
  assert.equal(await readTrinityMasterSecret({TRINITY_MASTER_GOOGLE:'plaintext'},'gemini'),null);
  assert.equal(await readTrinityMasterSecret({TRINITY_MASTER_GOOGLE:{get:async()=>({token:'private'})}},'gemini'),null);
  assert.equal(await readTrinityMasterSecret({TRINITY_MASTER_GOOGLE:{get:async()=>{throw Error('synthetic-hidden-value')}}},'gemini'),null);
  assert.equal(await readTrinityMasterSecret({TRINITY_MASTER_GOOGLE:{get:async()=>''}},'gemini'),null);
});
