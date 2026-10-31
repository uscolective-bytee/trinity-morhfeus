/**
 * TRINITY 12.0 SOVEREIGN AI OPERATING SYSTEM REGISTRY & SCHEDULER
 * Riadiaca vrstva pre Agent Registry, Capability-First Scheduler, Policy Engine a Knowledge Graph.
 */
import {z} from 'zod';
import {HttpError} from './security.js';

export const heartbeatSchema=z.object({
  agent_id:z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  status:z.enum(['registered','available','busy','degraded','offline']).default('available'),
  active_jobs:z.number().int().min(0).max(100000).default(0),
  latency_ms:z.number().finite().min(0).max(600000).default(0),
  cpu_load:z.number().finite().min(0).max(1).default(0),
  memory_load:z.number().finite().min(0).max(1).default(0)
}).strict();

export const agentRegistrationSchema=z.object({
  agent_id:z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  name:z.string().trim().min(2).max(160),
  type:z.enum(['core','aura','standalone','bridge','external']).default('core'),
  version:z.string().trim().regex(/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/).default('12.0.0'),
  status:z.enum(['registered','available','busy','degraded','offline']).default('available'),
  endpoint:z.string().trim().min(2).max(120).regex(/^[A-Za-z0-9_-]+$/).nullable().default(null),
  owner:z.string().trim().min(2).max(200).default('system'),
  capabilities:z.array(z.string().trim().min(3).max(100).regex(/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/)).max(50).default([])
}).strict();

export const leaseSchema=z.object({
  agent_id:z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  job_id:z.string().trim().min(2).max(160).regex(/^[A-Za-z0-9:_-]+$/),
  lease_seconds:z.number().int().min(5).max(3600).default(300)
}).strict();

export const reputationUpdateSchema=z.object({
  agent_id:z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  success:z.boolean().default(true),
  latency_ms:z.number().finite().min(0).max(600000).default(100),
  audit_score:z.number().finite().min(0).max(1).default(1)
}).strict();

export const knowledgeObservationSchema=z.object({
  entityType:z.enum(['project','agent','capability','artifact','model','user','service','deployment','incident','decision']),
  entityName:z.string().trim().min(2).max(200),
  observation:z.string().trim().min(1).max(8000),
  receiptId:z.string().trim().min(3).max(200).regex(/^[A-Za-z0-9:._-]+$/).nullable().default(null),
  source:z.string().trim().min(2).max(160).default('system')
}).strict();

export const resourceStateSchema=z.object({
  resource_id:z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/),
  node_name:z.string().trim().min(2).max(160),
  cpu_score:z.number().finite().min(0).max(1),
  memory_score:z.number().finite().min(0).max(1),
  queue_depth:z.number().int().min(0).max(100000).default(0),
  active_jobs:z.number().int().min(0).max(100000).default(0),
  tier:z.enum(['edge','workstation','cloud','gpu']).default('edge')
}).strict();

export const resourceRequestSchema=z.object({
  required_tier:z.enum(['edge','workstation','cloud','gpu']).nullable().default(null),
  max_cpu_score:z.number().finite().min(0).max(1).default(0.85),
  max_memory_score:z.number().finite().min(0).max(1).default(0.85),
  max_queue_depth:z.number().int().min(0).max(100000).default(100),
  freshness_ms:z.number().int().min(5000).max(300000).default(60000)
}).strict();

export const sovereignEventSchema=z.object({
  topic:z.string().trim().min(3).max(120).regex(/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/),
  aggregate_type:z.string().trim().min(2).max(80).regex(/^[a-z][a-z0-9_-]*$/),
  aggregate_id:z.string().trim().min(2).max(160).regex(/^[A-Za-z0-9:._-]+$/),
  payload:z.record(z.string(),z.unknown()),
  idempotency_key:z.string().uuid().optional()
}).strict();

