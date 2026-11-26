import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyGitHub} from '../src/secret-vault.js';

test('GitHub credential verification targets only the canonical repository',async()=>{
 const original=globalThis.fetch;
 const requested=[];
 try{
  globalThis.fetch=async url=>{
   requested.push(url);
   return String(url).endsWith('/user')?Response.json({login:'test-user'}):Response.json({id:1});
  };
  const out=await verifyGitHub('synthetic-token');
  assert.equal(out.repository,'uscolective-byte/Trinity-antigravity');
  assert.equal(out.permission_verified,'read');
  assert.equal(out.repository_access,true);
  assert.equal(requested.some(url=>String(url).includes('trinity-morhfeus')),false);
  assert.doesNotMatch(JSON.stringify(out),/synthetic-token/);
 }finally{globalThis.fetch=original;}
});

test('GitHub token without canonical repo access is not verified',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async url=>String(url).endsWith('/user')?Response.json({login:'test-user'}):Response.json({message:'Not Found'},{status:404});
  await assert.rejects(()=>verifyGitHub('synthetic-token'),/kanonickému repozitáru/);
 }finally{globalThis.fetch=original;}
});
