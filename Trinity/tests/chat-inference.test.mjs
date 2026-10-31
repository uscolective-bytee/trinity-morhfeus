import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../services/chat-inference.js';
import {callModel} from '../src/services.js';
const model="@cf/meta/llama-3.1-8b-instruct-fp8-fast";
const request=body=>new Request('https://chat.internal/generate',{method:'POST',body:JSON.stringify(body)});
test('private worker validates the request and bounds inference output',async()=>{
 let captured;const env={AI:{run:async(selected,input)=>{captured={selected,input};return {response:'Ahoj'};}}};
 const response=await worker.fetch(request({model,messages:[{role:'user',content:'Ahoj'}],max_tokens:9000}),env);
 assert.equal(response.status,200);assert.equal((await response.json()).response,'Ahoj');assert.equal(captured.input.max_tokens,600);
 assert.equal((await worker.fetch(request({model:'https://other.test',messages:[]}),env)).status,400);
 assert.equal((await worker.fetch(request({model,messages:[{role:'tool',content:'x'}]}),env)).status,400);
 assert.equal((await worker.fetch(request({model,messages:[{role:'user',content:'x'.repeat(61000)}]}),env)).status,413);
});
test('health does not generate text and service errors do not disclose provider details',async()=>{
 assert.equal((await worker.fetch(new Request('https://chat.internal/health'),{AI:{run(){throw Error('Must not run');}}})).status,200);
 const response=await worker.fetch(request({model,messages:[{role:'user',content:'Ahoj'}]}),{AI:{run(){throw Error('sensitive-provider-detail');}}});
 assert.equal(response.status,503);assert.equal((await response.text()).includes('sensitive-provider-detail'),false);
});
test('parent fast calls use the dedicated internal binding',async()=>{
 const result=await callModel({AI:{run(){throw Error('Should use helper');}},CHAT_INFERENCE_SERVICE:{fetch:async(url,options)=>{assert.equal(url,'https://chat-inference.internal/generate');return worker.fetch(new Request(url,options),{AI:{run:async()=>({response:'Funguje'})}});}}},'fast',[{role:'user',content:'Ahoj'}]);
 assert.equal(result.text,'Funguje');
});
test('binding outage retains existing bounded Workers AI fallback',async()=>{
 let local=0;const result=await callModel({CHAT_INFERENCE_SERVICE:{fetch:async()=>new Response('',{status:503})},AI:{run:async()=>{local++;return {response:'Náhradná odpoveď'};}}},'fast',[]);
 assert.equal(local,1);assert.equal(result.text,'Náhradná odpoveď');
});
test('helper is private and bound to unified trinity Worker',()=>{
 const config=JSON.parse(readFileSync(new URL('../wrangler.chat.jsonc',import.meta.url),'utf8'));
 assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);assert.equal(config.routes,undefined);
 const main=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
 assert.equal(main.services.find(s=>s.binding==='CHAT_INFERENCE_SERVICE').service,'trinity-chat-inference');
});
