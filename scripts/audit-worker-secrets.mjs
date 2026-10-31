import {spawnSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const worker=resolve(root,'Trinity');
const cli=resolve(worker,'node_modules/wrangler/bin/wrangler.js');
if(!existsSync(cli))throw new Error('Install Trinity dependencies first: npm ci --ignore-scripts in Trinity/.');
// Strict allowlist: never output secret values, raw CLI output, arbitrary secret names or local credential files.
const groups={ai:['GEMINI_API_KEY','OPENAI_API_KEY','OLLAMA_API_KEY','GROQ_API_KEY','DEEPSEEK_API_KEY','ANTHROPIC_API_KEY','MISTRAL_API_KEY','OPENROUTER_API_KEY'],security:['TRINITY_SESSION_SECRET','TRINITY_VAULT_KEY'],operations:['TRINITY_OPS_KEY','TRINITY_GATEWAY_KEY','TRINITY_GITHUB_TOKEN','CF_API_TOKEN'],google:['GOOGLE_CLIENT_ID','GOOGLE_CLIENT_SECRET']};
const report={checked_at:new Date().toISOString(),values_read:false,rotation_performed:false,environments:{}};
const config=JSON.parse(readFileSync(resolve(worker,'wrangler.jsonc'),'utf8'));
const targets=config.env?.development?[['development','--env=development',config.env.development],['production','--env=',config]]:[['production','--env=',config]];
for(const [environment,arg,selected] of targets){
 const proc=spawnSync(process.execPath,[cli,'secret','list',arg],{cwd:worker,encoding:'utf8',timeout:45000,windowsHide:true});
 if(proc.error||proc.status!==0)throw new Error('Cannot list '+environment+' secrets; check Wrangler authentication privately.');
 let rows;try{rows=JSON.parse(proc.stdout);}catch{throw new Error('Unexpected secret-list response; raw output suppressed.');}
 const names=new Set(rows.map(row=>row.name));
 const vars=selected.vars||{};
 report.environments[environment]={secret_count:names.size,routes:(selected.routes||[]).map(r=>r.pattern),groups:Object.fromEntries(Object.entries(groups).map(([group,keys])=>[group,Object.fromEntries(keys.map(key=>[key,names.has(key)?'secret-present':Object.hasOwn(vars,key)?'configured-variable':'not-present']))])),note:'Presence is not provider verification. AI binding is separate. No environment credentials are copied.'};
}
console.log(JSON.stringify(report,null,2));
