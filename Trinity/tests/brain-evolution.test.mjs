import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runBrainCycle} from '../src/brain.js';
import {runEvolutionCycle} from '../src/evolution.js';
import {createFollowupJob} from '../src/followup.js';

function createMockEnv() {
  const memory = new Map();
  const events = [];
  const jobs = new Map();

  return {
    DB: {
      memory,
      events,
      jobs,
      prepare(sql) {
        return {
          _sql: sql,
          _params: [],
          bind(...args) {
            this._params = args;
            return this;
          },
          async first() {
            if (sql.includes('FROM ops_control')) {
              return {emergency_stop: 0};
            }
            if (sql.includes("FROM ops_jobs WHERE status IN ('queued', 'running', 'pending')")) {
              return null;
            }
            if (sql.includes("FROM ops_memory WHERE key=?")) {
              const k = this._params[0];
              return memory.has(k) ? {key: k, value: memory.get(k)} : null;
            }
            return null;
          },
          async all() {
            if (sql.includes("FROM ops_jobs WHERE status='failed'")) {
              return {
                results: Array.from(jobs.values()).filter(j => j.status === 'failed')
              };
            }
            if (sql.includes("FROM ops_jobs WHERE status IN ('queued', 'running', 'pending')")) {
              return {results: [{status: 'running', count: 1}]};
            }
            return {results: []};
          },
          async run() {
            if (sql.includes('INSERT INTO ops_memory')) {
              const [k, v] = this._params;
              memory.set(k, v);
            }
            if (sql.includes('INSERT INTO ops_events')) {
              let act = 'unknown', det = '';
              if (sql.includes("'evolution_learning_recorded'")) {
                act = 'evolution_learning_recorded';
                det = this._params[1];
              } else if (this._params.length >= 2) {
                act = this._params[0];
                det = this._params[1];
              }
              events.push({action: act, details: det});
            }
            return {success: true};
          }
        };
      }
    }
  };
}

test('runBrainCycle executes periodic heartbeat and checks health without error', async () => {
  const env = createMockEnv();
  const result = await runBrainCycle(env);

  assert.equal(result.brain_status, 'operational');
  assert.equal(result.emergency_stop, false);
  assert.ok(result.timestamp);
  assert.ok(env.DB.events.some(e => e.action === 'brain_cycle_heartbeat'));
});

test('runEvolutionCycle detects failures, generates lessons, and avoids redundant re-analysis', async () => {
  const env = createMockEnv();
  
  // Prvé spustenie: žiadne zlyhania
  const noFailResult = await runEvolutionCycle(env);
  assert.equal(noFailResult.status, 'no_failures');

  // Pridáme zlyhanú úlohu
  const failedJob = {
    id: 'job-fail-123',
    session_id: 'session-123',
    task: 'Kompilácia kódu',
    error: 'SyntaxError: Unexpected token',
    provider: 'workers-ai',
    language: 'sk',
    status: 'failed',
    updated_at: new Date().toISOString()
  };
  env.DB.jobs.set(failedJob.id, failedJob);

  // Druhé spustenie: diagnostika chyby a uloženie poučenia
  const evoResult = await runEvolutionCycle(env);
  assert.equal(evoResult.status, 'evolution_cycle_completed');
  assert.equal(evoResult.analyzed_count, 1);
  assert.ok(env.DB.memory.has(`evolution/job-${failedJob.id}`));

  // Tretie spustenie: tá istá úloha sa už znova neanalyzuje
  const repeatResult = await runEvolutionCycle(env);
  assert.equal(repeatResult.status, 'already_analyzed');
});

test('createFollowupJob strictly prevents infinite recursion when allow_followup is absent or depth exceeded', async () => {
  const env = createMockEnv();

  // 1. Štandardná úloha bez allow_followup -> vráti null (žiadna slučka)
  const regularJob = {
    id: 'job-standard',
    task: 'Bežná otázka',
    plan_json: JSON.stringify({allow_followup: false})
  };
  const res1 = await createFollowupJob(env, regularJob, 'Výsledok bežnej otázky');
  assert.equal(res1, null);

  // 2. Úloha, ktorá už je follow-upom -> vráti null
  const followupJob = {
    id: 'job-followup-1',
    task: 'Nadväzujúci krok',
    plan_json: JSON.stringify({allow_followup: true, is_followup: true, followup_depth: 1})
  };
  const res2 = await createFollowupJob(env, followupJob, 'Ďalší výsledok');
  assert.equal(res2, null);
});
