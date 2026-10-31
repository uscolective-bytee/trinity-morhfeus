import test from 'node:test';
import assert from 'node:assert/strict';
import {runAgent} from '../src/engine.js';
import {directChatTool} from '../src/fast-chat.js';

test('fast conversation uses a compact prompt and short response budget',async()=>{
 let input;const response=await runAgent({AI:{run:async(model,data)=>{input=data;return {response:'Ahoj!'};}}},'orchestrator','Ahoj','','fast');
 assert.equal(response.text,'Ahoj!');assert.ok(JSON.stringify(input.messages).length<5000);assert.ok(input.max_tokens<=600);
 assert.match(input.messages[0].content,/Nevymýšľaj/);
});
test('plain arithmetic executes the real calculator without inference',async()=>{
 const result=await runAgent({AI:{run(){throw Error('No model needed');}}},'orchestrator','Koľko je 17 + 25?','','fast');
 assert.equal(result.text,'42');assert.equal(result.provider,'internal');assert.equal(result.tool_log[0].tool,'calculate');assert.equal(result.tool_log[0].effect,'read');
});
test('current time comes from the runtime tool without inference',async()=>{
 const result=await runAgent({},'orchestrator','Koľko je hodín?','','fast');
 assert.equal(result.tool_log[0].tool,'current_time');assert.match(result.text,/\d/);
});
test('arithmetic parsing does not accept code, commands or divide by zero',async()=>{
 assert.equal(directChatTool('1+2; delete files',['calculate']),null);
 assert.equal(directChatTool('1+2',[]),null);
 await assert.rejects(runAgent({},'orchestrator','1 / 0','','fast'),/nulou/);
});
test('fast model can call an enabled calculator and receives its actual result',async()=>{
 let count=0;const env={AI:{run:async(model,input)=>{count++;if(count===1)return {response:JSON.stringify({tool:'calculate',arguments:{operation:'multiply',values:[6,7]}})};assert.match(input.messages.at(-1).content,/42/);return {response:'42'};}}};
 const result=await runAgent(env,'orchestrator','Použi kalkulačku pre súčin šesť a sedem.','','fast');
 assert.equal(result.text,'42');assert.equal(count,2);assert.equal(result.tool_log[0].tool,'calculate');
});
test('fast chat rejects a tool outside its available set',async()=>{
 let calls=0;const env={AI:{run:async(model,input)=>{if(calls++===0)return {response:JSON.stringify({tool:'pc_run',arguments:{command:'npm run deploy'}})};assert.match(input.messages.at(-1).content,/nie je povolený/);return {response:'Tento nástroj tu nie je dostupný.'};}}};
 const result=await runAgent(env,'orchestrator','Odpovedz krátko.','','fast',600,null,true);
 assert.equal(result.tool_log[0].status,'failed');
});
