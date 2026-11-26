import test from 'node:test';
import assert from 'node:assert/strict';
import {trinityMasterStatus} from '../src/trinity-master-status.js';

test('TRINITY_MASTER describes Cloudflare binding truth without claiming authentication',()=>{
  const key='test-secret-must-not-leak';
  let reads=0;
  const status=trinityMasterStatus({
    TRINITY_ENV:'staging',TRINITY_GITHUB_REPO:'uscolective-byte/Trinity-antigravity',
    AI:{run:async()=>{}},DB:{prepare:()=>{}},ARTIFACTS:{get:async()=>{}},
    TRINITY_MASTER_GOOGLE:{get:async()=>{reads++;return key;}},
    TRINITY_MASTER_COPILOT:{get:async()=>{reads++;return key;}},
    OPENAI_API_KEY:key,ANTHROPIC_API_KEY:key,GITHUB_TOKEN:key
  },{connected:true});
  assert.equal(status.controller,'TRINITY_MASTER');
  assert.equal(status.deployment_environment,'staging');
  assert.equal(status.cloudflare.workers_ai.configured,true);
  assert.equal(status.credentials.gemini.configured,true);
  assert.equal(status.credentials.gemini.provider_verified,false);
  assert.equal(status.credentials.copilot.configured,true);
  assert.equal(status.credentials.copilot.oauth_linked,false);
  assert.equal(status.credentials.chatgpt_openai_api.chatgpt_account_linked,false);
  assert.equal(status.credentials.claude_anthropic_api.claude_account_linked,false);
  assert.equal(status.credentials.codex.codex_account_linked,false);
  assert.equal(status.credentials.github.authenticated,false);
  assert.equal(status.pc.connected,true);
  assert.equal(status.pc.execution_verified,false);
  assert.equal(status.safety.secrets_read,false);
  assert.equal(reads,0);
  assert.doesNotMatch(JSON.stringify(status),new RegExp(key));
});

test('TRINITY_MASTER reports unconfigured/missing PC bridge without pretending to be online',()=>{
  const missing=trinityMasterStatus({},null);
  assert.equal(missing.cloudflare.workers_ai.configured,false);
  assert.equal(missing.credentials.gemini.configured,false);
  assert.equal(missing.pc.status,'unknown');
  const offline=trinityMasterStatus({}, {connected:false});
  assert.equal(offline.pc.status,'offline');
});
