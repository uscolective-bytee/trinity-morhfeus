import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const inEnv=name=>config.env?.staging?.secrets_store_secrets?.find(x=>x.binding===name);

test('TRINITY_MASTER account secrets are staged only and use exact metadata',()=>{
  assert.deepEqual(config.secrets_store_secrets.map(x=>x.binding),['OLLAMA_SECRET']);
  assert.equal(config.env.staging.vars.TRINITY_ENV,'staging');
  const bindings=config.env.staging.secrets_store_secrets;
  assert.deepEqual(bindings.map(x=>x.binding),[
    'OLLAMA_SECRET','TRINITY_MASTER_GOOGLE','TRINITY_MASTER_COPILOT'
  ]);
  assert.equal(new Set(bindings.map(x=>x.binding)).size,bindings.length);
  const storeId=config.secrets_store_secrets[0].store_id;
  assert.match(storeId,/^[a-f\d]{32}$/);
  for(const b of bindings)assert.equal(b.store_id,storeId);
  assert.equal(inEnv('TRINITY_MASTER_GOOGLE').secret_name,'apigoogle');
  assert.equal(inEnv('TRINITY_MASTER_COPILOT').secret_name,'copilot');
  assert.equal(inEnv('OLLAMA_SECRET').secret_name,'ollama');
});

test('high privilege and unverified secrets are not bound to public Worker',()=>{
  for(const name of ['GITHUBE_FINE_TOKEN','BASTERIX','Secret','R2',
    'default_grok_default','ollama-Duplicate']){
    assert.ok(![...config.secrets_store_secrets,...config.env.staging.secrets_store_secrets]
      .some(binding=>binding.secret_name===name),name);
  }
});
