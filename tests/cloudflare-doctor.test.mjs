import test from 'node:test';
import assert from 'node:assert/strict';
import {configStatus} from '../scripts/cloudflare-doctor.mjs';

test('Cloudflare doctor distinguishes production, staging and shared resources',()=>{
 const config={
  name:'trinity',routes:[{pattern:'auru.space'}],
  d1_databases:[{binding:'DB',database_id:'prod-id'}],
  kv_namespaces:[{id:'shared-kv'}],r2_buckets:[{bucket_name:'shared-r2'}],
  env:{staging:{
   name:'trinity-staging',routes:[{pattern:'auru.dev'}],
   d1_databases:[{binding:'DB',database_id:'stage-id'}],
   kv_namespaces:[{id:'shared-kv'}],r2_buckets:[{bucket_name:'shared-r2'}]
  }}
 };
 const report=configStatus(config);
 assert.equal(report.production_worker,'trinity');
 assert.equal(report.staging_worker,'trinity-staging');
 assert.equal(report.production_route,true);
 assert.equal(report.staging_route,true);
 assert.equal(report.d1_environment_isolation,true);
 assert.equal(report.kv_shared_namespaces,1);
 assert.equal(report.r2_shared_buckets,1);
 assert.doesNotMatch(JSON.stringify(report),/prod-id|stage-id|shared-r2|shared-kv/);
});

test('Cloudflare doctor refuses to claim isolated D1 without two distinct IDs',()=>{
 const report=configStatus({d1_databases:[{binding:'DB',database_id:'x'}],env:{staging:{d1_databases:[{binding:'DB',database_id:'x'}]}}});
 assert.equal(report.d1_environment_isolation,false);
 assert.equal(report.production_route,false);
 assert.equal(report.staging_route,false);
});
