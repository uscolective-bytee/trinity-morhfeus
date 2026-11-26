import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SovereignLedgerV3,
  ComputeBudgetManager,
  TruthAssertionProtocol,
  MultiAgentConsensus,
  CodebaseIntelligence,
  OmnichannelGateway,
  MasterSystemReset,
  CodeProvenanceTracker,
  StateReplayEngine,
  TrinityKernelLayer,
  ZeroTrustSecurityCore
} from '../src/sovereign-core-v3.js';

test('SovereignLedgerV3: Appends blocks with SHA-256 chain links and verifies integrity', async () => {
  const memoryDB = {
    blocks: [],
    prepare(query) {
      return {
        bind(...args) {
          return {
            async run() {
              if (query.includes('INSERT INTO ops_sovereign_ledger')) {
                memoryDB.blocks.push({
                  block_index: args[0],
                  timestamp: args[1],
                  actor: args[2],
                  action: args[3],
                  payload_hash: args[4],
                  prev_hash: args[5],
                  block_hash: args[6],
                  rollback_ref: args[7],
                  payload_json: args[8]
                });
              }
              return { success: true };
            },
            async first() {
              if (query.includes('ORDER BY block_index DESC LIMIT 1')) {
                return memoryDB.blocks[memoryDB.blocks.length - 1] || null;
              }
              return null;
            },
            async all() {
              if (query.includes('ORDER BY block_index ASC')) {
                return { results: memoryDB.blocks };
              }
              return { results: [] };
            }
          };
        }
      };
    }
  };

  const ledger = new SovereignLedgerV3({ DB: memoryDB });

  const b1 = await ledger.appendBlock('admin', 'init_system', { step: 1 });
  assert.equal(b1.block_index, 1);
  assert.ok(b1.block_hash);
  assert.equal(b1.prev_hash, '0000000000000000000000000000000000000000000000000000000000000000');

  const b2 = await ledger.appendBlock('agent:coder', 'write_code', { file: 'core.js' }, 'git:c1234');
  assert.equal(b2.block_index, 2);
  assert.equal(b2.prev_hash, b1.block_hash);
  assert.equal(b2.rollback_ref, 'git:c1234');

  const check = await ledger.verifyIntegrity();
  assert.equal(check.verified, true);
  assert.equal(check.chain_length, 2);
});

test('ComputeBudgetManager: Allocates budgets and prioritizes tasks correctly', () => {
  const critical = ComputeBudgetManager.getBudget('CRITICAL');
  const normal = ComputeBudgetManager.getBudget('NORMAL');
  assert.equal(critical.max_tokens, 4096);
  assert.equal(normal.max_tokens, 1024);

  const tasks = [
    { id: 't1', priority: 'NORMAL' },
    { id: 't2', priority: 'CRITICAL' },
    { id: 't3', priority: 'BACKGROUND' },
    { id: 't4', priority: 'HIGH' }
  ];
  const sorted = ComputeBudgetManager.prioritizeQueue(tasks);
  assert.deepEqual(sorted.map(t => t.id), ['t2', 't4', 't1', 't3']);
});

test('TruthAssertionProtocol: Enforces verifiable proof and rejects failures', () => {
  const verified = TruthAssertionProtocol.assertSuccess('run_test', { exitCode: 0, stdout: 'PASS' });
  assert.equal(verified.truth_verified, true);

  assert.throws(() => {
    TruthAssertionProtocol.assertSuccess('failing_task', { exitCode: 1, error: 'Command failed' });
  }, /Truth Assertion/);

  assert.throws(() => {
    TruthAssertionProtocol.assertSuccess('empty_task', null);
  }, /Truth Assertion Violation/);
});

test('MultiAgentConsensus: Calculates consensus and includes Devil Advocate critique', () => {
  const safeProposal = {
    action: 'add_feature',
    code: 'export function add(a, b) { return a + b; }',
    tests: 'assert.equal(add(1, 2), 3);',
    verification: 'unit_test'
  };
  const result = MultiAgentConsensus.evaluateProposal(safeProposal);
  assert.equal(result.consensus_reached, true);
  assert.ok(result.consensus_score >= 75);
  assert.equal(result.votes.length, 3);
  assert.ok(result.devil_critique);

  const maliciousProposal = {
    action: 'destructive_action',
    command: 'rm -rf / --no-preserve-root'
  };
  const rejected = MultiAgentConsensus.evaluateProposal(maliciousProposal);
  assert.equal(rejected.consensus_reached, false);
});

