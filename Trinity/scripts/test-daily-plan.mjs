import {readFile} from 'node:fs/promises';

// Opt-in live test. The token stays in headers; redirects are refused.
const endpoint=new URL(process.env.TRINITY_MCP_URL||'http://127.0.0.1:8787/mcp');
if(endpoint.username||endpoint.password||endpoint.search||endpoint.hash)throw new Error('Use a plain MCP URL without credentials or query parameters.');
if(endpoint.protocol!=='https:'&&!(endpoint.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(endpoint.hostname)))throw new Error('Remote MCP requires HTTPS.');
const token=process.env.TRINITY_MCP_TOKEN;
if(!token)throw new Error('Missing TRINITY_MCP_TOKEN. Use an authorized Trinity token, not a model API key.');
const input=JSON.parse(await readFile(process.argv[2]||'examples/daily-plan.json','utf8'));
const key=input.idempotency_key||crypto.randomUUID();
console.log('Idempotency key:',key);
let sequence=0;
async function rpc(method,params){
  const response=await fetch(endpoint,{method:'POST',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream','X-Trinity-API-Key':token},body:JSON.stringify({jsonrpc:'2.0',id:++sequence,method,params})});
  if(!response.ok)throw new Error(`MCP HTTP ${response.status}`);
  const text=await response.text();
  const messages=response.headers.get('content-type')?.includes('text/event-stream')
    ?text.split(/\r?\n\r?\n/).map(block=>block.split(/\r?\n/).filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n')).filter(Boolean).map(line=>JSON.parse(line))
    :[JSON.parse(text)];
  const message=messages.find(item=>item.id===sequence);
  if(!message||message.error)throw new Error('MCP protocol error');
  if(message.result?.isError)throw new Error('MCP tool failed; inspect the job in Trinity.');
  return message.result;
}
async function call(name,args){return JSON.parse((await rpc('tools/call',{name,arguments:args})).content[0].text);}
await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'trinity-daily-plan-test',version:'1.0'}});
const tools=await rpc('tools/list',{});
for(const name of ['create_daily_plan','get_task'])if(!tools.tools.some(tool=>tool.name===name))throw new Error(`Missing deployed tool: ${name}`);
const args={...input,idempotency_key:key};
const job=await call('create_daily_plan',args);
console.log('Job:',job.id,'Provider:',input.provider||'workers-ai');
const duplicate=await call('create_daily_plan',args);
if(duplicate.id!==job.id||!duplicate.reused)throw new Error('Duplicate request created a second job.');
const deadline=Date.now()+240000;
while(Date.now()<deadline){
  const current=await call('get_task',{id:job.id});
  if(current.status==='completed'){
    if(!current.result?.trim()||!current.artifact_key)throw new Error('Completed job is missing its result or artifact.');
    console.log('PASS: completed, duplicate suppressed, result and artifact recorded.');
    console.log(current.result);process.exit(0);
  }
  if(['failed','cancelled'].includes(current.status))throw new Error(`Job ${current.status}; inspect ${job.id} in Trinity.`);
  await new Promise(resolve=>setTimeout(resolve,5000));
}
throw new Error(`Timed out observing ${job.id}; the job may still run. Reuse idempotency key ${key} for this same request.`);
