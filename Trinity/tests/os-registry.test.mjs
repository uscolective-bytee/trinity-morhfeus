import assert from 'node:assert/strict';
import test from 'node:test';
import {
  sanitizeD1,
  isPolicyEnabled,
  enforceCompletedEvidence,
  registerAgent,
  recordHeartbeat,
  acquireLease,
  releaseLease,
  findBestAgentForCapabilities,
  updateAgentReputation,
  recordKnowledgeGraphNode,
  recordResourceState,
  findBestResource,
  publishSovereignEvent
} from '../src/os-registry.js';

test('sanitizeD1: converts undefined to null and preserves valid values', () => {
  assert.equal(sanitizeD1(undefined), null);
  assert.equal(sanitizeD1(null), null);
  assert.equal(sanitizeD1(0), 0);
  assert.equal(sanitizeD1(false), false);
  assert.equal(sanitizeD1(''), '');
  assert.equal(sanitizeD1('test'), 'test');
  const obj = { foo: 'bar' };
  assert.equal(sanitizeD1(obj), obj);
});

test('Policy Engine: isPolicyEnabled returns boolean based on D1 query', async () => {
  // Test fallback without DB
  assert.equal(await isPolicyEnabled({}, 'deny_undefined_bind'), true);

  // Test with D1 query returning row
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (params[0] === 'disabled_policy') return { enabled: 0 };
            return { enabled: 1 };
          }
        })
      })
    }
  };

  assert.equal(await isPolicyEnabled(mockEnv, 'completed_requires_evidence'), true);
  assert.equal(await isPolicyEnabled(mockEnv, 'disabled_policy'), false);
});

test('Policy Engine: enforceCompletedEvidence enforces receipt requirement', () => {
  // Completed with receipt is valid
  assert.equal(enforceCompletedEvidence('completed', { receipt_id: 'TRN-RCPT-123' }), 'completed');
  assert.equal(enforceCompletedEvidence('completed', { _evidence: { receipt_id: 'TRN-RCPT-456' } }), 'completed');
  assert.equal(enforceCompletedEvidence('completed', { evidence: { receipt_id: 'TRN-RCPT-789' } }), 'completed');

  // Completed with error or isError and no receipt turns into failed
  assert.equal(enforceCompletedEvidence('completed', { error: 'Failed' }), 'failed');
  assert.equal(enforceCompletedEvidence('completed', { isError: true }), 'failed');

  // Completed with status queued and no receipt turns into queued
  assert.equal(enforceCompletedEvidence('completed', { status: 'queued' }), 'queued');
  assert.equal(enforceCompletedEvidence('completed', {}), 'failed');
  assert.equal(enforceCompletedEvidence('completed', { evidence: 'verified' }), 'failed');
  assert.equal(enforceCompletedEvidence('completed', { status: 'partial' }), 'partial');

  // Other statuses remain untouched
  assert.equal(enforceCompletedEvidence('queued', {}), 'queued');
  assert.equal(enforceCompletedEvidence('failed', {}), 'failed');
});

test('Agent Registry: registerAgent binds sanitized parameters and maps capabilities', async () => {
  const executedStatements = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          run: async () => {
            executedStatements.push({ sql, params });
            return { success: true };
          },
          first: async () => {
            if (sql.includes('SELECT owner FROM agents')) return null;
            if (sql.includes('SELECT capability_id FROM capabilities')) {
              return { capability_id: 'cap_memory_search' };
            }
            return null;
          }
        })
      })
    }
  };

  const reg = await registerAgent(mockEnv, {
    agent_id: 'TRINITY_MEMORY',
    name: 'Memory Sovereign Node',
    type: 'core',
    capabilities: ['memory.search']
  });

  assert.equal(reg.agent_id, 'TRINITY_MEMORY');
  assert.equal(reg.name, 'Memory Sovereign Node');
  assert.equal(reg.status, 'available');
  assert.equal(executedStatements.length >= 3, true);
  assert.ok(executedStatements.some(st=>st.sql.includes('DELETE FROM agent_capabilities')));
  // Verify sanitized params do not contain undefined
  for (const st of executedStatements) {
    for (const p of st.params) {
      assert.notEqual(p, undefined);
    }
  }
});

test('Agent Registry: rejects unknown capabilities before writing the agent', async () => {
  let writes=0;
  const env={DB:{prepare:sql=>({bind:()=>({first:async()=>null,run:async()=>{writes++;}})})}};
  await assert.rejects(registerAgent(env,{agent_id:'AGENT_X',name:'Agent X',capabilities:['memory.unknown']}),/Neznáma capability/);
  assert.equal(writes,0);
});

