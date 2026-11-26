/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul audit-worker-secrets.mjs (scripts/audit-worker-secrets.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const worker=resolve(root,'Trinity');
const cli=resolve(worker,'node_modules/wrangler/bin/wrangler.js');

// Only approved metadata is returned. Secret values, raw CLI output,
// unexpected variable names and local credentials are never printed.
export const SECRET_GROUPS=Object.freeze({
 ai:['GEMINI_API_KEY','OPENAI_API_KEY','OLLAMA_API_KEY','GROQ_API_KEY','DEEPSEEK_API_KEY','ANTHROPIC_API_KEY','MISTRAL_API_KEY','OPENROUTER_API_KEY'],
 security:['TRINITY_SESSION_SECRET','TRINITY_VAULT_KEY'],
 operations:['TRINITY_OPS_KEY','TRINITY_GATEWAY_KEY','TRINITY_GITHUB_TOKEN','CF_API_TOKEN','CLOUDFLARE_API_TOKEN','TRINITY_CF_TOKEN'],
 google:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET'],
 integrations:['META_APP_SECRET','TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET']
});

export function selectSecretAuditTargets(config){
 if(!config||typeof config!=='object'||Array.isArray(config))throw new Error('Invalid Wrangler configuration.');
 const targets=[{environment:'production',flag:'--env=',config}];
 // Canonical Wrangler config uses staging rather than development.
 for(const environment of ['staging','development']){
  if(config.env?.[environment])targets.push({environment,flag:'--env='+environment,config:config.env[environment]});
 }
 return targets;
}

export function summarizeSecretPresence(rows,vars={}){
 if(!Array.isArray(rows)||rows.some(row=>!row||typeof row.name!=='string'))throw new Error('Unexpected secret-list response.');
 const names=new Set(rows.map(row=>row.name));
 const groups=Object.fromEntries(Object.entries(SECRET_GROUPS).map(([group,keys])=>
  [group,Object.fromEntries(keys.map(key=>[key,names.has(key)?'secret-present':Object.hasOwn(vars,key)?'configured-variable':'not-present']))]
 ));
 return {secret_count:names.size,groups,note:'Presence does not prove validity or authorization. No secrets were read, copied, rotated or deployed.'};
}

export function auditWorkerSecrets(){
 if(!existsSync(cli))throw new Error('Install dependencies in Trinity/ before running the audit (npm ci).');
 const config=JSON.parse(readFileSync(resolve(worker,'wrangler.jsonc'),'utf8'));
 const report={checked_at:new Date().toISOString(),values_read:false,rotation_performed:false,environments:{}};
 for(const target of selectSecretAuditTargets(config)){
  const proc=spawnSync(process.execPath,[cli,'secret','list',target.flag],{cwd:worker,encoding:'utf8',timeout:45000,windowsHide:true});
  if(proc.error||proc.status!==0)throw new Error('Cannot list '+target.environment+' secrets; check private Wrangler authentication.');
  let rows;
  try{rows=JSON.parse(proc.stdout);}catch{throw new Error('Unexpected secret-list response for '+target.environment+'; raw output suppressed.');}
  report.environments[target.environment]=summarizeSecretPresence(rows,target.config.vars||{});
 }
 return report;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(auditWorkerSecrets(),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
