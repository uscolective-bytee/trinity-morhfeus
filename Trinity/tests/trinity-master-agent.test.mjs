import test from 'node:test';
import assert from 'node:assert/strict';
import {adviseTrinityMaster} from '../src/trinity-master-agent.js';

test('Cloudflare master agent receives only metadata and cannot read secrets or perform actions',async()=>{
  const secret='synthetic-secret-never-send-to-ai';
  let observed=null,readCount=0;
  const env={
    AI:{run:async(model,request)=>{
      observed={model,request};
      return {response:'Skontroluj staging a konfiguráciu. Žiadna úprava sa nevykonala.'};
    }},
    TRINITY_ENV:'staging',
    TRINITY_MASTER_GOOGLE:{get:async()=>{readCount++;return secret;}},
    TRINITY_MASTER_COPILOT:{get:async()=>{readCount++;return secret;}},
    OPENAI_API_KEY:secret,
    ANTHROPIC_API_KEY:secret
  };
  const result=await adviseTrinityMaster(env,{task:'Over dostupnosť integrácií.'},{connected:false});
  assert.equal(result.success,true);
  assert.equal(result.status,'advice_only');
  assert.equal(result.execution_performed,false);
  assert.equal(result.verified_action_receipt,null);
  assert.equal(readCount,0);
  assert.deepEqual(Object.keys(observed.request),['messages','max_tokens','temperature']);
  assert.equal(observed.request.messages.length,2);
  assert.doesNotMatch(JSON.stringify(observed),new RegExp(secret));
  assert.match(observed.request.messages[0].content,/configured/i);
});

test('Master rejects invalid requests and missing AI binding without claiming success',async()=>{
  const bad=await adviseTrinityMaster({}, {task:''});
  assert.equal(bad.status,'invalid_request');
  const missing=await adviseTrinityMaster({}, {task:'diagnostika'});
  assert.equal(missing.status,'not_configured');
  const badModel=await adviseTrinityMaster({
    AI:{run:async()=>({})}
  },{task:'diagnostika'});
  assert.equal(badModel.status,'provider_empty');
  assert.equal(badModel.execution_performed,false);
  const outage=await adviseTrinityMaster({
    AI:{run:async()=>{throw Error('synthetic-private-value');}}
  },{task:'diagnostika'});
  assert.equal(outage.status,'provider_error');
  assert.doesNotMatch(JSON.stringify(outage),/synthetic-private-value/);
});

test('Cloudflare AI diagnostic rejects pasted API tokens before model invocation',async()=>{
  let attempts=0;
  const env={AI:{run:async()=>{attempts++;return {response:'should not run'};}}};
  for(const unsafe of [
    'api_key=syntheticlongsecretvalue123456789',
    'ghp_'+('x'.repeat(30)),
    'sk-proj-'+('a'.repeat(30)),
    'AIza'+('b'.repeat(35)),
    'cfat_'+('c'.repeat(48))
  ]){
    const result=await adviseTrinityMaster(env,{task:unsafe});
    assert.equal(result.status,'sensitive_input_rejected');
    assert.equal(result.success,false);
    assert.equal(result.execution_performed,false);
    assert.doesNotMatch(JSON.stringify(result),/syntheticlongsecretvalue123456789/);
  }
  assert.equal(attempts,0);
});
