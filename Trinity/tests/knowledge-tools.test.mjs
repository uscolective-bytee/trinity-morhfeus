import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runTool} from '../src/tools.js';
import {serviceStatus} from '../src/services.js';
test('knowledge retrieval rejects unauthenticated agents and preserves source provenance',async()=>{
 let calls=0;
 const provenance={passages:[{source_id:'project',text:'A stored fact',hash:'abc',origin:'user-import'}],untrusted_context:true,verified_content:false};
 const env={DB:{prepare:()=>({bind(){return this;},first:async()=>({installed:1,enabled:1})})},KNOWLEDGE_SERVICE:{search:async()=>{calls++;return provenance;}}};
 await assert.rejects(runTool(env,{tools:['knowledge_search']},'knowledge_search',{query:'project'}),/vlastníkovi/);
 assert.equal(calls,0);
 assert.deepEqual(await runTool(env,{tools:['knowledge_search']},'knowledge_search',{query:'project'},{adminAuthorized:true}),provenance);
 assert.equal(calls,1);
 await assert.rejects(runTool(env,{tools:['knowledge_search']},'knowledge_search',{query:'x'.repeat(301)},{adminAuthorized:true}));
 assert.equal(calls,1);
});
test('knowledge availability probes actual RPC storage readiness',async()=>{
 assert.equal((await serviceStatus({KNOWLEDGE_SERVICE:{getStatus:async()=>({ready:true})}},'KNOWLEDGE_SERVICE'))[0].status,'reachable');
 assert.equal((await serviceStatus({KNOWLEDGE_SERVICE:{getStatus:async()=>({ready:false})}},'KNOWLEDGE_SERVICE'))[0].status,'error');
 assert.equal((await serviceStatus({},'KNOWLEDGE_SERVICE'))[0].status,'not_configured');
});