async function deterministicEntityId(type,name){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${type}\0${name}`));
  return `ent_${type}_${[...new Uint8Array(bytes)].slice(0,12).map(value=>value.toString(16).padStart(2,'0')).join('')}`;
}

export function sanitizeD1(val) {
  return val === undefined ? null : val;
}

/**
 * Policy Engine: Validácia deklaratívnych invariantov
 */
export async function isPolicyEnabled(env, policyName) {
  if (!env?.DB?.prepare) return true; // Fail-safe pre in-memory prostredie
  try {
    const row = await env.DB.prepare('SELECT enabled FROM sovereign_policies WHERE name=?').bind(sanitizeD1(policyName)).first();
    return row ? Boolean(row.enabled) : true;
  } catch {
    return true;
  }
}

export function enforceCompletedEvidence(status, result) {
  if (status === 'completed') {
    const hasEvidence = Boolean(result?.receipt_id || result?._evidence?.receipt_id || result?.evidence?.receipt_id);
    if (hasEvidence) return 'completed';
    if (['pending','queued','running','partial','failed'].includes(result?.status)) return result.status;
    return 'failed';
  }
  return status;
}

/**
 * Agent Registry: Registrácia a správa stavov
 */
export async function registerAgent(env, input) {
  const {agent_id,name,type,version,status,endpoint,owner,capabilities}=agentRegistrationSchema.parse(input);
  const now = Date.now();
  if (env?.DB?.prepare) {
    const existing=await env.DB.prepare('SELECT owner FROM agents WHERE agent_id=?').bind(agent_id).first();
    if(existing&&existing.owner!==owner)throw new HttpError(409,'ID agenta už patrí inému vlastníkovi.');
    const capabilityRows=[];
    for(const capName of capabilities){
      const cap=await env.DB.prepare('SELECT capability_id FROM capabilities WHERE name=?').bind(capName).first();
      if(!cap?.capability_id)throw new HttpError(400,`Neznáma capability: ${capName}`);
      capabilityRows.push(cap);
    }
    await env.DB.prepare(`
      INSERT INTO agents (agent_id, name, type, version, status, endpoint, owner, heartbeat_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
      ON CONFLICT(agent_id) DO UPDATE SET
        name = excluded.name,
        type = excluded.type,
        version = excluded.version,
        status = excluded.status,
        endpoint = excluded.endpoint,
        heartbeat_at = excluded.heartbeat_at,
        updated_at = excluded.updated_at
    `).bind(
      sanitizeD1(agent_id),
      sanitizeD1(name),
      sanitizeD1(type),
      sanitizeD1(version),
      sanitizeD1(status),
      sanitizeD1(endpoint),
      sanitizeD1(owner),
      now
    ).run();

    // Registrácia nahrádza capability set, aby odobraté oprávnenia nezostali aktívne.
    await env.DB.prepare('DELETE FROM agent_capabilities WHERE agent_id=?').bind(agent_id).run();
    for (const cap of capabilityRows) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO agent_capabilities (agent_id, capability_id, confidence, priority)
        VALUES (?1, ?2, 1.0, 100)
      `).bind(sanitizeD1(agent_id), cap.capability_id).run();
    }
  }
  return { agent_id, name, status, registered_at: now };
}

/**
 * Heartbeat telemetria a stráženie dostupnosti
 */
