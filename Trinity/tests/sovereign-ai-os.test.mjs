import assert from 'node:assert/strict';
import test from 'node:test';
import {
  TrinityHealer,
  SovereignScheduler,
  KnowledgeGraphEngine,
  sovereignSkills
} from '../src/sovereign-ai-os.js';
import { skillRegistry } from '../src/skillRegistry.js';

test('Self-Healing Engine: detectIncident accurately classifies runtime faults', () => {
  const healer = new TrinityHealer({});

  // 1. D1 undefined bind violation
  const inc1 = healer.detectIncident({ jobId: 'j-1', error: new Error('D1_ERROR: bind value cannot be undefined') });
  assert.equal(inc1.classification, 'd1_undefined_bind_violation');
  assert.equal(inc1.severity, 'critical');
  assert.match(inc1.recommendedRepair, /sanitizeD1/);

  // 2. Timeout exhausted
  const inc2 = healer.detectIncident({ jobId: 'j-2', error: 'Operation timed out after 8000ms' });
  assert.equal(inc2.classification, 'execution_timeout_exhausted');
  assert.equal(inc2.severity, 'warning');

  // 3. Circuit breaker active
  const inc3 = healer.detectIncident({ jobId: 'j-3', error: 'circuit-open: provider in cooldown' });
  assert.equal(inc3.classification, 'circuit_breaker_active');

  // 4. Dependency unhealthy
  const inc4 = healer.detectIncident({ jobId: 'j-4', error: 'Agent dependency PC_BRIDGE is offline' });
  assert.equal(inc4.classification, 'agent_dependency_unhealthy');
  assert.equal(inc4.severity, 'critical');
});

test('Self-Healing Engine: diagnoseAndRecover persists RCA to Knowledge Graph and emits Event', async () => {
  const executedStatements = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          run: async () => {
            executedStatements.push({ sql, params });
            return { success: true };
          },
          first: async () => ({ id: 'ev_123', delivery_status: 'pending' })
        })
      })
    }
  };

  const healer = new TrinityHealer(mockEnv);
  const result = await healer.diagnoseAndRecover({
    jobId: 'job_failed_99',
    error: 'D1 bind undefined error occurred',
    source: 'TRINITY_CORE',
    receiptId: 'TRN-RCPT-FAIL-01'
  });

  assert.equal(result.jobId, 'job_failed_99');
  assert.equal(result.classification, 'd1_undefined_bind_violation');
  assert.ok(result.decisionId);
  assert.ok(executedStatements.length >= 1);
});

test('SovereignScheduler: combines Capability Scheduler and Resource Scheduler with Leasing', async () => {
  const statements = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          first: async () => {
            if (sql.includes('FROM agents a')) {
              return {
                agent_id: 'AURA_ARCHITECT',
                name: 'Aura Architect',
                endpoint: 'AURA_ARCHITECT',
                trust_score: 0.98,
                load_score: 0.1,
                rank: 0.95
              };
            }
            if (sql.includes('FROM resource_state')) {
              return {
                resource_id: 'res_edge_cf',
                node_name: 'Cloudflare Edge Fleet',
                tier: 'edge',
                rank: 0.9
              };
            }
            if (sql.includes('FROM agent_leases')) {
              return null; // No existing lease
            }
            if (sql.includes('INSERT INTO agent_leases')) {
              return { lease_id: 'lease_test_123', agent_id: 'AURA_ARCHITECT', job_id: 'task_arch_review_1', expires_at: Date.now() + 300000 };
            }
            if (sql.includes('FROM sovereign_events')) {
              return { id: 'evt_1', delivery_status: 'pending' };
            }
            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => {
            statements.push({ sql, params });
            return { success: true };
          }
        })
      })
    }
  };

  const scheduler = new SovereignScheduler(mockEnv);
  const result = await scheduler.scheduleExecution({
    taskId: 'task_arch_review_1',
    requiredCapabilities: ['architecture.review'],
    preferredTier: 'edge'
  });

  assert.equal(result.taskId, 'task_arch_review_1');
  assert.equal(result.assignedAgent, 'AURA_ARCHITECT');
  assert.equal(result.assignedNode, 'res_edge_cf');
  assert.equal(result.nodeTier, 'edge');
  assert.ok(result.lease);
});

