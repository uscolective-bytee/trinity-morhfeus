import {spawn,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),cwd=resolve(root,'Trinity');
const environment=process.argv[2]||'development';
if(!['development','production'].includes(environment))throw Error('Invalid environment');
const cli=resolve(cwd,'node_modules/wrangler/bin/wrangler.js');
const port=environment==='development'?18993:18994;
// Wrangler handles its own platform sign-in. Never open credential files or print preview tokens.
const child=spawn(process.execPath,[cli,'dev','--config','wrangler.chat.jsonc',environment==='development'?'--env=development':'--env=','--remote','--ip','127.0.0.1','--port',String(port)],{cwd,stdio:['ignore','pipe','pipe'],windowsHide:true});
let exited=false,diagnostic='';const collect=data=>{diagnostic=(diagnostic+data.toString()).slice(-8000);};child.on('exit',()=>{exited=true;});child.stdout.on('data',collect);child.stderr.on('data',collect);
try{
 let ready=false;for(let i=0;i<40&&!exited;i++){
  try{const response=await fetch(`http://127.0.0.1:${port}/health`,{signal:AbortSignal.timeout(1200)});ready=response.ok;if(ready)break;}catch{}
  await new Promise(resolve=>setTimeout(resolve,750));
 }
 if(!ready)throw Error('Remote inference preview unavailable; no inference success claimed.');
 const started=Date.now();const response=await fetch(`http://127.0.0.1:${port}/generate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:"@cf/meta/llama-3.1-8b-instruct-fp8-fast",messages:[{role:'user',content:'Compute 19 plus 23. Reply with only the number.'}],max_tokens:32}),signal:AbortSignal.timeout(25000)});
 const data=await response.json();const answer=String(data.response||data.choices?.[0]?.message?.content||'').trim();
 const passed=response.ok&&/^42\D*$/.test(answer);
 console.log(JSON.stringify({environment,live_inference:passed,status:response.status,latency_ms:Date.now()-started,answer:passed?'42':null}));
 if(!passed)process.exitCode=1;
}catch(error){const lines=diagnostic.replace(/\u001b\[[0-9;]*m/g,'').split(/\r?\n/);const at=lines.findIndex(line=>line.includes('[ERROR]'));const hint=at<0?'':lines.slice(at,at+4).join(' ').replace(/https?:\/\/\S+/g,'[url]').replace(/Bearer\s+\S+/gi,'[redacted]').slice(0,240);console.error(JSON.stringify({environment,live_inference:false,error:error.message,hint}));process.exitCode=1;}
finally{if(child.pid){if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill();}}
