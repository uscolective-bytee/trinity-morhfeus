import test from 'node:test';
import assert from 'node:assert/strict';
import {findUnsupportedActionClaims, truthStatus, safeTruthResponse} from '../src/truth.js';
import {runAgent,toolReceiptForOutcome} from '../src/engine.js';
const text='Výsledok nástroja calculate je: 42';
test('named tool result requires a successful receipt for the same tool',()=>{
  for(const receipts of [[],[{tool:'calculate',status:'failed',receipt_id:'failed'}],[{tool:'calculate',status:'completed'}],[{tool:'service_status',status:'completed',receipt_id:'other'}]]){
    assert.deepEqual(findUnsupportedActionClaims(text,receipts),['tool_result:calculate']);
  }
  assert.deepEqual(findUnsupportedActionClaims(text,[{tool:'calculate',status:'completed',receipt_id:'actual-calculator'}]),[]);
});
test('English named result and backtick name are checked without blocking ordinary arithmetic',()=>{
  assert.deepEqual(findUnsupportedActionClaims('The result of tool `calculate` is: 42',[]),['tool_result:calculate']);
  assert.deepEqual(findUnsupportedActionClaims('17 + 25 = 42.',[]),[]);
  assert.deepEqual(findUnsupportedActionClaims('Nemám overený výsledok nástroja calculate.',[]),[]);
});
test('engine cannot escape the truth check by removing JSON from a fabricated result',async()=>{
  const result=await runAgent({AI:{run:async()=>({response:text})}},'orchestrator','Daj výsledok pomenovaného nástroja bez volania.','','fast');
  assert.equal(result.tool_log.length,0);
  assert.match(result.text,/Nemám overený/);
  assert.doesNotMatch(result.text,/Výsledok nástroja calculate je/);
});
test('generic tool lifecycle never turns failure or partial work into a completed receipt',()=>{
  const timestamp='2026-10-26T07:10:00.000Z';
  const failed=toolReceiptForOutcome('delegate_worker',{ok:false,status:'not_configured',error:'missing'},timestamp);
  assert.equal(failed.status,'failed');
  assert.equal(failed.receipt_id,undefined);
  assert.equal(failed.effect,'diagnostic');
  const partial=toolReceiptForOutcome('orchestrate_team',{ok:false,status:'partial'},timestamp);
  assert.equal(partial.status,'partial');
  assert.equal(partial.receipt_id,undefined);
  const running=toolReceiptForOutcome('pc_run',{status:'claimed',id:'action-1'},timestamp);
  assert.equal(running.status,'running');
  assert.equal(running.effect,'proposal');
  const completed=toolReceiptForOutcome('calculate',{value:42},timestamp);
  assert.equal(completed.status,'completed');
  assert.match(completed.receipt_id,/^[0-9a-f-]{36}$/);
});

test('hardcore truth policy blocks fabricated document generation and phantom document UUID', ()=>{
  const docClaim = 'Dokumentácia projektu Trinity bola úspešne vygenerovaná a uložená v systéme Trinity Documents. ID dokumentu je 6ae21730-15e8-4ff6-bd4a-af6bfb8facbc.';
  const blockedClaims = findUnsupportedActionClaims(docClaim, []);
  assert.ok(blockedClaims.includes('create_file'), 'Should flag create_file action claim');
  assert.ok(blockedClaims.includes('unsupported_document_id:6ae21730-15e8-4ff6-bd4a-af6bfb8facbc'), 'Should flag phantom document UUID');

  // When completed receipt with matching document UUID is provided:
  const validReceipt = {
    tool: 'trinity_doc_create',
    status: 'completed',
    effect: 'mutation',
    actions: ['create_file'],
    receipt_id: 'doc:6ae21730-15e8-4ff6-bd4a-af6bfb8facbc',
    document_id: '6ae21730-15e8-4ff6-bd4a-af6bfb8facbc'
  };
  assert.deepEqual(findUnsupportedActionClaims(docClaim, [validReceipt]), []);
});

test('hardcore truth policy blocks fabricated github issue creation and phantom issue number', ()=>{
  const issueClaim = 'Dokumentácia projektu Trinity bola úspešne vytvorená ako issue číslo 12 v repozitári uscolective-byte/Trinity-antigravity na GitHub.';
  const blockedClaims = findUnsupportedActionClaims(issueClaim, []);
  assert.ok(blockedClaims.includes('publish'), 'Should flag publish action claim');
  assert.ok(blockedClaims.includes('unsupported_github_issue:12'), 'Should flag phantom issue number 12');

  // When completed receipt with matching issue number is provided:
  const validGhReceipt = {
    tool: 'github_manage',
    status: 'completed',
    effect: 'mutation',
    actions: ['change', 'publish'],
    receipt_id: 'github:create_issue:12',
    issue_number: 12
  };
  assert.deepEqual(findUnsupportedActionClaims(issueClaim, [validGhReceipt]), []);
});
