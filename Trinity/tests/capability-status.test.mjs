import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeCapabilities} from '../src/capability-status.js';

test('heartbeat and configured secrets cannot masquerade as completed PC execution',()=>{
  const env={TRINITY_GATEWAY_KEY:'never-return-this',AI:{},DB:{},ARTIFACTS:{}};
  const now=2_000_000;
  const receipt={action:'read',status:'completed',completed_at:now-1000,receipt_json:'{"bytes":5}'};
  const find=(report,id)=>report.groups.find(item=>item.id===id);
  assert.equal(find(summarizeCapabilities(env,{connected:true},[],now),'files').status,'not-verified');
  assert.equal(find(summarizeCapabilities(env,{connected:false},[receipt],now),'files').status,'offline');
  const report=summarizeCapabilities(env,{connected:true},[receipt],now);
  assert.equal(find(report,'files').execution_verified,true);
  assert.equal(find(report,'build').execution_verified,false);
  const script={...receipt,action:'run',receipt_json:'{"task":"script","success":true}'};
  assert.equal(find(summarizeCapabilities(env,{connected:true},[script],now),'scripts').execution_verified,true);
  assert.equal(find(summarizeCapabilities(env,{connected:true},[script],now),'build').execution_verified,false);
  assert.equal(find(summarizeCapabilities(env,{connected:true},[{...script,receipt_json:'{"task":"node-version","success":true}'}],now),'scripts').execution_verified,false);
  assert.equal(JSON.stringify(report).includes('never-return-this'),false);
  for(const row of [{...receipt,completed_at:0},{...receipt,completed_at:now+1000},{...receipt,receipt_json:'{}'},{...receipt,receipt_json:'{"success":false}'},{...receipt,receipt_json:'invalid'}]){
    assert.equal(find(summarizeCapabilities(env,{connected:true},[row],now),'files').execution_verified,false);
  }
  assert.equal(find(summarizeCapabilities({}, {connected:true},[receipt],now),'files').status,'not-configured');
});
