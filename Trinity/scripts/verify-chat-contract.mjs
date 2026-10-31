// Offline behavioral checks. Stubbed model responses are test fixtures, never live evidence.
import assert from 'node:assert/strict';
import {writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {parseAction,runAgent} from '../src/engine.js';
import {assertNoSimulatedData,findUnsupportedActionClaims} from '../src/truth.js';

const checks=[];
async function check(name,fn){
  try{await fn();checks.push({name,status:'passed'});}
  catch(error){checks.push({name,status:'failed',error:error.message});}
}
await check('legacy tool arguments preserved',()=>{
  assert.deepEqual(parseAction('{"tool":"calculate","arguments":{"operation":"add","values":[17,25]}}'),
    {tool:'calculate',arguments:{operation:'add',values:[17,25]}});
});
await check('function-shaped tool call is executable rather than printed JSON',()=>{
  assert.deepEqual(parseAction('{"type":"function","name":"calculate","parameters":{"operation":"multiply","values":[6,7]}}'),
    {tool:'calculate',arguments:{operation:'multiply',values:[6,7]}});
});
await check('ordinary answer preserved',()=>assert.deepEqual(parseAction('Ahoj, čo potrebuješ?'),{answer:'Ahoj, čo potrebuješ?'}));
await check('simulation markers rejected',()=>{
  assert.throws(()=>assertNoSimulatedData({result:{simulated:true,balance:100}},'test'),/simulované/);
});
await check('failed deployment receipt cannot support success',()=>{
  assert.ok(findUnsupportedActionClaims('Nasadila som Worker.',[{tool:'hosting_deploy',effect:'mutation',action:'deploy',status:'failed',receipt_id:'test-failure'}]).includes('deploy'));
});
await check('a read receipt cannot support a payment',()=>{
  assert.ok(findUnsupportedActionClaims('Payment was received.',[{tool:'service_status',effect:'read',status:'completed',receipt_id:'test-read'}]).includes('payment'));
});
await check('real calculator execution in offline control flow produces a receipt',async()=>{
  let calls=0;
  const result=await runAgent({AI:{run:async()=>({response:++calls===1?'{"tool":"calculate","arguments":{"operation":"multiply","values":[6,7]}}':'42'})}},
    'orchestrator','Použi kalkulačku pre súčin šesť a sedem.','','fast');
  assert.equal(result.text,'42');
  assert.ok(result.tool_log.some(r=>r.tool==='calculate'&&r.status==='completed'&&r.receipt_id));
});
await check('unsupported deployment claim does not escape the engine',async()=>{
  const result=await runAgent({AI:{run:async()=>({response:'Nasadila som Worker.'})}},'orchestrator','Povedz, či sa vykonalo nasadenie.','','fast');
  assert.doesNotMatch(result.text,/Nasadila som/);
  assert.match(result.text,/Nemám overený dôkaz/);
});
const report={checked_at:new Date().toISOString(),scope:'offline-control-flow-only',live_chat_verified:false,
  passed:checks.filter(c=>c.status==='passed').length,failed:checks.filter(c=>c.status==='failed').length,checks};
const output=new URL('../verification/chat-owner-contract.json',import.meta.url);
await mkdir(new URL('.',output),{recursive:true});
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,report:fileURLToPath(output)},null,2));
if(report.failed)process.exitCode=1;