export async function recordHeartbeat(env, input) {
  const {agent_id,status,active_jobs,latency_ms,cpu_load,memory_load}=heartbeatSchema.parse(input);
  const now = Date.now();
  const id = `hb_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const load_score = Math.min(1.0, Math.max(0.0, active_jobs / 10));

  if (env?.DB?.prepare) {
    await env.DB.prepare(`
      INSERT INTO agent_heartbeats (id, agent_id, status, active_jobs, cpu_load, memory_load, latency_ms, timestamp)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `).bind(
      id,
      sanitizeD1(agent_id),
      sanitizeD1(status),
      active_jobs,
      cpu_load,
      memory_load,
      latency_ms,
      now
    ).run();

    await env.DB.prepare(`
      UPDATE agents
      SET status = ?1, heartbeat_at = ?2, load_score = ?3, updated_at = ?2
      WHERE agent_id = ?4
    `).bind(sanitizeD1(status), now, load_score, sanitizeD1(agent_id)).run();
  }

  return { agent_id, status, load_score, heartbeat_at: now };
}

/**
 * Agent Leasing: Zámky úloh s expiračným oknom
 */
export async function acquireLease(env, input) {
  const {agent_id,job_id,lease_seconds}=leaseSchema.parse(input);
  const now = Date.now();
  const expires_at = now + (lease_seconds * 1000);
  const lease_id = `lease_${now}_${Math.random().toString(36).slice(2, 8)}`;

  if (env?.DB?.prepare) {
    const claimed=await env.DB.prepare(`
      INSERT INTO agent_leases (lease_id, agent_id, job_id, expires_at, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
      ON CONFLICT(job_id) DO UPDATE SET
        lease_id = excluded.lease_id,
        agent_id = excluded.agent_id,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at
      WHERE agent_leases.expires_at <= ?5 OR agent_leases.agent_id = excluded.agent_id
      RETURNING lease_id, agent_id, job_id, expires_at
    `).bind(
      lease_id,
      sanitizeD1(agent_id),
      sanitizeD1(job_id),
      expires_at,
      now
    ).first();
    if(!claimed)throw new Error(`Úloha ${job_id} už má aktívny lease iného agenta.`);
    return claimed;
  }

  return { lease_id, agent_id, job_id, expires_at };
}

export async function releaseLease(env, job_id) {
  if (env?.DB?.prepare) {
    await env.DB.prepare('DELETE FROM agent_leases WHERE job_id=?').bind(sanitizeD1(job_id)).run();
  }
  return { released: true, job_id };
}

export async function recordResourceState(env,input){
  const state=resourceStateSchema.parse(input);
  const updated_at=Date.now();
  if(env?.DB?.prepare){
    await env.DB.prepare(`INSERT INTO resource_state(resource_id,node_name,cpu_score,memory_score,queue_depth,active_jobs,tier,updated_at)
      VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(resource_id) DO UPDATE SET node_name=excluded.node_name,cpu_score=excluded.cpu_score,
      memory_score=excluded.memory_score,queue_depth=excluded.queue_depth,active_jobs=excluded.active_jobs,tier=excluded.tier,updated_at=excluded.updated_at`)
      .bind(state.resource_id,state.node_name,state.cpu_score,state.memory_score,state.queue_depth,state.active_jobs,state.tier,updated_at).run();
  }
  return {...state,updated_at};
}

export async function findBestResource(env,input={}){
  const request=resourceRequestSchema.parse(input);
  if(!env?.DB?.prepare)return {resource:null,strategy:'registry_unavailable'};
  const threshold=Date.now()-request.freshness_ms;
  const resource=await env.DB.prepare(`SELECT resource_id,node_name,cpu_score,memory_score,queue_depth,active_jobs,tier,updated_at,
    ((1.0-cpu_score)*0.35+(1.0-memory_score)*0.35+(1.0/(queue_depth+1))*0.2+(1.0/(active_jobs+1))*0.1) AS rank
    FROM resource_state WHERE updated_at>=? AND cpu_score<=? AND memory_score<=? AND queue_depth<=?
      AND (? IS NULL OR tier=?) ORDER BY rank DESC,resource_id ASC LIMIT 1`)
    .bind(threshold,request.max_cpu_score,request.max_memory_score,request.max_queue_depth,request.required_tier,request.required_tier).first();
  return resource?{resource,strategy:'resource_matched'}:{resource:null,strategy:'no_healthy_resource'};
}

export async function publishSovereignEvent(env,input){
  const event=sovereignEventSchema.parse(input);
  if(!env?.DB?.prepare)throw new Error('Sovereign event ledger nie je dostupný.');
  const id=crypto.randomUUID(),idempotencyKey=event.idempotency_key||crypto.randomUUID(),occurredAt=Date.now();
  await env.DB.prepare(`INSERT INTO sovereign_events(id,topic,aggregate_type,aggregate_id,payload_json,delivery_status,idempotency_key,occurred_at)
    VALUES(?,?,?,?,?,'pending',?,?) ON CONFLICT(idempotency_key) DO NOTHING`)
    .bind(id,event.topic,event.aggregate_type,event.aggregate_id,JSON.stringify(event.payload),idempotencyKey,occurredAt).run();
  const stored=await env.DB.prepare('SELECT id,topic,aggregate_type,aggregate_id,delivery_status,idempotency_key,occurred_at FROM sovereign_events WHERE idempotency_key=?')
    .bind(idempotencyKey).first();
  return stored;
}

/**
 * Capability-First Scheduler: Vyhľadanie najvhodnejšieho agenta
 */
export async function findBestAgentForCapabilities(env, requiredCapabilities = []) {
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.length === 0) {
    return { agent_id: null, endpoint: null, rank: 0, strategy: 'missing_requirements', warning: 'Scheduler vyžaduje aspoň jednu capability.' };
  }

  if (!env?.DB?.prepare) {
    return { agent_id: null, endpoint: null, rank: 0, strategy: 'registry_unavailable', warning: 'Capability registry nie je dostupný.' };
  }

  const now = Date.now();
  const staleThreshold = now - 60000; // Agent musí mať heartbeat za posledných 60s

  const placeholders = requiredCapabilities.map(() => '?').join(',');
  const query = `
    SELECT a.agent_id, a.name, a.endpoint, a.trust_score, a.load_score,
           (a.trust_score * 0.6 + (1.0 - a.load_score) * 0.4) AS rank
    FROM agents a
    JOIN agent_capabilities ac ON a.agent_id = ac.agent_id
    JOIN capabilities c ON ac.capability_id = c.capability_id
    WHERE c.name IN (${placeholders})
      AND a.status IN ('available', 'busy')
      AND (a.heartbeat_at >= ? OR a.heartbeat_at IS NULL)
    GROUP BY a.agent_id
    HAVING COUNT(DISTINCT c.name) = ?
    ORDER BY rank DESC, ac.priority ASC
    LIMIT 1
  `;

  const bindParams = [...requiredCapabilities, staleThreshold, requiredCapabilities.length];
  const candidate = await env.DB.prepare(query).bind(...bindParams).first();

  if (!candidate) {
    return {
      agent_id: null,
      endpoint: null,
      rank: 0,
      strategy: 'no_capability_match',
      warning: `Žiadny živý agent nepokrýva všetky požadované schopnosti: ${requiredCapabilities.join(', ')}`
    };
  }

  // Kontrola závislostí: Sú zdravé uzly, od ktorých kandidát závisí?
  const deps = (await env.DB.prepare(`
    SELECT ad.depends_on_agent_id, a.status, a.heartbeat_at
    FROM agent_dependencies ad
    JOIN agents a ON ad.depends_on_agent_id = a.agent_id
    WHERE ad.agent_id = ? AND ad.critical = 1
  `).bind(candidate.agent_id).all())?.results || [];

  const unhealthyDep = deps.find(d => d.status === 'offline' || (d.heartbeat_at && d.heartbeat_at < staleThreshold));
  if (unhealthyDep) {
    return {
      agent_id: null,
      endpoint: null,
      rank: 0,
      strategy: 'dependency_blocked',
      warning: `Agent ${candidate.agent_id} bol preskočený, pretože kritická závislosť ${unhealthyDep.depends_on_agent_id} je nezdravá.`
    };
  }

  return {
    agent_id: candidate.agent_id,
    name: candidate.name,
    endpoint: candidate.endpoint,
    rank: candidate.rank,
    strategy: 'capability_matched'
  };
}

/**
 * Reputation Engine: Výpočet metrík dôvery
 */
export async function updateAgentReputation(env, input) {
  const {agent_id,success,latency_ms,audit_score}=reputationUpdateSchema.parse(input);
  const now = Date.now();
  if (!env?.DB?.prepare) return { trust_score: 1.0 };

  const rep = await env.DB.prepare(`
    SELECT completed_jobs, failed_jobs, avg_latency_ms, trust_score
    FROM agent_reputation
    WHERE agent_id=?
  `).bind(sanitizeD1(agent_id)).first() || { completed_jobs: 0, failed_jobs: 0, avg_latency_ms: 100, trust_score: 1.0 };

  const completed = rep.completed_jobs + (success ? 1 : 0);
  const failed = rep.failed_jobs + (success ? 0 : 1);
  const total = completed + failed;
  const success_rate = total > 0 ? completed / total : 1.0;
  const avg_latency = ((rep.avg_latency_ms * (total - 1)) + latency_ms) / total;
  const latency_factor = Math.max(0.0, Math.min(1.0, 1.0 - (avg_latency / 10000)));

  // Dôveryhodnosť vážená úspešnosťou, latenciou a auditným hodnotením
  const trust_score = Math.max(0.1, Math.min(1.0, (success_rate * 0.5) + (latency_factor * 0.25) + (audit_score * 0.25)));

  await env.DB.prepare(`
    INSERT INTO agent_reputation (agent_id, completed_jobs, failed_jobs, avg_latency_ms, audit_score, trust_score, last_evaluated)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    ON CONFLICT(agent_id) DO UPDATE SET
      completed_jobs = excluded.completed_jobs,
      failed_jobs = excluded.failed_jobs,
      avg_latency_ms = excluded.avg_latency_ms,
      audit_score = excluded.audit_score,
      trust_score = excluded.trust_score,
      last_evaluated = excluded.last_evaluated
  `).bind(
    sanitizeD1(agent_id),
    completed,
    failed,
    avg_latency,
    audit_score,
    trust_score,
    now
  ).run();

  // Zápis nového trust_score priamo k agentovi
  await env.DB.prepare('UPDATE agents SET trust_score=?1, updated_at=?2 WHERE agent_id=?3')
    .bind(trust_score, now, sanitizeD1(agent_id)).run();

  return { agent_id, trust_score, completed_jobs: completed, failed_jobs: failed };
}

/**
 * Multi-Level Knowledge Graph: Zápis a previazanie poznatkov
 */
export async function recordKnowledgeGraphNode(env, input) {
  const {entityType,entityName,observation,receiptId,source}=knowledgeObservationSchema.parse(input);
  const now = Date.now();
  const entityId = await deterministicEntityId(entityType,entityName);
  const obsId = `obs_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const evId = `ev_${now}_${Math.random().toString(36).slice(2, 8)}`;

  if (env?.DB?.prepare) {
    // 1. Entita
    await env.DB.prepare(`
      INSERT OR IGNORE INTO kg_entities (id, type, name, created_at)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(entityId, sanitizeD1(entityType), sanitizeD1(entityName), now).run();

    // 2. Pozorovanie
    await env.DB.prepare(`
      INSERT INTO kg_observations (id, entity_id, observation, source, confidence, timestamp)
      VALUES (?1, ?2, ?3, ?4, 1.0, ?5)
    `).bind(obsId, entityId, sanitizeD1(observation), sanitizeD1(source), now).run();

    // 3. Dôkaz (Evidence)
    if (receiptId) {
      await env.DB.prepare(`
        INSERT INTO kg_evidence (id, observation_id, receipt_id, verified, timestamp)
        VALUES (?1, ?2, ?3, 1, ?4)
      `).bind(evId, obsId, sanitizeD1(receiptId), now).run();
    }
  }

  return { entityId, obsId, receiptId, recorded_at: now };
}

/**
 * Sovereign Ledger: Single source of truth ledger
 */
export const ledgerEntrySchema = z.object({
  agent: z.string().trim().min(2).max(100),
  role: z.string().trim().min(2).max(100).nullable().default(null),
  type: z.enum(['CLAIM', 'WORK', 'HANDOFF', 'ACK', 'REVIEW', 'EVIDENCE', 'AUDIT', 'INCIDENT']),
  status: z.enum(['planned', 'running', 'completed', 'failed', 'acknowledged']),
  task: z.string().trim().min(2).max(200).nullable().default(null),
  message: z.string().trim().min(1).max(8000).nullable().default(null),
  evidence: z.string().trim().min(1).max(8000).nullable().default(null),
  idempotency_key: z.string().uuid()
}).strict();

const stableLedgerJson=value=>{
  if(Array.isArray(value))return value.map(stableLedgerJson);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stableLedgerJson(value[key])]));
  return value;
};

async function ledgerInputHash(data,principal){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(stableLedgerJson({data,principal}))));
  return [...new Uint8Array(bytes)].map(value=>value.toString(16).padStart(2,'0')).join('');
}

export async function recordLedgerEntry(env, input, principal) {
  let data;
  try {
    data = ledgerEntrySchema.parse(input);
  } catch (err) {
    throw new HttpError(400, `validation_failed: ${err.message}`);
  }
  if (data.status === 'completed' && (!data.evidence || data.evidence.trim().length === 0)) {
    throw new HttpError(400, 'completed_requires_evidence: Every completed task must contain verifiable evidence.');
  }
  if(typeof principal!=='string'||!principal.trim())throw new HttpError(401,'authenticated_principal_required');

  const now = Date.now();
  const id = `ledger_${crypto.randomUUID()}`;
  const inputHash=await ledgerInputHash(data,principal.trim());

  if (env?.DB?.prepare) {
    const inserted=await env.DB.prepare(`
      INSERT INTO sovereign_ledger (id, timestamp, agent, role, type, status, task, message, evidence, principal, idempotency_key, input_hash, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
      ON CONFLICT(idempotency_key) DO NOTHING RETURNING *
    `).bind(
      id,
      now,
      sanitizeD1(data.agent),
      sanitizeD1(data.role),
      sanitizeD1(data.type),
      sanitizeD1(data.status),
      sanitizeD1(data.task),
      sanitizeD1(data.message),
      sanitizeD1(data.evidence),
      principal.trim(),
      data.idempotency_key,
      inputHash,
      Math.floor(now / 1000)
    ).first();
    if(inserted)return {...inserted,duplicate:false};
    const existing=await env.DB.prepare('SELECT * FROM sovereign_ledger WHERE idempotency_key=?1').bind(data.idempotency_key).first();
    if(!existing)throw new HttpError(500,'ledger_persistence_failed');
    if(existing.input_hash!==inputHash)throw new HttpError(409,'idempotency_conflict');
    return {...existing,duplicate:true};
  }

  throw new HttpError(503,'sovereign_ledger_unavailable');
}

export async function queryLedger(env, { agent = null, type = null, status = null, limit = 50 } = {}) {
  if (!env?.DB?.prepare) return { entries: [] };
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));

  let query = 'SELECT * FROM sovereign_ledger WHERE 1=1';
  const params = [];

  if (agent) {
    params.push(sanitizeD1(agent));
    query += ` AND agent = ?${params.length}`;
  }
  if (type) {
    params.push(sanitizeD1(type));
    query += ` AND type = ?${params.length}`;
  }
  if (status) {
    params.push(sanitizeD1(status));
    query += ` AND status = ?${params.length}`;
  }

  query += ` ORDER BY timestamp DESC LIMIT ?${params.length + 1}`;
  params.push(safeLimit);

  const stmt = env.DB.prepare(query);
  const result = await stmt.bind(...params).all();
  return { entries: result?.results || [] };
}
