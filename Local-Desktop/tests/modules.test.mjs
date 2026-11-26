/**
 * @module TRINITY_OMNI_CORE
 * @subsystem LOCAL_DESKTOP_UI
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul modules.test.mjs (Local-Desktop/tests/modules.test.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TrinityCloud} from '../modules/cloud.mjs';
import {geminiChat,copilotStudioChat} from '../modules/providers.mjs';
import {syncNotes} from '../modules/notes-sync.mjs';
import {executeGraphOperation,checkMicrosoftHealth,resolveProfile} from '../modules/microsoft-graph.mjs';

test('cloud connector sends authenticated real MCP envelopes and parses SSE',async()=>{
 let sent;
 const cloud=new TrinityCloud({getToken:async()=> 'private-token',fetcher:async(url,init)=>{assert.equal(url,'https://auru.space/mcp');assert.equal(init.headers.Authorization,'Bearer private-token');sent=JSON.parse(init.body);return new Response('event: message\ndata: '+JSON.stringify({jsonrpc:'2.0',id:sent.id,result:{content:[{type:'text',text:JSON.stringify({ready:true})}]}})+'\n\n');}});
 assert.equal((await cloud.call('trinity_status')).ready,true);assert.equal(sent.params.name,'trinity_status');
 assert.throws(()=>new TrinityCloud({environment:'other',getToken:async()=>''}),/prostredie/);
 await assert.rejects(new TrinityCloud({getToken:async()=>''}).call('trinity_status'),/kľúč/);
});

test('Gemini maps local tools and preserves native signature parts for the next turn',async()=>{
 let count=0;
 const fetcher=async(url,init)=>{
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.equal(init.headers['x-goog-api-key'],'test-key');
  const input=JSON.parse(init.body);assert.equal(input.tools[0].functionDeclarations[0].name,'read_file');
  if(++count===2)assert.equal(input.contents[1].parts[0].thoughtSignature,'native-signature');
  return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{thoughtSignature:'native-signature',functionCall:{name:'read_file',args:{path:'x.txt'}}}]}}]});
 };
 const messages=[{role:'system',content:'Trinity'},{role:'user',content:'read'}];
 const options={key:'test-key',model:'gemini-test',messages,tools:[{function:{name:'read_file',description:'read',parameters:{type:'object',properties:{path:{type:'string'}}}}}],fetcher};
 const first=await geminiChat(options);assert.equal(first.message.tool_calls[0].function.name,'read_file');
 await geminiChat({...options,messages:[...messages,{role:'assistant',...first.message},{role:'tool',tool_name:'read_file',content:'{"content":"data"}'}]});
});

test('Copilot Studio uses conversation token, drains greetings and returns bot output',async()=>{
 const auth=[],calls=[];
 const fetcher=async(url,init)=>{
  auth.push(init.headers.Authorization);calls.push(String(url));
  if(url.endsWith('/tokens/generate'))return Response.json({token:'token-one'});
  if(url.endsWith('/conversations'))return Response.json({conversationId:'conversation',token:'token-two'});
  if(init.method==='POST')return Response.json({id:'activity'});
  if(url.includes('watermark='))return Response.json({watermark:'2',activities:[{type:'message',from:{id:'bot',role:'bot'},text:'Skutočná odpoveď'}]});
  return Response.json({watermark:'1',activities:[{type:'message',from:{role:'bot'},text:'Greeting'}]});
 };
 const result=await copilotStudioChat({secret:'direct-line-secret',query:'Ahoj',fetcher,pollMs:0});
 assert.equal(result.message.content,'Skutočná odpoveď');assert.equal(auth[0],'Bearer direct-line-secret');assert.equal(auth[2],'Bearer token-two');assert.ok(!JSON.stringify(result).includes('secret'));
});

test('shared notes import remote changes, retain conflicts and avoid replaying accepted edits',async()=>{
 const id=crypto.randomUUID(),other=crypto.randomUUID();let sent=0;
 const cloud={call:async(_name,input)=>{if(input.changes?.length){sent++;return {accepted:[],conflicts:[{id,current:{id,text:'cloud version',deleted:false,revision:2}}]};}return {notes:[{id,text:'cloud version',revision:2},{id:other,text:'remote note',deleted:false,revision:1}],next_cursor:null};}};
 const result=await syncNotes(cloud,[{id,text:'my local version',cloud_revision:1,sync_dirty:true}]);
 assert.equal(result.conflicts.length,1);assert.equal(result.notes.find(n=>n.id===id).text,'my local version');assert.equal(result.notes.find(n=>n.id===other).text,'remote note');assert.equal(sent,1);
});

test('Microsoft Graph Engine reads mail, calendar, and storage without error and returns data (approval: false)', async () => {
  const calls = [];
  const mockFetch = async (url, init) => {
    calls.push({ url: String(url), method: init.method || 'GET', headers: init.headers });
    if (url.includes('/messages')) {
      return Response.json({
        value: [
          { id: 'msg-001', subject: 'Trinity Report', from: { emailAddress: { name: 'Tenant Admin', address: 'usc31@saboivan2008gmail.onmicrosoft.com' } }, isRead: true }
        ]
      });
    }
    if (url.includes('/calendarView') || url.includes('/events')) {
      return Response.json({
        value: [
          { id: 'evt-001', subject: 'Sovereign Core Review', start: { dateTime: '2026-10-30T10:00:00Z' } }
        ]
      });
    }
    if (url.includes('/drive/root/children') || url.includes('/drive')) {
      return Response.json({
        value: [
          { id: 'file-001', name: 'OVERENIE.md', size: 1024 }
        ]
      });
    }
    return Response.json({ value: [] });
  };

  const credentials = new Map([
    ['microsoft-tenant', 'mock-entra-token-999'],
    ['microsoft-personal', 'mock-personal-token-888']
  ]);
  const vault = {
    get: async n => credentials.get(n) || '',
    set: async (n, v) => credentials.set(n, v)
  };

  // 1. Mail list (Tenant Profile)
  const mailResult = await executeGraphOperation({
    profile: 'entra_id',
    service: 'mail',
    operation: 'list',
    vault,
    fetcher: mockFetch
  });
  assert.equal(mailResult.ok, true);
  assert.equal(mailResult.approval, false);
  assert.equal(mailResult.profile, 'entra_id');
  assert.equal(mailResult.data[0].subject, 'Trinity Report');
  assert.equal(calls[0].headers.Authorization, 'Bearer mock-entra-token-999');

  // 2. Calendar list (Personal Profile)
  const calResult = await executeGraphOperation({
    profile: 'personal_msa',
    service: 'calendar',
    operation: 'list',
    vault,
    fetcher: mockFetch
  });
  assert.equal(calResult.ok, true);
  assert.equal(calResult.approval, false);
  assert.equal(calResult.profile, 'personal_msa');
  assert.equal(calResult.data[0].subject, 'Sovereign Core Review');
  assert.equal(calls[1].headers.Authorization, 'Bearer mock-personal-token-888');

  // 3. Storage list (Personal Profile)
  const storageResult = await executeGraphOperation({
    profile: 'personal_msa',
    service: 'storage',
    operation: 'list',
    vault,
    fetcher: mockFetch
  });
  assert.equal(storageResult.ok, true);
  assert.equal(storageResult.approval, false);
  assert.equal(storageResult.data[0].name, 'OVERENIE.md');
  assert.equal(calls[2].headers.Authorization, 'Bearer mock-personal-token-888');

  // 4. Missing credential verification
  const emptyVault = { get: async () => '', set: async () => {} };
  await assert.rejects(
    executeGraphOperation({ profile: 'entra_id', service: 'mail', operation: 'list', vault: emptyVault, fetcher: mockFetch }),
    /poverenie|kľúč|token/i
  );
});

test('Microsoft Graph Engine mutating operations intercept and generate system_action in status proposed (approval: true)', async () => {
  let physicalHttpCalls = 0;
  const mockFetch = async () => {
    physicalHttpCalls++;
    return Response.json({ error: 'Should not be called directly!' }, { status: 500 });
  };

  const credentials = new Map([
    ['microsoft-tenant', 'mock-entra-token'],
    ['microsoft-personal', 'mock-personal-token']
  ]);
  const vault = {
    get: async n => credentials.get(n) || '',
    set: async (n, v) => credentials.set(n, v)
  };

  const cloudCalls = [];
  const cloud = {
    call: async (name, args) => {
      cloudCalls.push({ name, args });
      return { id: crypto.randomUUID(), status: 'proposed' };
    }
  };

  // 1. Mutating Mail: sendMail
  const mailAction = await executeGraphOperation({
    profile: 'personal_msa',
    service: 'mail',
    operation: 'send',
    parameters: {
      to: ['basterix@example.com'],
      subject: 'Guarded Report',
      body: 'Content for review'
    },
    vault,
    fetcher: mockFetch,
    cloud
  });
  assert.equal(mailAction.approval, true);
  assert.equal(mailAction.status, 'proposed');
  assert.equal(mailAction.action, 'share');
  assert.ok(mailAction.id);
  assert.equal(mailAction.payload.to[0], 'basterix@example.com');
  assert.equal(mailAction.payload.profile, 'personal_msa');

  // 2. Mutating Calendar: createEvent
  const calAction = await executeGraphOperation({
    profile: 'entra_id',
    service: 'calendar',
    operation: 'create',
    parameters: {
      subject: 'Architecture Alignment',
      start: '2026-10-31T14:00:00Z',
      end: '2026-10-31T15:00:00Z'
    },
    vault,
    fetcher: mockFetch,
    cloud
  });
  assert.equal(calAction.approval, true);
  assert.equal(calAction.status, 'proposed');
  assert.equal(calAction.action, 'write');
  assert.equal(calAction.payload.subject, 'Architecture Alignment');
  assert.equal(calAction.payload.profile, 'entra_id');

  // 3. Mutating Storage: uploadFile
  const storageAction = await executeGraphOperation({
    profile: 'personal_msa',
    service: 'storage',
    operation: 'upload',
    parameters: {
      path: '/Trinity',
      fileName: 'artifact.json',
      content: '{"verified":true}'
    },
    vault,
    fetcher: mockFetch,
    cloud
  });
  assert.equal(storageAction.approval, true);
  assert.equal(storageAction.status, 'proposed');
  assert.equal(storageAction.action, 'upload');
  assert.equal(storageAction.payload.fileName, 'artifact.json');

  // CRITICAL HITL VERIFICATION: Zero physical mutating HTTP calls executed!
  assert.equal(physicalHttpCalls, 0, 'No physical mutating HTTP requests should be dispatched without explicit owner approval');
});

test('Microsoft Graph Engine isolates dual profiles between Entra ID and Personal MSA', async () => {
  const requests = [];
  const mockFetch = async (url, init) => {
    requests.push({ url: String(url), token: init.headers.Authorization });
    return Response.json({ value: [] });
  };

  const credentials = new Map([
    ['microsoft-tenant', 'entra-only-token-abc'],
    ['microsoft-personal', 'personal-only-token-xyz']
  ]);
  const vault = {
    get: async n => credentials.get(n) || '',
    set: async (n, v) => credentials.set(n, v)
  };

  // 1. Entra ID query must use microsoft-tenant key and Entra ID account
  const entraRes = await executeGraphOperation({
    profile: 'entra_id',
    service: 'mail',
    operation: 'list',
    vault,
    fetcher: mockFetch
  });
  assert.equal(entraRes.account, 'usc31@saboivan2008gmail.onmicrosoft.com');
  assert.equal(requests[0].token, 'Bearer entra-only-token-abc');

  // 2. Personal MSA query must use microsoft-personal key and Personal account
  const personalRes = await executeGraphOperation({
    profile: 'personal_msa',
    service: 'mail',
    operation: 'list',
    vault,
    fetcher: mockFetch
  });
  assert.equal(personalRes.account, 'saboivan2008@gmail.com');
  assert.equal(requests[1].token, 'Bearer personal-only-token-xyz');

  // 3. Vault isolation: Entra token missing in tenant-only vault
  const tenantOnlyVault = {
    get: async n => n === 'microsoft-tenant' ? 'entra-token' : '',
    set: async () => {}
  };
  await assert.rejects(
    executeGraphOperation({ profile: 'personal_msa', service: 'mail', operation: 'list', vault: tenantOnlyVault, fetcher: mockFetch }),
    /poverenie|kľúč|token/i
  );

  // 4. Invalid profile rejection
  await assert.rejects(
    executeGraphOperation({ profile: 'unknown_profile', service: 'mail', operation: 'list', vault, fetcher: mockFetch }),
    /profil|profile/i
  );
});