test('CodebaseIntelligence: Analyzes AST dependencies, synthesizes tests, and resolves conflicts', () => {
  const code = `
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function loadData() {}
export const CONFIG = 123;
`;
  const deps = CodebaseIntelligence.analyzeDependencies(code);
  assert.ok(deps.imports.includes('node:fs/promises'));
  assert.ok(deps.exports.includes('loadData'));
  assert.ok(deps.exports.includes('CONFIG'));

  const testFile = CodebaseIntelligence.synthesizeTestsForModule('myModule', ['compute', 'validate']);
  assert.ok(testFile.includes('myModule Verification Suite'));
  assert.ok(testFile.includes('compute executes deterministically'));

  const merge = CodebaseIntelligence.resolveMergeConflict(
    "import { a } from 'a';",
    "import { a } from 'a'; import { b } from 'b'; export const f1 = 1;",
    "import { a } from 'a'; import { c } from 'c'; export const f2 = 2;"
  );
  assert.equal(merge.resolved, true);
  assert.ok(merge.merged_imports.includes('b'));
  assert.ok(merge.merged_imports.includes('c'));
  assert.ok(merge.merged_exports.includes('f1'));
  assert.ok(merge.merged_exports.includes('f2'));
});

test('OmnichannelGateway: Filters spam and drafts contextual Slovak replies', () => {
  const messages = [
    { sender: 'client1', text: 'Dobrý deň, posielam novú faktúru na úhradu.' },
    { sender: 'bot', text: 'You won crypto casino prize! Click here to claim free cash.' }
  ];
  const scored = OmnichannelGateway.filterAndScoreInbox(messages);
  assert.equal(scored[0].urgency, 'URGENT');
  assert.equal(scored[0].is_spam, false);
  assert.equal(scored[1].is_spam, true);

  const draft = OmnichannelGateway.draftContextualReply(messages[0]);
  assert.ok(draft.draft_reply.includes('Ivan Sabo'));
  assert.equal(draft.requires_owner_approval, true);
});

test('MasterSystemReset: Executes clean rollback and returns cryptographic receipt', async () => {
  const reset = await MasterSystemReset.executeReset({}, 'owner:Basterix', 'Periodic security baseline');
  assert.equal(reset.reset_status, 'SUCCESS');
  assert.ok(reset.snapshot_id.startsWith('snapshot_'));
  assert.ok(reset.receipt.startsWith('receipt:trinity:'));
  assert.ok(reset.active_subsystems_reset.includes('ComputeBudgetManager'));
});

test('CodeProvenanceTracker: Records and verifies code provenance hashes', async () => {
  const tracker = new CodeProvenanceTracker({});
  const rec = await tracker.recordProvenance({
    file: 'engine.js',
    gitCommit: 'abc123456789',
    author: 'Sabo Ivan (Basterix)',
    reason: 'Truth assertion upgrade',
    inputHash: 'hash-in-1',
    machineId: 'PC-Basterix'
  });
  assert.ok(rec.provenance_hash);
  const found = tracker.getProvenance(rec.provenance_hash);
  assert.equal(found.file, 'engine.js');
  assert.equal(found.author, 'Sabo Ivan (Basterix)');
});

test('StateReplayEngine: Captures execution snapshot and verifies deterministic replay', async () => {
  const replayEngine = new StateReplayEngine({});
  const executionId = 'exec-test-001';
  const inputs = { a: 10, b: 20 };
  const mockRunner = async (inp) => ({ sum: inp.a + inp.b });
  const initialResult = await mockRunner(inputs);

  await replayEngine.captureExecution({
    executionId,
    state: { step: 1 },
    inputs,
    codeProvenance: 'prov-hash-123',
    result: initialResult,
    receipt: 'rcpt:123'
  });

  const replayResult = await replayEngine.replayExecution(executionId, mockRunner);
  assert.equal(replayResult.replayed, true);
  assert.equal(replayResult.deterministic_match, true);
  assert.equal(replayResult.original_hash, replayResult.replay_hash);
});

test('TrinityKernelLayer: Dispatches and processes interrupts', () => {
  const kernel = new TrinityKernelLayer({});
  assert.equal(kernel.state, 'BOOTSTRAPPED');
  const interrupt = kernel.dispatchInterrupt('PAUSE', { taskId: 'task-1' }, 'HIGH');
  assert.equal(interrupt.type, 'PAUSE');
  assert.equal(kernel.interruptQueue.length, 1);
  const processed = kernel.processInterrupts();
  assert.equal(processed.length, 1);
  assert.equal(kernel.interruptQueue.length, 0);
});

test('ZeroTrustSecurityCore: Enforces identity, role boundaries, and blocks leaks', () => {
  const allowed = ZeroTrustSecurityCore.evaluateCall({
    actor: 'admin',
    tool: 'pc_screenshot',
    args: {},
    tokenRole: 'admin'
  });
  assert.equal(allowed.allowed, true);

  const blockedFinance = ZeroTrustSecurityCore.evaluateCall({
    actor: 'guest_user',
    tool: 'finance_propose_transfer',
    args: { amount: 10 },
    tokenRole: 'standard'
  });
  assert.equal(blockedFinance.allowed, false);
  assert.ok(blockedFinance.reason.includes('vlastníka'));

  const blockedLeak = ZeroTrustSecurityCore.evaluateCall({
    actor: 'owner',
    tool: 'web_fetch',
    args: { url: 'https://example.com', api_key: 'sk-123456789012345678901234567890' },
    tokenRole: 'owner'
  });
  assert.equal(blockedLeak.allowed, false);
  assert.ok(blockedLeak.reason.includes('kľúča'));
});

