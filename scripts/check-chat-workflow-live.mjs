import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const cwd=resolve(dirname(fileURLToPath(import.meta.url)),'../Trinity');
const environment=process.argv[2]||'production';
if(!['development','production'].includes(environment))throw Error('Specify environment');
const config=JSON.parse(readFileSync(resolve(cwd,'wrangler.jsonc'),'utf8'));
const section=(environment==='development'&&config.env?.development)?config.env.development:config;
const database=section.d1_databases.find(db=>db.binding==='DB').database_name;
const workflow=section.workflows.find(w=>w.binding==='OPS_WORKFLOW').name;
const cli=resolve(cwd,'node_modules/wrangler/bin/wrangler.js'),envArg=(environment==='development'&&config.env?.development)?'--env=development':'--env=';
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
function run(args){const p=spawnSync(process.execPath,[cli,...args,envArg,'--json'],{cwd,encoding:'utf8',timeout:30000,windowsHide:true});if(p.error||p.status!==0)throw Error('Cloudflare platform command failed; credentials and raw output suppressed.');try{return JSON.parse(p.stdout);}catch{throw Error('Unrecognized platform receipt');}}
function sql(command){const rows=run(['d1','execute',database,'--remote','--command',command]);if(rows.some(row=>row.success!==true))throw Error('D1 query not confirmed');return rows.flatMap(row=>row.results||[]);}
// Administrative platform smoke tests, not a browser-session bypass or a role grant.
// Create only two nonprivileged, read-only tasks; the real deployed workflow must produce every result/receipt.
for(const [kind,task] of [['conversation','Napíš krátky prirodzený pozdrav po slovensky.'],['calculator','Koľko je 17 + 25?']]){
 const id=crypto.randomUUID(),session=crypto.randomUUID();const started=Date.now();
 const values=[id,session,task,JSON.stringify(['orchestrator']),'fast',crypto.randomUUID(),'sk','conversation','low',JSON.stringify({intent:'conversation',risk:'low',allow_followup:false})];
 sql('INSERT INTO ops_jobs(id,session_id,task,team,provider,idempotency_key,language,intent,risk_level,plan_json,owner_mode) VALUES('+values.map(quote).join(',')+',0);');
 run(['workflows','trigger',workflow,JSON.stringify({job_id:id}),'--id',id]);
 let job;for(let attempt=0;attempt<20;attempt++){
  job=sql('SELECT status,result FROM ops_jobs WHERE id='+quote(id))[0];if(['completed','failed','cancelled'].includes(job?.status))break;
  await new Promise(resolve=>setTimeout(resolve,750));
 }
 const steps=sql('SELECT model,status,tool_log,duration_ms FROM ops_steps WHERE job_id='+quote(id));
 const receipts=steps.flatMap(step=>{try{return JSON.parse(step.tool_log||'[]');}catch{return [];}});
 const passed=job?.status==='completed'&&!!job.result?.trim()&&job.result!=='TEST_MODEL_RESULT'&&(kind!=='calculator'||job.result==='42'&&receipts.some(item=>item.tool==='calculate'&&item.status==='completed'));
 console.log(JSON.stringify({environment,kind,job_id:id,status:job?.status,passed,latency_ms:Date.now()-started,result_characters:job?.result?.length||0,models:steps.map(step=>step.model),step_duration_ms:steps.map(step=>step.duration_ms),tools:receipts.map(item=>({tool:item.tool,status:item.status}))}));
 if(!passed){process.exitCode=1;break;}
}
