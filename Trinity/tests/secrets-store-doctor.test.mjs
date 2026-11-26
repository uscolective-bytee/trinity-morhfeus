import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {diagnoseSecretsStoreConfig} from '../scripts/secrets-store-doctor.mjs';

const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const copy=()=>structuredClone(config);

test('TRINITY_MASTER account binding preflight succeeds for tracked staging config',()=>{
  const result=diagnoseSecretsStoreConfig(copy());
  assert.equal(result.ok,true,JSON.stringify(result.errors));
  assert.equal(result.secret_values_accessed,false);
  assert.equal(result.remote_scope_verified,false);
  assert.deepEqual(result.staging_bindings,[
    'OLLAMA_SECRET','TRINITY_MASTER_GOOGLE','TRINITY_MASTER_COPILOT'
  ]);
  assert.deepEqual(result.production_bindings,['OLLAMA_SECRET']);
  assert.match(result.warnings[0],/NOT verified/);
  assert.doesNotMatch(JSON.stringify(result),/[a-f0-9]{32}/i);
});

test('privileged GitHub token, duplicate binding and wrong secret mapping are rejected',()=>{
  const c=copy(),st=c.env.staging.secrets_store_secrets;
  st.push({...st[0],binding:'TRINITY_MASTER_GITHUB',secret_name:'GITHUBE_FINE_TOKEN'});
  st.push({...st[0]});
  st[1].secret_name='wrong-provider';
  const diagnosis=diagnoseSecretsStoreConfig(c);
  assert.equal(diagnosis.ok,false);
  assert.match(diagnosis.errors.join(' '),/privileged/);
  assert.match(diagnosis.errors.join(' '),/duplicated/);
  assert.match(diagnosis.errors.join(' '),/TRINITY_MASTER_GOOGLE/);
});

test('malformed store ID or inconsistent store also fails closed',()=>{
  const c=copy();
  c.env.staging.secrets_store_secrets[1].store_id='not-a-store';
  const result=diagnoseSecretsStoreConfig(c);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/invalid store ID/);
  assert.match(result.errors.join(' '),/unexpected store/);
});

test('leaked credential in plaintext vars is detected but not echoed',()=>{
  const c=copy();
  const synthetic='cfat_'+('z'.repeat(45));
  c.env.staging.vars.DEMO_SETTING=synthetic;
  const result=diagnoseSecretsStoreConfig(c);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/credential-shaped/);
  assert.doesNotMatch(JSON.stringify(result),new RegExp(synthetic));
});

test('wrong Wrangler environment and production privilege expansion are rejected',()=>{
  const c=copy();
  c.env.staging.vars.TRINITY_ENV='development';
  c.secrets_store_secrets.push({...c.env.staging.secrets_store_secrets[1]});
  const result=diagnoseSecretsStoreConfig(c);
  assert.equal(result.ok,false);
  assert.match(result.errors.join(' '),/must equal staging/);
  assert.match(result.errors.join(' '),/staging-only/);
});
