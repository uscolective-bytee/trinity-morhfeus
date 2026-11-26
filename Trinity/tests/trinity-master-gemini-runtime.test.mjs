import test from 'node:test';
import assert from 'node:assert/strict';
import {getConfiguredAIProvider,listAIProviders} from '../src/ai-providers.js';

const fakeDB={prepare(){return {
  first:async()=>null,all:async()=>({results:[]}),
  bind(){return {first:async()=>null,all:async()=>({results:[]})};}
};}};
const fakeGeminiKey='AIza'+('a'.repeat(32));

test('Gemini model runtime can use a Secrets Store binding without a copied Worker secret',async()=>{
  let reads=0;
  const env={DB:fakeDB,GEMINI_MODEL:'gemini-test-only',
    TRINITY_MASTER_GOOGLE:{get:async()=>{reads++;return fakeGeminiKey;}}};
  const config=await getConfiguredAIProvider(env,'gemini');
  assert.equal(config.apiKey,fakeGeminiKey);
  assert.equal(config.model,'models/gemini-test-only');
  assert.equal(reads,1);
});

test('Gemini status does not treat a binding as verified authentication',async()=>{
  let reads=0;
  const env={DB:fakeDB,GEMINI_MODEL:'gemini-test-only',
    TRINITY_MASTER_GOOGLE:{get:async()=>{reads++;return fakeGeminiKey;}}};
  const providers=await listAIProviders(env,'owner@example.invalid');
  const gemini=providers.items.find(provider=>provider.id==='gemini');
  assert.equal(gemini.configured,true);
  assert.equal(gemini.secret_source,'secrets-store');
  assert.equal(gemini.last_check,null);
  assert.equal(reads,0,'listing configuration must not read secret values');
  assert.doesNotMatch(JSON.stringify(providers),new RegExp(fakeGeminiKey));
});

test('Secrets Store outages or invalid credentials fail closed',async()=>{
  const env={DB:fakeDB,GEMINI_MODEL:'gemini-test-only',
    TRINITY_MASTER_GOOGLE:{get:async()=>{throw new Error('synthetic-private-secret');}}};
  await assert.rejects(()=>getConfiguredAIProvider(env,'gemini'),/nemá dostupný platný API kľúč/);
  const invalid={...env,TRINITY_MASTER_GOOGLE:{get:async()=> 'not-a-gemini-token'}};
  await assert.rejects(()=>getConfiguredAIProvider(invalid,'gemini'),/nemá dostupný platný API kľúč/);
});
