import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyCloudflareToken} from '../src/cloudflare-token.js';

const accountId='b'.repeat(32);
test('missing token is not connected and never invokes Cloudflare',async()=>{
  const result=await verifyCloudflareToken('',accountId,{fetcher:()=>{throw Error('unexpected call')}});
  assert.deepEqual(result,{verified:false,status:'missing',scope:null,http_status:null});
});

test('user-owned active token is verified without account fallback',async()=>{
  const urls=[];
  const result=await verifyCloudflareToken('synthetic',accountId,{fetcher:async url=>{
    urls.push(url);return Response.json({success:true,result:{status:'active'}});
  }});
  assert.equal(result.verified,true);
  assert.equal(result.scope,'user');
  assert.equal(urls.length,1);
  assert.doesNotMatch(JSON.stringify(result),/synthetic/);
});

test('account-owned token falls back to correct API endpoint after user endpoint 401',async()=>{
  const urls=[];
  const result=await verifyCloudflareToken('synthetic',accountId,{fetcher:async url=>{
    urls.push(url);
    if(url.includes('/user/tokens/verify'))return Response.json({success:false},{status:401});
    return Response.json({success:true,result:{status:'active'}});
  }});
  assert.equal(result.verified,true);
  assert.equal(result.scope,'account');
  assert.match(urls[1],new RegExp('/accounts/'+accountId+'/tokens/verify$'));
});

test('disabled or expired token is never accepted despite successful HTTP response',async()=>{
  for(const status of ['disabled','expired']){
    const result=await verifyCloudflareToken('synthetic',accountId,{fetcher:async()=>Response.json({success:true,result:{status}})});
    assert.equal(result.verified,false);
    assert.equal(result.status,status);
  }
});

test('unknown status, 200 with success false and network failure fail closed',async()=>{
  const cases=[
    async()=>Response.json({success:true,result:{status:'something-else'}}),
    async()=>Response.json({success:false,result:{status:'active'}}),
    async()=>{throw Error('Synthetic network error with synthetic secret')},
  ];
  for(const fetcher of cases){
    const result=await verifyCloudflareToken('synthetic-private',accountId,{fetcher});
    assert.equal(result.verified,false);
    assert.doesNotMatch(JSON.stringify(result),/synthetic-private|Synthetic network error/);
  }
});

test('invalid account ID is not interpolated in an API URL',async()=>{
  let calls=0;
  const result=await verifyCloudflareToken('synthetic','../account',{fetcher:async url=>{
    calls++;
    assert.match(url,/\/user\/tokens\/verify$/);
    return Response.json({success:false},{status:403});
  }});
  assert.equal(result.verified,false);
  assert.equal(calls,1);
});
