import test from 'node:test';
import assert from 'node:assert/strict';
import {manageCloudflare,manageFirebase,manageGitHub} from '../src/external-integrations.js';
import {toolReceiptForOutcome,pcActionReceipt} from '../src/engine.js';

test('Cloudflare without a token never invents DNS zones, Workers or cache purges',async()=>{
 const missing=()=>{throw Error('Unexpected external fetch');};
 const previous=globalThis.fetch;
 try {
  globalThis.fetch=missing;
  const env={CF_ACCOUNT_ID:'test-account'};
  const status=await manageCloudflare(env,'test','status');
  assert.equal(status.verified,false);
  assert.equal(status.data.connected,false);
  const zones=await manageCloudflare(env,'test','list_dns_zones');
  assert.equal(zones.success,false);
  assert.deepEqual(zones.zones,[]);
  const workers=await manageCloudflare(env,'test','list_workers');
  assert.equal(workers.success,false);
  assert.deepEqual(workers.workers,[]);
  const purge=await manageCloudflare(env,'test','purge_cache',{zoneId:'f'.repeat(32)});
  assert.equal(purge.success,false);
  assert.match(purge.error,/token/i);
  const invalid=await manageCloudflare(env,'test','purge_cache',{zoneId:'zone_auru_space'});
  assert.equal(invalid.success,false);
 } finally {globalThis.fetch=previous;}
});

test('Cloudflare token verifies only after actual API success, with account token fallback',async()=>{
 const previous=globalThis.fetch;
 const calls=[];
 try {
  globalThis.fetch=async url=>{
   calls.push(String(url));
   if(String(url).endsWith('/user/tokens/verify'))return Response.json({success:false},{status:401});
   return Response.json({success:true,result:{status:'active'}});
  };
  const accountId='a'.repeat(32);
  const result=await manageCloudflare({CF_API_TOKEN:'synthetic-token',CF_ACCOUNT_ID:accountId},'test','status');
  assert.equal(result.success,true);
  assert.equal(result.verified,true);
  assert.equal(result.data.connected,true);
  assert.equal(calls.length,2);
  assert.ok(calls[1].includes('/accounts/'+accountId+'/tokens/verify'));
 } finally {globalThis.fetch=previous;}
});

test('Cloudflare API HTTP 200 without API success is not verified',async()=>{
 const previous=globalThis.fetch;
 try {
  globalThis.fetch=async()=>Response.json({success:false,result:{status:'inactive'}});
  const result=await manageCloudflare({CF_API_TOKEN:'synthetic-token'},'test','status');
  assert.equal(result.success,false);
  assert.equal(result.verified,false);
  assert.equal(result.data.connected,false);
 } finally {globalThis.fetch=previous;}
});

test('Firebase never reports a successful write when no provider or D1 confirms it',async()=>{
 const previous=globalThis.fetch;
 try {
  globalThis.fetch=async()=>{throw Error('API must not be called with no OAuth token');};
  const result=await manageFirebase({},'test','set_document',{collection:'test',documentId:'one',data:{value:42}});
  assert.equal(result.success,false);
  assert.equal(result.mirrored_in_d1,false);
  assert.equal(result.firestore_written,false);
  assert.equal(result.status,'failed');
  const bad=await manageFirebase({},'test','set_document',{collection:'../test',documentId:'one'});
  assert.equal(bad.success,false);
 } finally {globalThis.fetch=previous;}
});

test('D1-only Firebase write is partial, not a verified remote Firestore write',async()=>{
 const env={DB:{prepare:()=>({run:async()=>({success:true}),bind:()=>({run:async()=>({success:true})})})}};
 const result=await manageFirebase(env,'test','set_document',{collection:'test',documentId:'one',data:{value:42}});
 assert.equal(result.success,true);
 assert.equal(result.mirrored_in_d1,true);
 assert.equal(result.firestore_written,false);
 assert.equal(result.status,'partial');
});

test('Firestore OAuth write reports remote success only after HTTP confirmation',async()=>{
 const previous=globalThis.fetch;
 try {
  const calls=[];
  globalThis.fetch=async (url,options)=>{
   calls.push({url:String(url),options});
   return new Response('Permission denied',{status:403});
  };
  const env={FIREBASE_API_KEY:'ya29.synthetic-test-token'};
  const failed=await manageFirebase(env,'test','set_document',{collection:'test',documentId:'one',data:{value:42}});
  assert.equal(failed.success,false);
  assert.equal(failed.firestore_written,false);
  assert.equal(failed.firestore_http_status,403);
  assert.ok(!calls[0].url.includes('synthetic-test-token'));
  assert.equal(calls[0].options.headers.Authorization,'Bearer ya29.synthetic-test-token');
  globalThis.fetch=async()=>Response.json({name:'projects/test/databases/(default)/documents/test/one'});
  const done=await manageFirebase(env,'test','set_document',{collection:'test',documentId:'one',data:{value:42}});
  assert.equal(done.success,true);
  assert.equal(done.firestore_written,true);
  assert.equal(done.status,'verified');
 } finally {globalThis.fetch=previous;}
});

