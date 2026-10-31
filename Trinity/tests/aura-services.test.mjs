import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../services/aura-entry.js';

const base={AI:{},DB:{prepare:()=>({bind(){return this;},run:async()=>({success:true})})},IDEMPOTENCY:{get:async()=>null,put:async()=>{}}};
for(const role of ['aura_analyzer','aura_architect','aura_codegen','aura_deployer','aura_evolver','aura_memory','aura_optimizer','aura_planner','aura_sentinel','aura_tester']){
  test(`${role} exposes bounded health`,async()=>{const env={...base,WORKER_ROLE:role,...(role==='aura_deployer'?{CODE_KV:{}}:{})};const response=await worker.fetch(new Request('https://aura.internal/health'),env);assert.equal(response.status,200);assert.equal((await response.json()).status,'serving');});
}
test('unknown actions and malformed input fail closed',async()=>{const env={...base,WORKER_ROLE:'aura_analyzer'};assert.equal((await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"action":"shell","data":{}}'}),env)).status,400);assert.equal((await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'}),env)).status,400);});
test('deployment mutations require approval and idempotency',async()=>{const env={...base,WORKER_ROLE:'aura_deployer',CODE_KV:{}};const request=body=>new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal((await worker.fetch(request({action:'deploy.rollback',data:{version_id:'x'}}),env)).status,403);assert.equal((await worker.fetch(request({action:'deploy.rollback',data:{version_id:'x'},approval:{approved:true,actor_role:'owner',request_id:crypto.randomUUID()}}),env)).status,400);});
test('endpoint tester blocks arbitrary SSRF targets',async()=>{const env={...base,WORKER_ROLE:'aura_tester'};const response=await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'test.endpoint',data:{url:'http://127.0.0.1/admin'},approval:{approved:true,actor_role:'owner',request_id:crypto.randomUUID()}})}),env);assert.equal(response.status,403);});

test('reconciled Aura services retain deployed actions and bounded status without invoking AI for probes',async()=>{
  for(const role of ['aura_architect','aura_codegen','aura_planner']){
    const response=await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'aura.status',data:{}})}),{...base,WORKER_ROLE:role,AI:{run(){throw new Error('Health probe must not invoke AI');}}});
    assert.equal(response.status,200,role);assert.equal((await response.json()).ok,true);
  }
  for(const [role,action] of [['aura_architect','architect.review'],['aura_codegen','codegen.docs'],['aura_planner','plan.timeline']]){
    const response=await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data:{}})}),{...base,WORKER_ROLE:role,AI:{run:async()=>({response:'{"reviewed":true}'})}});
    assert.equal(response.status,200,action);assert.equal((await response.json()).result.reviewed,true);
  }
});

test('recovered actions that store generated content require idempotency',async()=>{
  for(const [role,action] of [['aura_codegen','codegen.refactor'],['aura_codegen','codegen.scaffold'],['aura_planner','plan.task'],['aura_planner','plan.project']]){
    const response=await worker.fetch(new Request('https://aura.internal/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,data:{}})}),{...base,WORKER_ROLE:role});
    assert.equal(response.status,400,action);assert.match((await response.json()).error,/idempotency_key/);
  }
});

test('all Aura workers expose aura.skills and can execute skills', async () => {
  for (const role of ['aura_analyzer', 'aura_architect', 'aura_codegen', 'aura_deployer', 'aura_evolver', 'aura_memory', 'aura_optimizer', 'aura_planner', 'aura_sentinel', 'aura_tester']) {
    const env = { ...base, WORKER_ROLE: role, ...(role === 'aura_deployer' ? { CODE_KV: {} } : {}) };
    const resList = await worker.fetch(new Request('https://aura.internal/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'aura.skills', data: {} })
    }), env);
    assert.equal(resList.status, 200, role);
    const bodyList = await resList.json();
    assert.equal(bodyList.ok, true);
    assert.ok(bodyList.skills_count >= 40);

    const resExec = await worker.fetch(new Request('https://aura.internal/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'aura.execute_skill', data: { skill: 'semverCheck', params: { version: '2.1.0' } } })
    }), env);
    assert.equal(resExec.status, 200, role);
    const bodyExec = await resExec.json();
    assert.equal(bodyExec.ok, true);
    assert.equal(bodyExec.result.major, 2);
  }
});