test('Agent Registry: another owner cannot replace an existing global agent id', async () => {
  let writes=0;
  const env={DB:{prepare:sql=>({bind:()=>({first:async()=>sql.includes('SELECT owner FROM agents')?{owner:'owner-a'}:null,run:async()=>{writes++;}})})}};
  await assert.rejects(registerAgent(env,{agent_id:'AGENT_X',name:'Agent X',owner:'owner-b'}),/inému vlastníkovi/);
  assert.equal(writes,0);
});

test('Agent Registry: recordHeartbeat updates agent status and load score', async () => {
  const executedStatements = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          run: async () => {
            executedStatements.push({ sql, params });
            return { success: true };
          }
        })
      })
    }
  };

  const hb = await recordHeartbeat(mockEnv, {
    agent_id: 'TRINITY_MEMORY',
    status: 'busy',
    active_jobs: 5,
    latency_ms: 42,
    cpu_load: 0.35,
    memory_load: 0.4
  });

  assert.equal(hb.agent_id, 'TRINITY_MEMORY');
  assert.equal(hb.status, 'busy');
  assert.equal(hb.load_score, 0.5); // 5 / 10 = 0.5
  assert.equal(executedStatements.length, 2);
});

test('Agent Registry: heartbeat rejects malformed or unbounded telemetry before D1', async () => {
  let prepared=false;
  const env={DB:{prepare(){prepared=true;throw new Error('must not reach D1');}}};
  for(const input of [
    {agent_id:'x',status:'available'},
    {agent_id:'agent-1',status:'invented'},
    {agent_id:'agent-1',active_jobs:-1},
    {agent_id:'agent-1',latency_ms:600001},
    {agent_id:'agent-1',cpu_load:1.01},
    {agent_id:'agent-1',memory_load:Number.NaN},
    {agent_id:'agent-1',extra:true}
  ]) await assert.rejects(recordHeartbeat(env,input));
  assert.equal(prepared,false);
});

test('Agent Leasing: acquireLease and releaseLease manage task exclusivity', async () => {
  const leases = new Map();
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (sql.includes('INSERT INTO agent_leases')) {
              const [lease_id,agent_id,job_id,expires_at,now]=params;
              const existing=leases.get(job_id);
              if(existing&&existing.expires_at>now&&existing.agent_id!==agent_id)return null;
              const row={lease_id,agent_id,job_id,expires_at};
              leases.set(job_id,row);
              return row;
            }
            return null;
          },
          run: async () => {
            if (sql.includes('DELETE FROM agent_leases')) {
              leases.delete(params[0]);
            }
            return { success: true };
          }
        })
      })
    }
  };

  // 1. Acquire lease
  const lease1 = await acquireLease(mockEnv, { agent_id: 'AGENT_A', job_id: 'job-999', lease_seconds: 60 });
  assert.equal(lease1.agent_id, 'AGENT_A');
  assert.equal(lease1.job_id, 'job-999');

  // 2. Reject another agent claiming active lease
  await assert.rejects(async () => {
    await acquireLease(mockEnv, { agent_id: 'AGENT_B', job_id: 'job-999', lease_seconds: 60 });
  }, /aktívny lease/);

  // 3. Release lease
  const rel = await releaseLease(mockEnv, 'job-999');
  assert.equal(rel.released, true);

  // 4. Now another agent can acquire it
  const lease2 = await acquireLease(mockEnv, { agent_id: 'AGENT_B', job_id: 'job-999', lease_seconds: 60 });
  assert.equal(lease2.agent_id, 'AGENT_B');
});

test('Agent Leasing: invalid lease requests never reach D1',async()=>{
  let prepared=false;
  const env={DB:{prepare(){prepared=true;}}};
  for(const input of [
    {agent_id:'A',job_id:'job-1',lease_seconds:60},
    {agent_id:'AGENT_A',job_id:'x',lease_seconds:60},
    {agent_id:'AGENT_A',job_id:'job-1',lease_seconds:4},
    {agent_id:'AGENT_A',job_id:'job-1',lease_seconds:3601},
    {agent_id:'AGENT_A',job_id:'job-1',extra:true}
  ])await assert.rejects(acquireLease(env,input));
  assert.equal(prepared,false);
});

