import {test} from 'node:test';
import assert from 'node:assert/strict';
import core,{parseAgentDirective,modelText} from '../services/core.js';

function request(body){return new Request('https://trinity.internal/',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});}

function mockDb(){
  const runs=new Map(),receipts=[];
  return {
    runs,receipts,
    prepare(sql){let params=[];return {
      bind(...values){params=values;return this;},
      async first(){
        if(sql.includes('FROM core_agent_runs WHERE idempotency_key'))return [...runs.values()].find(row=>row.idempotency_key===params[0])||null;
        if(sql.includes('FROM system_prompts'))return null;
        if(sql.includes("name='core_agent_runs'"))return {name:'core_agent_runs'};
        return null;
      },
      async all(){
        if(sql.includes('FROM core_tool_receipts'))return {results:receipts.filter(row=>row.run_id===params[0])};
        return {results:[]};
      },
      async run(){
        if(sql.startsWith('INSERT INTO core_agent_runs')){
          const [id,idempotency_key,input_hash,trace_id,prompt,context_json,max_steps]=params;
          runs.set(id,{id,idempotency_key,input_hash,trace_id,prompt,context_json,max_steps,status:'running',answer:null,error:null,model:null});
        }else if(sql.includes("UPDATE core_agent_runs SET status='completed'")){
          const [answer,model,usage_json,id]=params;Object.assign(runs.get(id),{status:'completed',answer,model,usage_json});
        }else if(sql.includes("UPDATE core_agent_runs SET status='failed'")){
          const [error,id]=params;Object.assign(runs.get(id),{status:'failed',error});
        }else if(sql.startsWith('INSERT INTO core_tool_receipts')){
          const [id,run_id,step,tool,receipt_id,input_json,output_json]=params;
          receipts.push({id,run_id,step,tool,status:'completed',receipt_id,input_json,output_json,created_at:'now'});
        }
        return {success:true};
      }
    };}
  };
}

test('core.run executes a real knowledge tool, persists receipts, and replays idempotently',async()=>{
  const DB=mockDb();let aiCalls=0,searchCalls=0;
  const env={DB,AI:{run:async()=>({response:++aiCalls===1
    ?JSON.stringify({type:'tool',tool:'knowledge_search',arguments:{query:'Trinity receipts'}})
    :JSON.stringify({type:'final',answer:'Použila som znalostný nástroj a mám receipt.'})})},
    KNOWLEDGE_SERVICE:{search:async query=>{searchCalls++;return {passages:[{title:'Receipts',text:`Found ${query}`}],untrusted_context:true};}}};
  const idempotency_key=crypto.randomUUID();
  const body={action:'core.run',data:{prompt:'Nájdi informáciu o receipt'},idempotency_key};
  const first=await core.fetch(request(body),env);assert.equal(first.status,200);
  const result=await first.json();assert.equal(result.ok,true);assert.equal(result.result.tool_log.length,1);
  assert.equal(result.result.tool_log[0].tool,'knowledge_search');assert.match(result.result.tool_log[0].receipt_id,/^[0-9a-f-]{36}$/);
  assert.equal(aiCalls,2);assert.equal(searchCalls,1);assert.equal(DB.receipts.length,1);
  const replay=await core.fetch(request(body),env);assert.equal(replay.status,200);
  const replayed=await replay.json();assert.equal(replayed.idempotent_replay,true);assert.equal(aiCalls,2);assert.equal(searchCalls,1);
});

test('core.run fails closed when AI is unavailable',async()=>{
  const response=await core.fetch(request({action:'core.run',data:{prompt:'Do work'},idempotency_key:crypto.randomUUID()}),{DB:mockDb(),KNOWLEDGE_SERVICE:{search:async()=>({passages:[]})}});
  assert.equal(response.status,503);const body=await response.json();assert.equal(body.ok,false);assert.match(body.error,/AI binding/);
});

test('core.run rejects a changed payload under the same idempotency key',async()=>{
  const DB=mockDb(),env={DB,AI:{run:async()=>({response:JSON.stringify({type:'tool',tool:'state_list',arguments:{limit:1}})})},KNOWLEDGE_SERVICE:{search:async()=>({passages:[]})}};
  const key=crypto.randomUUID();
  await core.fetch(request({action:'core.run',data:{prompt:'first',max_steps:1},idempotency_key:key}),env);
  const response=await core.fetch(request({action:'core.run',data:{prompt:'different',max_steps:1},idempotency_key:key}),env);
  assert.equal(response.status,409);assert.match((await response.json()).error,/idempotency_conflict/);
});

test('agent directives accept only allowlisted structured tool calls',()=>{
  assert.deepEqual(parseAgentDirective('{"type":"tool","tool":"state_get","arguments":{"key":"mode"}}'),{type:'tool',tool:'state_get',arguments:{key:'mode'}});
  assert.throws(()=>parseAgentDirective('{"type":"tool","tool":"shell","arguments":{"command":"whoami"}}'),/unsupported tool/);
  assert.throws(()=>parseAgentDirective('not json'),/invalid agent directive/);
});

test('core state mutation requires verified approval and an idempotency UUID',async()=>{
  const env={DB:mockDb()};
  const denied=await core.fetch(request({action:'core.state.set',data:{key:'mode',value:'live'},idempotency_key:crypto.randomUUID()}),env);
  assert.equal(denied.status,403);
  const missingKey=await core.fetch(request({action:'core.state.set',data:{key:'mode',value:'live'},approval:{approved:true,role:'owner'}}),env);
  assert.equal(missingKey.status,400);
});

test('modelText accepts string, parsed-object, and choices shapes from Workers AI',()=>{
  assert.equal(modelText({response:' {\"type\":\"final\"} '}),'{\"type\":\"final\"}');
  assert.deepEqual(JSON.parse(modelText({response:{type:'tool',tool:'knowledge_search',arguments:{query:'x'}}})),{type:'tool',tool:'knowledge_search',arguments:{query:'x'}});
  assert.equal(modelText({choices:[{message:{content:'ok'}}]}),'ok');
  assert.equal(modelText({}),'');
});

test('core.run executes browser_scrape tool and captures receipt', async () => {
  const DB = mockDb();
  let aiCalls = 0;
  let connectorsCalled = false;
  const env = {
    DB,
    AI: {
      run: async () => ({
        response: ++aiCalls === 1
          ? JSON.stringify({ type: 'tool', tool: 'browser_scrape', arguments: { url: 'https://example.com' } })
          : JSON.stringify({ type: 'final', answer: 'Prečítala som live stránku.' })
      })
    },
    CONNECTORS: {
      fetch: async (url, opts) => {
        connectorsCalled = true;
        const body = JSON.parse(opts.body);
        assert.equal(body.action, 'browser.scrape');
        assert.equal(body.data.url, 'https://example.com');
        return new Response(JSON.stringify({
          ok: true,
          result: {
            url: 'https://example.com',
            title: 'Example Domain',
            action: 'scrape',
            content_length: 50,
            text: 'Example Domain content'
          }
        }), { status: 200, headers: { 'content-type': 'application/json' } });
      }
    }
  };
  const idempotency_key = crypto.randomUUID();
  const body = { action: 'core.run', data: { prompt: 'Prečítaj example.com' }, idempotency_key };
  const res = await core.fetch(request(body), env);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.ok, true);
  assert.equal(connectorsCalled, true);
  assert.equal(data.result.tool_log.length, 1);
  assert.equal(data.result.tool_log[0].tool, 'browser_scrape');
  assert.equal(data.result.tool_log[0].output.title, 'Example Domain');
});