test('failure or partial outcome wins over any generated evidence receipt',()=>{
 const failure=toolReceiptForOutcome('cloudflare_manage',{
  success:false,_evidence:{receipt_id:'synthetic:ok',effect:'mutation'},error:'API denied'
 });
 assert.equal(failure.status,'failed');
 assert.equal(failure.receipt_id,undefined);
 const partial=toolReceiptForOutcome('firebase_manage',{
  success:true,status:'partial',_evidence:{receipt_id:'synthetic:done',effect:'mutation'}
 });
 assert.equal(partial.status,'partial');
 assert.equal(partial.receipt_id,undefined);
 const pc=pcActionReceipt({success:false,_evidence:{receipt_id:'synthetic'},error:'offline'});
 assert.equal(pc.status,'failed');
});

test('GitHub dispatch defaults to real CI workflow, never an invented deploy workflow',async()=>{
 const previous=globalThis.fetch;
 try{
  let target;
  globalThis.fetch=async url=>{
   target=String(url);
   return new Response(null,{status:204});
  };
  const result=await manageGitHub({TRINITY_GITHUB_TOKEN:'synthetic-token'},'test','dispatch_workflow');
  assert.equal(result.success,true);
  assert.ok(target.endsWith('/actions/workflows/webpack.yml/dispatches'));
 }finally{globalThis.fetch=previous;}
});

test('PC and generic tool proposals cannot be reported as executed from generated metadata',()=>{
  for(const status of ['proposed','approved','queued','claimed','running']){
    const result={id:'queued-action',status,_evidence:{receipt_id:'not-a-completion',effect:'mutation',actions:['execute']}};
    const pc=pcActionReceipt(result);
    const tool=toolReceiptForOutcome('pc_open_app',result);
    assert.notEqual(pc.status,'completed');
    assert.notEqual(tool.status,'completed');
    assert.equal(pc.receipt_id,'queued-action');
    assert.equal(tool.receipt_id,'queued-action');
  }
  const completed=pcActionReceipt({status:'completed',_evidence:{receipt_id:'actual-gateway-receipt'}});
  assert.equal(completed.status,'completed');
  assert.equal(completed.receipt_id,'actual-gateway-receipt');
  const ambiguous=pcActionReceipt({_evidence:{receipt_id:'not-proof'}});
  assert.equal(ambiguous.status,'pending');
});

test('GitHub public repo reachability is not proof of valid token authorization',async()=>{
  const old=globalThis.fetch;
  try {
    const urls=[];
    globalThis.fetch=async url=>{
      urls.push(String(url));
      return String(url).endsWith('/user')?Response.json({message:'Bad credentials'},{status:401}):
        Response.json({name:'Trinity-antigravity',default_branch:'main'});
    };
    const result=await manageGitHub({TRINITY_GITHUB_TOKEN:'invalid-synthetic'},'test','status');
    assert.equal(result.success,true);
    assert.equal(result.authenticated,false);
    assert.equal(urls.length,2);
    assert.ok(urls[1].endsWith('/user'));
  }finally{globalThis.fetch=old;}
});

test('GitHub mutations reject foreign and legacy repositories before any API call',async()=>{
  const old=globalThis.fetch;
  try{
    globalThis.fetch=async()=>{throw Error('no mutation must be sent');};
    for(const repo of ['uscolective-byte/trinity-morhfeus','other/account','bad/repo/../unsafe']){
      for(const action of ['create_issue','update_issue','dispatch_workflow']){
        const result=await manageGitHub({TRINITY_GITHUB_TOKEN:'synthetic'},'test',action,{repo});
        assert.equal(result.success,false,repo+'/'+action);
      }
    }
    const forbidden=await manageGitHub({TRINITY_GITHUB_TOKEN:'synthetic'},'test','dispatch_workflow',{
      workflowId:'self-deploy.yml'
    });
    assert.equal(forbidden.success,false);
  }finally{globalThis.fetch=old;}
});

test('GitHub workflow dispatch is queued, not a completed workflow',async()=>{
  const old=globalThis.fetch;
  try{
    let target=null;
    globalThis.fetch=async url=>{
      target=String(url);
      return new Response(null,{status:204});
    };
    const result=await manageGitHub({TRINITY_GITHUB_TOKEN:'synthetic'},'test','dispatch_workflow',{workflowId:'runner-smoke.yml'});
    assert.equal(result.success,true);
    assert.equal(result.status,'queued');
    assert.match(target,/runner-smoke\.yml\/dispatches$/);
    const receipt=toolReceiptForOutcome('github_manage',{...result,_evidence:{effect:'mutation',receipt_id:'generated'}});
    assert.equal(receipt.status,'pending');
  }finally{globalThis.fetch=old;}
});
