import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import {validateAudit,verifySignature,handleRequest} from '../src/index.mjs';

const key='audit-development-test-key-32-characters-minimum';
const valid=()=>({event_id:randomUUID(),repo:'uscolective-byte/trinity-morhfeus',sha:'f'.repeat(40),status:'success',trigger:'push'});
test('validates allowlisted repository',()=>{
 assert.equal(validateAudit(valid(),['uscolective-byte/trinity-morhfeus']),null);
 assert.match(validateAudit(valid(),['other/repo']),/not allowed/);
 assert.match(validateAudit({...valid(),sha:'broken'},['uscolective-byte/trinity-morhfeus']),/SHA/);
});
test('HMAC binds timestamp and payload',async()=>{
 const raw=JSON.stringify(valid());
 const timestamp=String(Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',key).update(timestamp+'.'+raw).digest('hex');
 const headers=new Headers({'X-Trinity-Audit-Timestamp':timestamp,'X-Trinity-Audit-Signature':'sha256='+signature});
 assert.equal(await verifySignature(headers,raw,key),true);
 assert.equal(await verifySignature(headers,raw+' ',key),false);
});
test('audit fails closed without configured database',async()=>{
 const body=JSON.stringify(valid());
 const response=await handleRequest(new Request('https://audit.test/v1/audit',{method:'POST',headers:{'content-type':'application/json'},body}),{});
 assert.equal(response.status,503);
});
test('parameterized D1 insert succeeds',async()=>{
 const body=JSON.stringify(valid()),timestamp=String(Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',key).update(timestamp+'.'+body).digest('hex');
 let query='',bound=[];
 const env={AUDIT_HMAC_KEY:key,AUDIT_ALLOWED_REPOS:'uscolective-byte/trinity-morhfeus',DB:{
  prepare(sql){query=sql;return {bind(...values){bound=values;return {run:async()=>({meta:{changes:1}})};}}}
 }};
 const response=await handleRequest(new Request('https://audit.test/v1/audit',{method:'POST',headers:{'content-type':'application/json','X-Trinity-Audit-Timestamp':timestamp,'X-Trinity-Audit-Signature':'sha256='+signature},body}),env);
 assert.equal(response.status,201);
 assert.match(query,/INSERT INTO ops_ci_audit_log/);
 assert.match(query,/VALUES/);
 assert.equal(bound[1],'uscolective-byte/trinity-morhfeus');
});
test('unsigned and expired audit requests never touch D1',async()=>{
 const body=JSON.stringify(valid());let touched=false;
 const env={AUDIT_HMAC_KEY:key,AUDIT_ALLOWED_REPOS:'uscolective-byte/trinity-morhfeus',DB:{prepare(){touched=true;throw Error('must not write');}}};
 const timestamp=String(Math.floor(Date.now()/1000)-600);
 const signature=createHmac('sha256',key).update(timestamp+'.'+body).digest('hex');
 for(const extra of [{},{'X-Trinity-Audit-Timestamp':timestamp,'X-Trinity-Audit-Signature':'sha256='+signature}]){
  const response=await handleRequest(new Request('https://audit.test/v1/audit',{method:'POST',headers:{'content-type':'application/json',...extra},body}),env);
  assert.equal(response.status,401);
 }
 assert.equal(touched,false);
});
test('OpenAPI documents the actual signed endpoint without exposing logs',async()=>{
 const response=await handleRequest(new Request('https://audit.test/openapi.json'),{});
 assert.equal(response.status,200);
 const spec=await response.json();assert.ok(spec.paths['/v1/audit'].post);
 assert.equal(spec.components.securitySchemes.auditSignature.name,'X-Trinity-Audit-Signature');
 assert.equal((await handleRequest(new Request('https://audit.test/v1/audit'),{})).status,405);
});