test('Capability Scheduler: findBestAgentForCapabilities matches capabilities and ranks agents', async () => {
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (sql.includes('FROM agents a')) {
              return {
                agent_id: 'TRINITY_MEMORY',
                name: 'Memory Worker',
                endpoint: 'MEMORY',
                trust_score: 0.95,
                load_score: 0.1,
                rank: 0.93
              };
            }
            return null;
          },
          all: async () => {
            if (sql.includes('FROM agent_dependencies')) {
              return { results: [] }; // No unhealthy dependencies
            }
            return { results: [] };
          }
        })
      })
    }
  };

  const candidate = await findBestAgentForCapabilities(mockEnv, ['memory.search', 'memory.write']);
  assert.equal(candidate.agent_id, 'TRINITY_MEMORY');
  assert.equal(candidate.strategy, 'capability_matched');
});

test('Capability Scheduler: falls back gracefully when dependencies are unhealthy', async () => {
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (sql.includes('FROM agents a')) {
              return {
                agent_id: 'COPILOT_BRIDGE',
                name: 'Copilot Bridge',
                endpoint: 'COPILOT',
                trust_score: 0.9,
                load_score: 0.2,
                rank: 0.86
              };
            }
            return null;
          },
          all: async () => {
            if (sql.includes('FROM agent_dependencies')) {
              // Critical dependency is offline!
              return { results: [{ depends_on_agent_id: 'PC_BRIDGE', status: 'offline', heartbeat_at: 0 }] };
            }
            return { results: [] };
          }
        })
      })
    }
  };

  const result = await findBestAgentForCapabilities(mockEnv, ['tools.execute']);
  assert.equal(result.agent_id, null);
  assert.equal(result.strategy, 'dependency_blocked');
  assert.match(result.warning, /PC_BRIDGE je nezdravá/);
});

test('Capability Scheduler: missing registry or match never assigns an incapable fallback', async () => {
  assert.equal((await findBestAgentForCapabilities({},['memory.search'])).strategy,'registry_unavailable');
  assert.equal((await findBestAgentForCapabilities({},[])).strategy,'missing_requirements');
  const env={DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
  const result=await findBestAgentForCapabilities(env,['memory.search']);
  assert.equal(result.agent_id,null);
  assert.equal(result.strategy,'no_capability_match');
});

test('Agent Reputation: updateAgentReputation calculates trust score and updates records', async () => {
  let savedReputation = null;
  let updatedAgentTrust = null;

  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (sql.includes('FROM agent_reputation')) {
              return { completed_jobs: 9, failed_jobs: 1, avg_latency_ms: 120, trust_score: 0.9 };
            }
            return null;
          },
          run: async () => {
            if (sql.includes('INSERT INTO agent_reputation')) {
              savedReputation = params;
            } else if (sql.includes('UPDATE agents SET trust_score')) {
              updatedAgentTrust = params[0];
            }
            return { success: true };
          }
        })
      })
    }
  };

  const rep = await updateAgentReputation(mockEnv, {
    agent_id: 'AURA_ARCHITECT',
    success: true,
    latency_ms: 80,
    audit_score: 1.0
  });

  assert.equal(rep.agent_id, 'AURA_ARCHITECT');
  assert.equal(rep.completed_jobs, 10);
  assert.equal(rep.failed_jobs, 1);
  assert.equal(typeof rep.trust_score, 'number');
  assert.equal(rep.trust_score > 0.8, true);
  assert.notEqual(savedReputation, null);
  assert.notEqual(updatedAgentTrust, null);
});

test('Agent Reputation: invalid metrics never reach D1 or poison trust ranking',async()=>{
  let prepared=false;
  const env={DB:{prepare(){prepared=true;}}};
  for(const input of [
    {agent_id:'x'},
    {agent_id:'AGENT_A',success:'yes'},
    {agent_id:'AGENT_A',latency_ms:-1},
    {agent_id:'AGENT_A',latency_ms:Number.NaN},
    {agent_id:'AGENT_A',audit_score:1.1},
    {agent_id:'AGENT_A',audit_score:-0.1},
    {agent_id:'AGENT_A',extra:true}
  ])await assert.rejects(updateAgentReputation(env,input));
  assert.equal(prepared,false);
});

