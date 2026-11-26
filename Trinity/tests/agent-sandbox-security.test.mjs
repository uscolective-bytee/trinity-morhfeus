import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOrUpdateCustomAgent,executeCustomAgent} from '../src/agent-sandbox.js';

function statement(sql,state){
  return {
    values:[],
    bind(...values){this.values=values;return this;},
    async first(){
      if(sql.includes('SELECT owner_id')) return state.existingOwner ? {owner_id:state.existingOwner} : null;
      if(sql.includes('SELECT * FROM ops_custom_agents')){
        state.executionLookup=this.values;
        return state.agent || null;
      }
      return null;
    },
    async all(){return {results:[]};},
    async run(){if(sql.includes('INSERT INTO ops_agent_executions'))state.executionInsert=this.values;return {};}
  };
}

const input={id:'shared-agent',name:'Shared agent',system_prompt:'Act truthfully and safely.'};

test('custom agent id cannot be overwritten by another owner',async()=>{
  const state={existingOwner:'owner-a'};
  const env={DB:{prepare(sql){return statement(sql,state);}}};
  await assert.rejects(createOrUpdateCustomAgent(env,'owner-b',input),/inému vlastníkovi/);
});

test('agent execution lookup is scoped to the authenticated owner and fails closed',async()=>{
  const state={agent:null};
  const env={DB:{prepare(sql){return statement(sql,state);}}};
  await assert.rejects(executeCustomAgent(env,'owner-b',{agent_id:'shared-agent',input:'run'}),/nepatrí/);
  assert.deepEqual(state.executionLookup,['shared-agent','owner-b']);
});

test('model failure is persisted and returned as failed without fabricated output',async()=>{
  const state={agent:{id:'shared-agent',name:'Shared agent',role:'Assistant',model:'test',system_prompt:'Act truthfully.',tools_json:'[]',autonomous_mode:1}};
  const env={
    AI:{run:async()=>{throw new Error('model unavailable');}},
    DB:{prepare(sql){return statement(sql,state);}}
  };
  const result=await executeCustomAgent(env,'owner-a',{agent_id:'shared-agent',input:'run'});
  assert.equal(result.status,'failed');
  assert.equal(result.output,null);
  assert.equal(result.error,'model unavailable');
  assert.equal(result.self_reflection.passed_truth_check,false);
  assert.equal(state.executionInsert[6],'failed');
});
