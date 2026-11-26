import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSecretAuditTargets,summarizeSecretPresence} from '../../scripts/audit-worker-secrets.mjs';

test('audit targets real staging instead of silently falling back to production',()=>{
 const targets=selectSecretAuditTargets({name:'trinity',env:{staging:{name:'trinity-staging'}}});
 assert.deepEqual(targets.map(item=>[item.environment,item.flag]),[
  ['production','--env='],['staging','--env=staging']
 ]);
 assert.equal(targets[1].config.name,'trinity-staging');
});

test('audit supports explicit development only when it exists',()=>{
 const targets=selectSecretAuditTargets({env:{development:{name:'trinity-development'}}});
 assert.deepEqual(targets.map(item=>item.environment),['production','development']);
});

test('secret report never exposes secret values or unallowlisted names',()=>{
 const fakeValue='fake-secret-value-DO-NOT-PRINT';
 const report=summarizeSecretPresence([
  {name:'META_APP_SECRET',value:fakeValue},
  {name:'CUSTOM_UNLISTED_SECRET',value:fakeValue}
 ],{GOOGLE_CLIENT_ID:'example-public-client-id'});
 const output=JSON.stringify(report);
 assert.equal(report.secret_count,2);
 assert.equal(report.groups.integrations.META_APP_SECRET,'secret-present');
 assert.equal(report.groups.google.GOOGLE_CLIENT_ID,'configured-variable');
 assert.equal(report.groups.integrations.TELEGRAM_BOT_TOKEN,'not-present');
 assert.equal(report.groups.operations.CLOUDFLARE_API_TOKEN,'not-present');
 assert.equal(report.groups.operations.TRINITY_CF_TOKEN,'not-present');
 assert.equal(output.includes(fakeValue),false);
 assert.equal(output.includes('CUSTOM_UNLISTED_SECRET'),false);
});

test('malformed CLI results are rejected rather than misreported',()=>{
 assert.throws(()=>summarizeSecretPresence({rows:[]}),/Unexpected secret-list/);
 assert.throws(()=>summarizeSecretPresence([{secret:'no name'}]),/Unexpected secret-list/);
});
