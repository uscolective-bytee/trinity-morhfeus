import test from 'node:test';
import assert from 'node:assert/strict';
import {parseModelAction} from '../src/model-action-parser.js';
import {runAgent} from '../src/engine.js';
import {extractModelText,extractGeminiInteractionText} from '../src/services.js';

const expected={tool:'calculate',arguments:{operation:'add',values:[17,25]}};
for(const [name,source] of [
  ['legacy',JSON.stringify(expected)],
  ['fenced','```json\n'+JSON.stringify(expected)+'\n```'],
  ['function parameters',JSON.stringify({type:'function',name:'calculate',parameters:expected.arguments})],
  ['OpenAI function',{type:'function',function:{name:'calculate',arguments:JSON.stringify(expected.arguments)}}],
  ['OpenAI calls envelope',{tool_calls:[{type:'function',function:{name:'calculate',arguments:JSON.stringify(expected.arguments)}}]}],
  ['Gemini call',{functionCall:{name:'calculate',args:expected.arguments}}]
])test('normalizes '+name,()=>assert.deepEqual(parseModelAction(source),expected));

test('ordinary prose and answer envelopes are preserved',()=>{
  assert.deepEqual(parseModelAction('Ahoj!'),{answer:'Ahoj!'});
  assert.deepEqual(parseModelAction('{"answer":"42"}'),{answer:'42'});
  assert.deepEqual(parseModelAction('Tu je konfigurácia {"color":"orange"}.'),{answer:'Tu je konfigurácia {"color":"orange"}.'});
});
test('live regression: prose wrapped call and invented tool result are rejected',()=>{
  const source='Použijem nástroj calculate.\n'+JSON.stringify(expected)+'\nVýsledok nástroja calculate je: 42';
  assert.throws(()=>parseModelAction(source),/zmiešané s prózou/);
});
test('malformed calls cannot masquerade as an answer or run partial arguments',()=>{
  for(const source of [
    '{"tool":"calculate","arguments":',
    {tool:'calculate',arguments:'not JSON'},
    {tool:'calculate',arguments:null},
    {tool:'calculate',arguments:[1,2]},
    {tool:'',arguments:{}},
    {tool:'calculate;delete',arguments:{}},
    {type:'function',parameters:{}},
    {tool_calls:[expected,expected]}
  ])assert.throws(()=>parseModelAction(source),/Neplatné volanie/);
});

test('native OpenAI and Gemini calls survive the provider text adapter',()=>{
  const openai=extractModelText({choices:[{message:{content:null,tool_calls:[{type:'function',function:{name:'calculate',arguments:JSON.stringify(expected.arguments)}}]}}]});
  assert.deepEqual(parseModelAction(openai),expected);
  const gemini=extractGeminiInteractionText({candidates:[{content:{parts:[{functionCall:{name:'calculate',args:expected.arguments}}]}}]});
  assert.deepEqual(parseModelAction(gemini),expected);
});

test('engine recovers from prose wrapped call by executing a real calculator before answering',async()=>{
  let calls=0;
  const env={AI:{run:async()=>({response:[
    'Použijem nástroj calculate.\n'+JSON.stringify(expected)+'\nVýsledok nástroja calculate je: 42',
    JSON.stringify(expected),
    '42'
  ][calls++]})}};
  const result=await runAgent(env,'orchestrator','Použi nástroj calculate na súčet sedemnásť a dvadsaťpäť.','','fast');
  assert.equal(calls,3);
  assert.equal(result.text,'42');
  assert.ok(result.tool_log.some(r=>r.tool==='calculate'&&r.status==='completed'&&r.receipt_id));
});
