import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/assistant/sw.js.txt',import.meta.url),'utf8');
function worker({offline=false}={}){
  const listeners=new Map(),stored=new Map(),requests=[],deleted=[];
  const cache={async put(path,response){stored.set(path,response);},async match(path){return stored.get(path);}};
  const ctx={URL,Response,Promise,Set,self:{location:{origin:'https://auru.space'},addEventListener:(name,fn)=>listeners.set(name,fn),async skipWaiting(){},clients:{async claim(){}}},
    caches:{async open(){return cache;},async keys(){return ['other-app-private','trinity-mobile-public-old','trinity-mobile-public-v1'];},async delete(key){deleted.push(key);}},
    async fetch(input){requests.push(typeof input==='string'?input:input.url);if(offline)throw Error('offline');return new Response('public-asset');}};
  vm.createContext(ctx);vm.runInContext(source,ctx);
  function request(path,{method='GET',mode='cors',origin='https://auru.space'}={}){
    let response;listeners.get('fetch')({request:{url:origin+path,method,mode},respondWith(value){response=value;}});return response;
  }
  return {listeners,stored,requests,deleted,request};
}
test('private API, files, auth redirects and mutations never enter the PWA cache',()=>{
  const w=worker();
  for(const path of ['/api/assistant/history','/api/ops/jobs/one','/api/auth/config','/auth/google/callback','/private/report.pdf','/sites/customer'])assert.equal(w.request(path),undefined);
  assert.equal(w.request('/chat.js',{method:'POST'}),undefined);
  assert.equal(w.request('/chat.js',{origin:'https://other.example'}),undefined);
  assert.equal(w.requests.length,0);assert.equal(w.stored.size,0);
});
test('only allowlisted public assets are cached and refreshed from the network',async()=>{
  const w=worker();const response=await w.request('/mobile.css?v=1');
  assert.equal(await response.text(),'public-asset');assert.equal(w.stored.has('/mobile.css'),true);
});
test('offline entry navigation explains the state without caching or replaying a task',async()=>{
  const w=worker({offline:true});const response=await w.request('/',{mode:'navigate'});
  assert.equal(response.status,503);assert.match(await response.text(),/Žiadna nová úloha/);assert.equal(w.stored.size,0);
  assert.equal(w.request('/api/assistant/chat',{method:'POST'}),undefined);
});
test('an uncached offline asset returns a real failure response',async()=>{
  const w=worker({offline:true});const response=await w.request('/mobile-device.js');assert.equal(response.status,503);
});
test('activation only cleans its own versioned public cache',async()=>{
  const w=worker();let completed;w.listeners.get('activate')({waitUntil(p){completed=p;}});await completed;
  assert.deepEqual(w.deleted,['trinity-mobile-public-old']);
});
test('manifest icons are real square PNG images at the declared dimensions',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/assistant/manifest.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
  assert.equal(manifest.scope,'/');assert.match(manifest.start_url,/device=mobile/);
  for(const size of [192,512]){
    const icon=manifest.icons.find(i=>i.sizes===`${size}x${size}`);assert.equal(icon.src,`/mobile-icon-${size}.png`);
    const bytes=Buffer.from(readFileSync(new URL(`../public/assistant/mobile-icon-${size}.png.txt`,import.meta.url),'utf8').trim(),'base64');
    assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
  }
});