test('KnowledgeGraphEngine: records decisions and queries structured graph nodes', async () => {
  const statements = [];
  const mockEnv = {
    DB: {
      prepare: (sql) => ({
        bind: (...params) => ({
          run: async () => {
            statements.push({ sql, params });
            return { success: true };
          },
          all: async () => {
            if (sql.includes('FROM kg_entities')) {
              return { results: [{ id: 'ent_1', type: 'agent', name: 'JERICHO' }] };
            }
            if (sql.includes('FROM kg_observations')) {
              return { results: [{ id: 'obs_1', entity_id: 'ent_1', observation: 'Treasury verified' }] };
            }
            if (sql.includes('FROM kg_decisions')) {
              return { results: [{ id: 'dec_1', rationale: 'Risk low', action: 'Rebalance' }] };
            }
            return { results: [] };
          }
        })
      })
    }
  };

  const kg = new KnowledgeGraphEngine(mockEnv);
  const dec = await kg.recordDecision({
    rationale: 'Latency high on primary node',
    action: 'Reroute to edge',
    actor_agent_id: 'TRINITY_HEALER',
    outcome: 'rerouted'
  });

  assert.match(dec.id, /^dec_/);
  assert.equal(dec.action, 'Reroute to edge');

  const graph = await kg.queryGraph({ limit: 10 });
  assert.equal(graph.entities.length, 1);
  assert.equal(graph.observations.length, 1);
  assert.equal(graph.decisions.length, 1);
});

test('Sovereign Skills: execute correctly via SkillRegistry', async () => {
  // 1. Architecture Skills
  const archReview = await skillRegistry.execute('architecture.review', {});
  assert.equal(archReview.status, 'analyzed');
  assert.ok(archReview.core_layers.includes('Policy Engine'));

  const archCompare = await skillRegistry.execute('architecture.compare', { source: '11.0', target: '12.0' });
  assert.equal(archCompare.status, 'compared');

  // 2. Audit Skills
  const auditDep = await skillRegistry.execute('audit.deployment', { commit_tag: 'sha_123' });
  assert.equal(auditDep.verified, true);
  assert.equal(auditDep.commit_tag, 'sha_123');

  const auditTruth1 = await skillRegistry.execute('audit.truthfulness', { status: 'completed', receipt_id: 'TRN-1' });
  assert.equal(auditTruth1.truthful, true);

  const auditTruth2 = await skillRegistry.execute('audit.truthfulness', { status: 'completed' });
  assert.equal(auditTruth2.truthful, false);

  const auditLifecycle = await skillRegistry.execute('audit.lifecycle', { from: 'available', to: 'busy' });
  assert.equal(auditLifecycle.allowed, true);

  const auditLifecycleBlocked = await skillRegistry.execute('audit.lifecycle', { from: 'offline', to: 'busy' });
  assert.equal(auditLifecycleBlocked.allowed, false);

  // 3. Engineering Skills
  const genTests = await skillRegistry.execute('generate.tests', { suite_name: 'pentad' });
  assert.equal(genTests.generated, true);

  const diffReviewSafe = await skillRegistry.execute('review.diff', { diff: 'bind(sanitizeD1(val))' });
  assert.equal(diffReviewSafe.clean, true);

  const diffReviewUnsafe = await skillRegistry.execute('review.diff', { diff: 'bind(undefined)' });
  assert.equal(diffReviewUnsafe.clean, false);

  const validateD1 = await skillRegistry.execute('validate.d1', { values: ['ok', undefined, 123] });
  assert.equal(validateD1.valid, false);
  assert.equal(validateD1.sanitized[1], null);

  // 4. Incident Skills
  const incDetect = await skillRegistry.execute('incident.detect', { error: 'operation timed out' });
  assert.equal(incDetect.classification, 'execution_timeout_exhausted');
});
