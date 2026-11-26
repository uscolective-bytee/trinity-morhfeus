import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {TRINITY_MASTER_BINDINGS} from '../src/trinity-master-secrets.js';

/**
 * Read-only Wrangler metadata preflight. Secret values must never be
 * read or printed by this utility. Remote scopes are deliberately unknown.
 */
export function diagnoseSecretsStoreConfig(config){
  const errors=[],warnings=[];
  const prod=Array.isArray(config?.secrets_store_secrets)?config.secrets_store_secrets:[];
  const staging=Array.isArray(config?.env?.staging?.secrets_store_secrets)
    ?config.env.staging.secrets_store_secrets:[];
  const expectedStaging=new Map([
    ['OLLAMA_SECRET','ollama'],
    [TRINITY_MASTER_BINDINGS.gemini,'apigoogle'],
    [TRINITY_MASTER_BINDINGS.copilot,'copilot']
  ]);
  const restricted=new Set(['GITHUBE_FINE_TOKEN','BASTERIX','Secret','R2','ollama-Duplicate']);
  const validId=/^[a-f0-9]{32}$/i;
  const validName=/^[A-Za-z_][A-Za-z0-9_-]{0,127}$/;
  function inspect(bindings,environment){
    const seen=new Set();
    for(const item of bindings){
      const name=String(item?.binding||'');
      if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))errors.push(environment+': invalid binding name');
      if(seen.has(name))errors.push(environment+': duplicated binding '+name);
      seen.add(name);
      if(!validId.test(item?.store_id||''))errors.push(environment+': invalid store ID for '+name);
      if(!validName.test(item?.secret_name||''))errors.push(environment+': invalid secret name for '+name);
      if(restricted.has(item?.secret_name))errors.push(environment+': privileged or unclassified secret in general chat Worker');
    }
    return new Map(bindings.map(item=>[item.binding,item]));
  }
  const pm=inspect(prod,'production');
  const sm=inspect(staging,'staging');
  if(config?.env?.staging?.vars?.TRINITY_ENV!=='staging')
    errors.push('staging: TRINITY_ENV must equal staging');
  if(!pm.has('OLLAMA_SECRET')||pm.get('OLLAMA_SECRET').secret_name!=='ollama')
    errors.push('production: original OLLAMA_SECRET missing or changed');
  if(pm.has(TRINITY_MASTER_BINDINGS.gemini)||pm.has(TRINITY_MASTER_BINDINGS.copilot))
    errors.push('production: new TRINITY_MASTER credentials must remain staging-only');
  for(const [binding,secretName] of expectedStaging){
    if(!sm.has(binding)||sm.get(binding).secret_name!==secretName)
      errors.push('staging: required binding missing or wrong secret name: '+binding);
  }
  const primary=pm.get('OLLAMA_SECRET')?.store_id;
  if(primary){
    for(const [name,item] of sm){
      if(item.store_id!==primary)
        errors.push('staging: binding uses an unexpected store: '+name);
    }
  }
  for(const [environment,vars] of [
    ['production',config?.vars||{}],
    ['staging',config?.env?.staging?.vars||{}]
  ]){
    for(const [name,value] of Object.entries(vars)){
      if(/(^|_)(?:API_KEY|TOKEN|PASSWORD|CLIENT_SECRET|PRIVATE_KEY)(?:_|$)/i.test(name))
        errors.push(environment+': credential-like variable placed in plaintext vars');
      if(typeof value==='string'&&/(?:cfat_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|sk-(?:proj-)?[A-Za-z0-9_-]{16,}|-----BEGIN PRIVATE KEY-----)/.test(value))
        errors.push(environment+': credential-shaped value detected in plaintext vars');
    }
  }
  warnings.push('remote existence, status and workers scope are NOT verified by a local config check');
  warnings.push('a binding alone does NOT prove provider API or OAuth authentication');
  return {
    ok:errors.length===0,
    environment:'metadata-only',
    production_bindings:prod.map(x=>x.binding),
    staging_bindings:staging.map(x=>x.binding),
    secret_values_accessed:false,
    remote_scope_verified:false,
    errors,warnings
  };
}

const thisFile=fileURLToPath(import.meta.url);
if(process.argv[1]&&resolve(process.argv[1])===thisFile){
  const config=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  const result=diagnoseSecretsStoreConfig(config);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(!result.ok)process.exitCode=1;
}
