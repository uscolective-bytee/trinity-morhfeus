#!/usr/bin/env node
/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul cloudflare-doctor.mjs (scripts/cloudflare-doctor.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
// Read-only Cloudflare diagnostic. Never prints token values, arbitrary
// environment variables, raw CLI output, or provider error bodies.
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyCloudflareToken} from '../Trinity/src/cloudflare-token.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const worker=resolve(root,'Trinity');
const cli=resolve(worker,'node_modules/wrangler/bin/wrangler.js');

export function configStatus(config){
 const prod=config.d1_databases?.find(x=>x.binding==='DB');
 const stage=config.env?.staging?.d1_databases?.find(x=>x.binding==='DB');
 return {
   production_worker:config.name||null,
   staging_worker:config.env?.staging?.name||null,
   production_route:config.routes?.some(x=>x.pattern==='auru.space')===true,
   staging_route:config.env?.staging?.routes?.some(x=>x.pattern==='auru.dev')===true,
   d1_environment_isolation:Boolean(prod?.database_id&&stage?.database_id&&prod.database_id!==stage.database_id),
   kv_shared_namespaces:(config.kv_namespaces||[]).filter(x=>(config.env?.staging?.kv_namespaces||[]).some(y=>y.id===x.id)).length,
   r2_shared_buckets:(config.r2_buckets||[]).filter(x=>(config.env?.staging?.r2_buckets||[]).some(y=>y.bucket_name===x.bucket_name)).length
 };
}

function cliStatus(args){
 if(!existsSync(cli))return {available:false,ok:false};
 const res=spawnSync(process.execPath,[cli,...args],{
   cwd:worker,encoding:'utf8',windowsHide:true,timeout:45000,
   maxBuffer:1024*1024
 });
 // No stderr or stdout returned: they may contain personal/account data.
 return {available:true,ok:res.status===0&&!res.error};
}

export async function checkCloudflare(){
 const config=JSON.parse(readFileSync(resolve(worker,'wrangler.jsonc'),'utf8'));
 const accountId=config.account_id||config.vars?.CF_ACCOUNT_ID;
 const token=process.env.CLOUDFLARE_API_TOKEN||process.env.CF_API_TOKEN||'';
 const verification=await verifyCloudflareToken(token,accountId);
 const whoami=cliStatus(['whoami']);
 const production=cliStatus(['secret','list','--env=']);
 const staging=config.env?.staging?cliStatus(['secret','list','--env=staging']):{available:false,ok:false};
 const result={
   checked_at:new Date().toISOString(),
   config:configStatus(config),
   api_token:{
     available_in_process:Boolean(token),
     verified:verification.verified,
     status:verification.status,
     scope:verification.scope,
     http_status:verification.http_status
   },
   wrangler:{
     installed:whoami.available,
     authenticated:whoami.ok,
     production_secrets_list_access:production.ok,
     staging_secrets_list_access:staging.ok
   },
   next_action: !whoami.available?'Install Trinity dependencies: cd Trinity; npm ci':
     !whoami.ok?'Authenticate Wrangler locally with npx wrangler login or configure a scoped CLOUDFLARE_API_TOKEN':
     !production.ok||!staging.ok?'Check account/Worker scope of the active Wrangler session; do not replace the token blindly':
     'Wrangler can list secret metadata for both Workers. Validate CI GitHub secret separately and test stage deployment.'
 };
 return result;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{console.log(JSON.stringify(await checkCloudflare(),null,2));}
 catch{console.error('Cloudflare diagnostic could not complete; no credentials or raw errors were printed.');process.exitCode=1;}
}
