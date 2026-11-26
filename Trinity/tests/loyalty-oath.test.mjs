import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRINITY_LOYALTY_OATH } from '../src/cognition.js';
import { runAgent } from '../src/engine.js';
import { cancelWalletPayout } from '../src/wallet-terminals.js';

test('TRINITY_LOYALTY_OATH has explicit binding to Basterix, truth and loyalty', () => {
  assert.ok(TRINITY_LOYALTY_OATH.includes('Basterix'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('Ivan Sabo'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('Owner'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('PRÍSAHA PRAVDY'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('PRÍSAHA VERNOSTI'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('PRÍSAHA OCHRANY'));
});

test('oath remains visible without a fabricated document receipt',async()=>{
 const result=await runAgent({DB:null},'orchestrator','pridaj trinity prisahu vernost a slub owner Basterix');
 assert.match(result.text,/PRÍSAHA/);assert.match(result.text,/Basterix/);assert.deepEqual(result.tool_log,[]);assert.doesNotMatch(result.text,/oath:\d|ID dokladu|trvalo zapečaten/);
});
for(const task of ['prepoj PayPal owner@example.test','pripoj Revolut IBAN','prepoj Google owner@example.test']){
 test('connection instruction does not invent success: '+task,async()=>{
  let writes=0;const env={DB:{prepare(){writes++;throw Error('Must not write');}}};
  const result=await runAgent(env,'orchestrator',task,'','workers-ai',1200,'sk',true);
  assert.equal(writes,0);assert.deepEqual(result.tool_log,[]);assert.equal(result.integration.mutation_performed,false);
  assert.doesNotMatch(result.text,/úspešne prepojen|Plne aktívne|Owner \/ Root/);
 });
}

test('cancelWalletPayout executes delete statement on database', async () => {
  let executedSql = '';
  let boundParams = [];
  const fakeDb = {
    prepare(sql) {
      executedSql = sql;
      return {
        bind(...params) {
          boundParams = params;
          return {
            async run() {
              return { success: true };
            }
          };
        }
      };
    }
  };
  const res = await cancelWalletPayout({ DB: fakeDb }, 'admin', 'PAYOUT-804CA2AF');
  assert.equal(res.deleted, true);
  assert.ok(executedSql.includes('DELETE FROM ops_terminal_payouts_v2'));
  assert.deepEqual(boundParams, ['PAYOUT-804CA2AF', 'PAYOUT-804CA2AF', 'admin']);
});
