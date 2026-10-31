import assert from 'node:assert/strict';
import test from 'node:test';
import {recordLedgerEntry,queryLedger,ledgerEntrySchema} from '../src/os-registry.js';

const entry=(overrides={})=>({
  agent:'CODEX',role:'Architect',type:'WORK',status:'running',task:'Pentad audit',
  message:'Audit in progress',evidence:null,idempotency_key:crypto.randomUUID(),...overrides
});

function ledgerDb(){
  const rows=[];
  return {rows,prepare(sql){let params=[];return {bind(...values){params=values;return this;},async first(){
    if(sql.includes('INSERT INTO sovereign_ledger')){
      if(rows.some(row=>row.idempotency_key===params[10]))return null;
      const row={id:params[0],timestamp:params[1],agent:params[2],role:params[3],type:params[4],status:params[5],task:params[6],message:params[7],evidence:params[8],principal:params[9],idempotency_key:params[10],input_hash:params[11],created_at:params[12]};
      rows.push(row);return row;
    }
    if(sql.includes('WHERE idempotency_key='))return rows.find(row=>row.idempotency_key===params[0])||null;
    return null;
  },async all(){return {results:rows};}};}};
}

test('Sovereign Ledger rejects invalid schema attributes',()=>{
  assert.throws(()=>ledgerEntrySchema.parse({type:'WORK',status:'running'}));
  assert.throws(()=>ledgerEntrySchema.parse(entry({type:'INVALID_TYPE'})));
  assert.throws(()=>ledgerEntrySchema.parse(entry({status:'unknown_status'})));
  assert.throws(()=>ledgerEntrySchema.parse(entry({idempotency_key:'not-a-uuid'})));
});

test('Sovereign Ledger enforces completed evidence before D1',async()=>{
  const DB=ledgerDb();
  await assert.rejects(()=>recordLedgerEntry({DB},entry({status:'completed'}),'user:owner'),error=>error.status===400&&/completed_requires_evidence/.test(error.message));
  assert.equal(DB.rows.length,0);
});

test('Sovereign Ledger stores authenticated principal and evidence',async()=>{
  const DB=ledgerDb();
  const stored=await recordLedgerEntry({DB},entry({status:'completed',evidence:'commit 147157f; tests 524/524'}),'api-key:codex');
  assert.match(stored.id,/^ledger_[0-9a-f-]{36}$/);assert.equal(stored.principal,'api-key:codex');
  assert.equal(stored.status,'completed');assert.equal(stored.duplicate,false);assert.match(stored.input_hash,/^[a-f0-9]{64}$/);
});

test('Sovereign Ledger replays identical idempotency key and rejects changed content',async()=>{
  const DB=ledgerDb(),original=entry();
  const first=await recordLedgerEntry({DB},original,'agent:codex');
  const replay=await recordLedgerEntry({DB},original,'agent:codex');
  assert.equal(replay.id,first.id);assert.equal(replay.duplicate,true);
  await assert.rejects(()=>recordLedgerEntry({DB},{...original,message:'different'},'agent:codex'),error=>error.status===409&&/idempotency_conflict/.test(error.message));
  assert.equal(DB.rows.length,1);
});

test('Sovereign Ledger requires a server-derived principal',async()=>{
  const DB=ledgerDb();
  await assert.rejects(()=>recordLedgerEntry({DB},entry(),''),error=>error.status===401&&/authenticated_principal_required/.test(error.message));
});

test('Sovereign Ledger queries records with bounded filters',async()=>{
  let boundParams=[],boundSql='';
  const mockRows=[{id:'l1',agent:'CODEX',type:'WORK',status:'completed'}];
  const env={DB:{prepare(sql){return {bind(...params){boundSql=sql;boundParams=params;return {all:async()=>({results:mockRows})};}};}}};
  const result=await queryLedger(env,{agent:'CODEX',status:'completed',limit:10});
  assert.equal(result.entries.length,1);assert.match(boundSql,/agent = \?1/);assert.match(boundSql,/status = \?2/);assert.deepEqual(boundParams,['CODEX','completed',10]);
});
