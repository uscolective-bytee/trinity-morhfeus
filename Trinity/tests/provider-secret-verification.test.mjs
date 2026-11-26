import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFirebase,verifyOpenAICompatible,verifyAnthropic,verifyTelegramBot} from '../src/secret-vault.js';

test('Firebase API keys and service account JSON cannot impersonate verified Firestore access',async()=>{
  let calls=0;
  const fetcher=async()=>{calls++;return Response.json({});};
  for(const secret of [
    'AIza-not-an-oauth-token',
    JSON.stringify({project_id:'trinity-test-one',private_key:'synthetic-private-key',client_email:'account@test.invalid'}),
    JSON.stringify({projectId:'trinity-test-one',apiKey:'AIza-unverified'})
  ]){
    await assert.rejects(()=>verifyFirebase(secret,{fetcher}),/OAuth access token/);
  }
  assert.equal(calls,0);
});

test('Firebase must not claim connection after HTTP 401/403 or 500',async()=>{
  for(const status of [401,403,500]){
    const fetcher=async(url,options)=>{
      assert.ok(!String(url).includes('ya29.'));
      assert.equal(options.headers.Authorization,'Bearer ya29.synthetic-test-oauth-token');
      return Response.json({error:'denied'},{status});
    };
    await assert.rejects(()=>verifyFirebase(JSON.stringify({projectId:'trinity-test-one',token:'ya29.synthetic-test-oauth-token'}),{fetcher}),new RegExp('HTTP '+status));
  }
});

test('Firebase authenticated Firestore read verifies read access only',async()=>{
  const result=await verifyFirebase(JSON.stringify({projectId:'trinity-test-one',token:'ya29.synthetic-test-oauth-token'}),{
    fetcher:async()=>Response.json({documents:[]})
  });
  assert.deepEqual(result,{connected:true,project_id:'trinity-test-one',status:'verified',permission_verified:'read'});
  assert.equal(Object.hasOwn(result,'permission_verified_write'),false);
});

test('OpenAI-compatible providers only verify after successful, valid models response',async()=>{
  const url='https://api.example.invalid/models';
  for(const status of [401,403,429,500]){
    await assert.rejects(()=>verifyOpenAICompatible(url,'synthetic-secret','groq',{
      fetcher:async()=>Response.json({error:'denied'},{status})
    }),new RegExp('HTTP '+status));
  }
  await assert.rejects(()=>verifyOpenAICompatible(url,'synthetic-secret','groq',{
    fetcher:async()=>Response.json({message:'not a models response'})
  }),/katalóg/);
  await assert.rejects(()=>verifyOpenAICompatible(url,'synthetic-secret','groq',{
    fetcher:async()=>{throw Error('synthetic-secret should not appear in response')}
  }),/nepodarilo overiť/);
  const ok=await verifyOpenAICompatible(url,'synthetic-secret','groq',{
    fetcher:async()=>Response.json({data:[{id:'model-a'},{id:'model-b'}]})
  });
  assert.equal(ok.connected,true);
  assert.equal(ok.permission_verified,'models:read');
  assert.deepEqual(ok.models,['model-a','model-b']);
  assert.doesNotMatch(JSON.stringify(ok),/synthetic-secret/);
});

test('Anthropic 5xx and malformed API response do not verify a secret',async()=>{
  await assert.rejects(()=>verifyAnthropic('synthetic-secret',{
    fetcher:async()=>Response.json({error:'upstream'}, {status:503})
  }),/HTTP 503/);
  await assert.rejects(()=>verifyAnthropic('synthetic-secret',{
    fetcher:async()=>Response.json({unknown:'shape'})
  }),/katalóg/);
  const ok=await verifyAnthropic('synthetic-secret',{
    fetcher:async()=>Response.json({data:[{id:'claude-model'}]})
  });
  assert.equal(ok.connected,true);
  assert.equal(ok.permission_verified,'models:read');
  assert.deepEqual(ok.models,['claude-model']);
});

test('Telegram bot authentication verifies getMe but never asserts webhook activation',async()=>{
  const token='123456789:'+('a'.repeat(28));
  let called=0;
  const fetcher=async(url)=>{
    called++;
    assert.match(String(url),/^https:\/\/api\.telegram\.org\/bot/);
    return Response.json({ok:true,result:{id:123456789,username:'synthetic_bot'}});
  };
  const result=await verifyTelegramBot(token,{fetcher});
  assert.equal(called,1);
  assert.equal(result.connected,true);
  assert.equal(result.webhook_verified,false);
  assert.equal(result.permission_verified,'bot:getMe');
  assert.doesNotMatch(JSON.stringify(result),new RegExp(token));
});

test('Telegram token or provider denial cannot be represented as connected',async()=>{
  const token='123456789:'+('a'.repeat(28));
  await assert.rejects(()=>verifyTelegramBot('invalid-token',{fetcher:()=>{throw Error('not called')}}),/formát/);
  await assert.rejects(()=>verifyTelegramBot(token,{
    fetcher:async()=>Response.json({ok:false,description:'synthetic invalid bot'},{status:401})
  }),/HTTP 401/);
  await assert.rejects(()=>verifyTelegramBot(token,{
    fetcher:async()=>{throw Error('transport failure')}
  }),/nedostupné/);
});
