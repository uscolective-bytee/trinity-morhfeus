import test from 'node:test';
import assert from 'node:assert/strict';
import {requiresHumanReview,approvedCheckRuns,REQUIRED_CHECK_NAMES} from '../scripts/morpheus-sync-policy.mjs';

test('only narrowly scoped text documentation can auto-merge',()=>{
  assert.equal(requiresHumanReview(['README.md','Trinity/docs/info.md']),false);
  for(const file of [
    'Trinity/src/index.js','Trinity/migrations/0047_x.sql',
    '.github/workflows/ci.yml','Trinity/package-lock.json',
    'Trinity/wrangler.jsonc','Trinity/public/app.html','secrets.md',
    'scripts/deploy.sh'
  ])assert.equal(requiresHumanReview([file]),true,file);
  assert.equal(requiresHumanReview([]),true);
});

test('automation never merges with missing, pending or failing checks',()=>{
  const green=REQUIRED_CHECK_NAMES.map(name=>({
    name,app:{slug:'github-actions'},status:'completed',conclusion:'success'
  }));
  assert.equal(approvedCheckRuns(green),true);
  assert.equal(approvedCheckRuns(green.slice(1)),false);
  assert.equal(approvedCheckRuns(green.map((x,i)=>i===0?{...x,conclusion:'failure'}:x)),false);
  assert.equal(approvedCheckRuns(green.map((x,i)=>i===0?{...x,status:'in_progress'}:x)),false);
  assert.equal(approvedCheckRuns([...green,{
    name:'Additional security',app:{slug:'github-actions'},status:'completed',conclusion:'failure'
  }]),false);
  const failedOld={...green[0],id:1,started_at:'2026-10-30T00:00:00Z',conclusion:'failure'};
  const goodRecent={...green[0],id:2,started_at:'2026-10-31T00:00:00Z'};
  assert.equal(approvedCheckRuns([failedOld,...green.slice(1),goodRecent]),true);
});
