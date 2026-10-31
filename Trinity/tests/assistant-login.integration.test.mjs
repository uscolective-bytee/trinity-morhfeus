import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/assistant/chat.js.txt',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/assistant/chat.html',import.meta.url),'utf8');
function setup(){
 const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
 const elements=new Map();
 function node(){return {hidden:false,value:'',checked:false,disabled:false,textContent:'',innerHTML:'',dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return node();},querySelectorAll(){return [];},append(){},replaceChildren(){},focus(){},setAttribute(){},getAttribute(){return null;},removeAttribute(){}};}
 for(const id of ids)elements.set(id,node());
 const storage=new Map(),calls=[];let bootstrap;
 const context={console,URL,URLSearchParams,TextDecoder,AbortController,AbortSignal,Response,crypto,Intl,Date,setTimeout,clearTimeout,setInterval,clearInterval,
 MutationObserver:class {observe(){} disconnect(){}},
 document:{getElementById:id=>elements.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],createElement:node,documentElement:node(),body:node(),addEventListener(){}},
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
 location:{hostname:'auru.dev',host:'auru.dev',origin:'https://auru.dev',href:'https://auru.dev/',hash:'',search:'',pathname:'/'},
 history:{replaceState(){}},navigator:{},window:{addEventListener(){},PublicKeyCredential:function(){}},
 fetch:async()=>Response.json({error:'Prihlás sa do Trinity.'},{status:401}),
 TrinityAuth:{start(options){bootstrap=options;},config:async()=>({google_enabled:false,google_required:false}),requestJSON:async()=>({account:{role:'guest'}})}
 };
 vm.createContext(context);vm.runInContext(source,context,{timeout:3000});
 return {context,elements,calls,get bootstrap(){return bootstrap;},run:code=>vm.runInContext(code,context)};
}
test('real assistant HTML boots completely even without the removed memory navigation',()=>{
 const s=setup();assert.equal(s.elements.has('memory-nav'),false);
 assert.equal(typeof s.bootstrap.initialize,'function');assert.equal(typeof s.elements.get('login-form').onsubmit,'function');
});
test('guest status opens authentication instead of presenting a working chat',async()=>{
 const s=setup();await s.bootstrap.initialize();
 assert.equal(s.elements.get('login').hidden,false);assert.equal(s.elements.get('app-views').hidden,true);
 assert.match(s.elements.get('notice').textContent,/Prihlás/);
});
test('status failure leaves a visible recoverable login screen',async()=>{
 const s=setup();s.context.TrinityAuth.requestJSON=async()=>{throw Error('Server nedostupný');};
 await s.bootstrap.initialize();assert.equal(s.elements.get('login').hidden,false);
 assert.equal(s.elements.get('app-views').hidden,true);assert.equal(s.elements.get('notice').textContent,'Server nedostupný');
});
test('expired API session reopens login without treating a denial as success',async()=>{
 const s=setup();await assert.rejects(s.run("api('/projects')"),e=>e.status===401);
 assert.equal(s.elements.get('login').hidden,false);assert.equal(s.elements.get('app-views').hidden,true);
});
test('login surfaces server rejection and retains the key for correction',async()=>{
 const s=setup();s.elements.get('key').value='test-only-fake-key';
 s.context.TrinityAuth.requestJSON=async()=>{throw Object.assign(Error('Nesprávny prístupový kľúč.'),{status:401});};
 await s.elements.get('login-form').onsubmit({preventDefault(){}});
 assert.equal(s.elements.get('key').value,'test-only-fake-key');assert.match(s.elements.get('notice').textContent,/Nesprávny/);
});

test('authenticated owner opens the chat with the current HTML',async()=>{
 const s=setup();s.context.TrinityAuth.requestJSON=async()=>({account:{role:'owner',email:'owner@example.test'},pc_bridge:{connected:false},cloud:true});
 s.context.fetch=async path=>Response.json(path.includes('/ui-evolution')?{state:{}}:[]);
 await s.bootstrap.initialize();
 assert.equal(s.elements.get('login').hidden,true,s.elements.get('notice').textContent);
 assert.equal(s.elements.get('app-views').hidden,false);assert.equal(s.elements.get('logout').hidden,false);
});
test('chat denial preserves the draft and opens authentication',async()=>{
 const s=setup();s.elements.get('message').value='Ahoj';s.elements.get('engine').value='cloud';
 await s.elements.get('chat-form').onsubmit({preventDefault(){}});
 assert.equal(s.elements.get('message').value,'Ahoj');assert.equal(s.elements.get('login').hidden,false);
 assert.equal(s.elements.get('send').disabled,false);
});

test('overview link is hidden until an owner is authenticated',async()=>{
 for(const role of ['user','admin','owner']){
  const s=setup();s.context.TrinityAuth.requestJSON=async()=>({account:{role,email:'member@example.test'},pc_bridge:{connected:false}});
  s.context.fetch=async path=>Response.json(path.includes('/ui-evolution')?{state:{}}:[]);
  await s.bootstrap.initialize();assert.equal(s.elements.get('owner-overview-nav').hidden,role!=='owner');
  s.bootstrap.lock();assert.equal(s.elements.get('owner-overview-nav').hidden,true);
 }
});
test('direct overview navigation returns nonowners to chat without reading dashboard data',async()=>{
 const s=setup();s.run("state={account:{role:'admin'}}");
 s.context.fetch=async path=>{assert.notEqual(path,'/api/assistant/dashboard');return Response.json([]);};
 await s.run("setView('dashboard',false)");assert.equal(s.run('currentView'),'chat');
});


test('chat handles a non-JSON gateway failure and retains the unsent draft',async()=>{
 const s=setup();s.elements.get('message').value='Ahoj';
 s.context.fetch=async()=>new Response('Bad gateway',{status:502});
 await s.elements.get('chat-form').onsubmit({preventDefault(){}});
 assert.equal(s.elements.get('message').value,'Ahoj');
 assert.match(s.elements.get('notice').textContent,/HTTP 502/);
 assert.equal(s.elements.get('send').disabled,false);
});
test('chat timeout is recoverable and releases the send button',async()=>{
 const s=setup();s.elements.get('message').value='Test správy';
 s.context.fetch=async()=>{throw Object.assign(new Error('timeout'),{name:'TimeoutError'});};
 await s.elements.get('chat-form').onsubmit({preventDefault(){}});
 assert.equal(s.elements.get('message').value,'Test správy');
 assert.match(s.elements.get('notice').textContent,/časovom limite/);
 assert.equal(s.elements.get('send').disabled,false);
 assert.equal(s.elements.get('stop').hidden,true);
});