test('Knowledge Graph: recordKnowledgeGraphNode links entity, observation and verified receipt evidence', async () => {
  const inserted = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          run: async () => {
            inserted.push({ sql, params });
            return { success: true };
          }
        })
      })
    }
  };

  const res = await recordKnowledgeGraphNode(mockEnv, {
    entityType: 'project',
    entityName: 'Trinity',
    observation: 'Unified Sovereign Core deployed on auru.space and auru.dev',
    receiptId: 'TRN-RCPT-20261026-SOVEREIGN-DEPLOY-001',
    source: 'deploy_all'
  });

  assert.match(res.entityId, /^ent_project_[a-f0-9]{24}$/);
  assert.match(res.obsId, /^obs_/);
  assert.equal(res.receiptId, 'TRN-RCPT-20261026-SOVEREIGN-DEPLOY-001');
  assert.equal(inserted.length, 3); // 1. entity, 2. observation, 3. evidence
});

test('Knowledge Graph: entity ids are deterministic, collision-resistant and inputs are bounded',async()=>{
  const env={DB:{prepare:()=>({bind:()=>({run:async()=>({success:true})})})}};
  const first=await recordKnowledgeGraphNode(env,{entityType:'project',entityName:'Trinity A',observation:'healthy'});
  const repeat=await recordKnowledgeGraphNode(env,{entityType:'project',entityName:'Trinity A',observation:'updated'});
  const formerlyColliding=await recordKnowledgeGraphNode(env,{entityType:'project',entityName:'Trinity-A',observation:'separate'});
  assert.equal(first.entityId,repeat.entityId);
  assert.notEqual(first.entityId,formerlyColliding.entityId);
  assert.match(first.entityId,/^ent_project_[a-f0-9]{24}$/);

  let prepared=false;
  const blockedEnv={DB:{prepare(){prepared=true;}}};
  for(const input of [
    {entityType:'unknown',entityName:'Trinity',observation:'x'},
    {entityType:'project',entityName:'x',observation:'x'},
    {entityType:'project',entityName:'Trinity',observation:''},
    {entityType:'project',entityName:'Trinity',observation:'x',receiptId:'bad receipt'},
    {entityType:'project',entityName:'Trinity',observation:'x',extra:true}
  ])await assert.rejects(recordKnowledgeGraphNode(blockedEnv,input));
  assert.equal(prepared,false);
});

test('Resource Scheduler: records bounded telemetry and selects only a returned healthy resource',async()=>{
  const statements=[];
  const env={DB:{prepare:sql=>({bind:(...params)=>({
    run:async()=>{statements.push({sql,params});return {success:true};},
    first:async()=>sql.includes('FROM resource_state')?{resource_id:'GPU_1',node_name:'GPU node',cpu_score:0.2,memory_score:0.3,queue_depth:1,active_jobs:1,tier:'gpu',updated_at:Date.now(),rank:0.8}:null
  })})}};
  const state=await recordResourceState(env,{resource_id:'GPU_1',node_name:'GPU node',cpu_score:0.2,memory_score:0.3,queue_depth:1,active_jobs:1,tier:'gpu'});
  assert.equal(state.resource_id,'GPU_1');
  assert.equal(statements.length,1);
  const decision=await findBestResource(env,{required_tier:'gpu'});
  assert.equal(decision.strategy,'resource_matched');
  assert.equal(decision.resource.resource_id,'GPU_1');
});

test('Resource Scheduler: invalid telemetry and unavailable registry fail closed',async()=>{
  let prepared=false;
  const env={DB:{prepare(){prepared=true;}}};
  await assert.rejects(recordResourceState(env,{resource_id:'GPU_1',node_name:'GPU',cpu_score:1.1,memory_score:0.2}));
  await assert.rejects(findBestResource(env,{max_queue_depth:-1}));
  assert.equal(prepared,false);
  assert.equal((await findBestResource({},{})).strategy,'registry_unavailable');
});

test('Sovereign Event Bus: stores an idempotent pending outbox record without claiming delivery',async()=>{
  let stored=null;
  const env={DB:{prepare:sql=>({bind:(...params)=>({
    run:async()=>{if(sql.includes('INSERT INTO sovereign_events'))stored={id:params[0],topic:params[1],aggregate_type:params[2],aggregate_id:params[3],delivery_status:'pending',idempotency_key:params[5],occurred_at:params[6]};return {success:true};},
    first:async()=>stored
  })})}};
  const idempotency_key=crypto.randomUUID();
  const event=await publishSovereignEvent(env,{topic:'scheduler.resource_selected',aggregate_type:'resource',aggregate_id:'GPU_1',payload:{rank:0.8},idempotency_key});
  assert.equal(event.delivery_status,'pending');
  assert.equal(event.idempotency_key,idempotency_key);
});
