import test from 'node:test';
import assert from 'node:assert/strict';
import {requiresVerifiedAdminForIntegrationTool,runTool} from '../src/tools.js';

test('read-only Cloudflare/GitHub/Firebase operations do not require mutation authority',()=>{
  for(const [name,action] of [
    ['cloudflare_manage','status'],['cloudflare_manage','list_dns_zones'],
    ['github_manage','repo_info'],['github_manage','list_commits'],
    ['firebase_manage','get_document']
  ])assert.equal(requiresVerifiedAdminForIntegrationTool(name,{action}),false);
  assert.equal(requiresVerifiedAdminForIntegrationTool('cloudflare_manage',null),false);
});

test('state-changing Cloudflare/GitHub/Firebase calls require verified admin or owner context',async()=>{
  for(const [name,action] of [
    ['cloudflare_manage','purge_cache'],
    ['github_manage','create_issue'],['github_manage','update_issue'],
    ['github_manage','dispatch_workflow'],
    ['firebase_manage','set_document']
  ]){
    assert.equal(requiresVerifiedAdminForIntegrationTool(name,{action}),true,name+'/'+action);
    await assert.rejects(
      ()=>runTool({}, {id:'model',tools:[name]}, name, {action}, {adminAuthorized:false,ownerMode:false}),
      /serverom overeného vlastníka/,
      name+'/'+action
    );
  }
});
