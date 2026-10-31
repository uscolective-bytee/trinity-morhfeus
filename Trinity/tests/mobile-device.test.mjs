import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/assistant/mobile-device.js.txt',import.meta.url),'utf8');
function setup({guest=false}={}){
  const ids=new Map(),events=new Map(),properties=new Map();let microphoneRequests=0;
  function register(node){if(node.id)ids.set(node.id,node);for(const child of node.children)register(child);}
  function element(tag){return {tag,children:[],hidden:false,disabled:false,textContent:'',attributes:{},clicks:0,
    setAttribute(name,value){this.attributes[name]=value;},
    append(...items){this.children.push(...items);items.forEach(register);},
    click(){this.clicks++;this.onclick?.();},showModal(){this.open=true;},close(){this.open=false;}};}
  const host=element('header'),body=element('body'),viewport={content:'width=device-width,initial-scale=1'};
  const login=element('section');login.hidden=!guest;ids.set('login',login);
  ids.set('image-input',element('input'));ids.set('record-voice',element('button'));
  const context={document:{getElementById:id=>ids.get(id)||null,querySelector:selector=>selector==='.header-actions'?host:selector==='meta[name="viewport"]'?viewport:null,
    createElement:element,body,documentElement:{style:{setProperty:(key,value)=>properties.set(key,value)}}},
    navigator:{onLine:true,mediaDevices:{getUserMedia(){microphoneRequests++;}}},MediaRecorder:function(){},
    window:{innerHeight:800,visualViewport:{height:700,scale:1,addEventListener:(name,fn)=>events.set('viewport:'+name,fn)},
      addEventListener:(name,fn)=>events.set(name,fn),matchMedia:()=>({matches:false})}};
  vm.createContext(context);vm.runInContext(source,context);
  const buttons=()=>ids.get('mobile-device-dialog').children.find(n=>n.tag==='div').children;
  return {context,ids,host,properties,events,buttons,run:()=>vm.runInContext(source,context),microphoneRequests:()=>microphoneRequests};
}
test('loading mobile layer never requests microphone, camera or network access',()=>{
  const s=setup();assert.equal(s.microphoneRequests(),0);
  assert.equal(s.ids.get('image-input').clicks,0);
  assert.equal(s.ids.get('record-voice').clicks,0);
  s.run();assert.equal(s.host.children.length,1);
});
test('keyboard viewport change updates the usable app height without zoom interference',()=>{
  const s=setup();assert.equal(s.properties.get('--trinity-viewport-height'),'700px');
  s.context.window.visualViewport.height=350;s.events.get('viewport:resize')();
  assert.equal(s.properties.get('--trinity-viewport-height'),'350px');
  s.context.window.visualViewport.scale=2;s.context.window.visualViewport.height=180;s.events.get('viewport:resize')();
  assert.equal(s.properties.get('--trinity-viewport-height'),'350px');
});
test('guest cannot activate the photo or microphone bridge',()=>{
  const s=setup({guest:true});s.ids.get('mobile-device-button').click();
  const [,photo,voice]=s.buttons();assert.equal(photo.disabled,true);assert.equal(voice.disabled,true);
  photo.click();voice.click();assert.equal(s.ids.get('image-input').clicks,0);assert.equal(s.ids.get('record-voice').clicks,0);
});
test('explicit photo and voice actions use the existing Trinity controls',()=>{
  const s=setup();s.ids.get('mobile-device-button').click();
  const [,photo,voice]=s.buttons();photo.click();
  assert.equal(s.ids.get('image-input').clicks,1);assert.equal(s.ids.get('image-input').attributes.capture,'environment');
  assert.equal(s.ids.get('mobile-device-dialog').open,false);
  s.ids.get('mobile-device-button').click();voice.click();assert.equal(s.ids.get('record-voice').clicks,1);
});
test('install instructions do not fabricate installation or silently request access',async()=>{
  const s=setup();const install=s.buttons()[0];await install.onclick();
  const status=s.ids.get('mobile-device-dialog').children.find(n=>n.attributes.role==='status');
  assert.match(status.textContent,/menu prehliadača/);
  let prompted=0;s.events.get('beforeinstallprompt')({preventDefault(){},async prompt(){prompted++;},userChoice:Promise.resolve({outcome:'accepted'})});
  assert.equal(prompted,0);await install.onclick();assert.equal(prompted,1);
  assert.match(status.textContent,/dokončenie potvrdí prehliadač/);
  s.events.get('appinstalled')();assert.match(status.textContent,/potvrdil inštaláciu/);
});
test('offline event reports actual connectivity without replaying work',()=>{
  const s=setup();s.context.navigator.onLine=false;s.events.get('offline')();
  const list=s.ids.get('mobile-device-dialog').children.find(n=>n.tag==='ul');
  assert.match(list.children[0].textContent,/offline/);
  assert.equal(s.ids.get('record-voice').clicks,0);assert.equal(s.ids.get('image-input').clicks,0);
});
