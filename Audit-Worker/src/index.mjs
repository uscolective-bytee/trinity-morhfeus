/** Dedicated, scoped CI audit ingestion. No arbitrary SQL, no admin API, no deploy capability. */
import openapi from './openapi.mjs';
const encoder = new TextEncoder();
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const MAX_BYTES = 4096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA = /^[0-9a-f]{40}([0-9a-f]{24})?$/i;
const REPO = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/;
const LABEL = /^[A-Za-z0-9._/-]{1,130}$/;
const STATES = new Set(['pending','success','failure','cancelled','blocked','approved','deployed']);
const TRIGGERS = new Set(['push','pull_request','workflow_dispatch','schedule','manual','deployment']);
const ENVS = new Set(['staging','production','development']);
function hex(bytes){return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256(text){return hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));}
function validString(value,max){return typeof value==='string'&&value.length>0&&value.length<=max;}
export function validateAudit(payload,allowlist){
  if (!payload||typeof payload!=='object'||Array.isArray(payload)) return 'Invalid payload.';
  if (!UUID.test(payload.event_id||'')) return 'Invalid event_id.';
  if (!REPO.test(payload.repo||'')||!allowlist.includes(payload.repo)) return 'Repository is not allowed.';
  if (!SHA.test(payload.sha||'')) return 'Invalid commit SHA.';
  if (!STATES.has(payload.status)) return 'Invalid status.';
  if (!TRIGGERS.has(payload.trigger)) return 'Invalid trigger.';
  if (payload.actor!=null && (!validString(payload.actor,80)||!/^[A-Za-z0-9_-]+$/.test(payload.actor))) return 'Invalid actor.';
  if (payload.branch!=null && (!validString(payload.branch,130)||!LABEL.test(payload.branch))) return 'Invalid branch.';
  if (payload.environment!=null && !ENVS.has(payload.environment)) return 'Invalid environment.';
  if (payload.duration_ms!=null && (!Number.isSafeInteger(payload.duration_ms)||payload.duration_ms<0||payload.duration_ms>86400000)) return 'Invalid duration.';
  return null;
}
export async function verifySignature(headers,raw,secret,nowMs=Date.now()){
  if(typeof secret!=='string'||secret.length<32) return false;
  const timestamp=headers.get('X-Trinity-Audit-Timestamp')||'';
  const signature=headers.get('X-Trinity-Audit-Signature')||'';
  if(!/^[0-9]{10}$/.test(timestamp)||!/^sha256=[0-9a-f]{64}$/i.test(signature)) return false;
  if(Math.abs(nowMs-Number(timestamp)*1000)>300000) return false;
  const signatureHex=signature.slice(7);
  const signatureBytes=Uint8Array.from(signatureHex.match(/.{2}/g),x=>parseInt(x,16));
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  return crypto.subtle.verify('HMAC',key,signatureBytes,encoder.encode(timestamp+'.'+raw));
}
export async function handleRequest(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/openapi.json'&&request.method==='GET')return json(openapi);
  if(path==='/health'&&request.method==='GET') return json({service:'trinity-audit',ready:Boolean(env?.DB?.prepare&&env?.AUDIT_HMAC_KEY?.length>=32&&env?.AUDIT_ALLOWED_REPOS)},env?.DB?.prepare&&env?.AUDIT_HMAC_KEY?.length>=32&&env?.AUDIT_ALLOWED_REPOS?200:503);
  if(path!=='/v1/audit') return json({error:'Not found'},404);
  if(request.method!=='POST') return json({error:'Method not allowed'},405);
  if(!env?.DB?.prepare||typeof env?.AUDIT_HMAC_KEY!=='string'||env.AUDIT_HMAC_KEY.length<32||!env.AUDIT_ALLOWED_REPOS) return json({error:'Audit service unavailable'},503);
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'Expected JSON'},415);
  if(Number(request.headers.get('content-length')||0)>MAX_BYTES) return json({error:'Too large'},413);
  let raw;
  try{raw=await request.text();}catch{return json({error:'Invalid body'},400);}
  if(encoder.encode(raw).byteLength>MAX_BYTES) return json({error:'Too large'},413);
  if(!await verifySignature(request.headers,raw,env.AUDIT_HMAC_KEY)) return json({error:'Unauthorized'},401);
  let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Invalid JSON'},400);}
  const allowlist=env.AUDIT_ALLOWED_REPOS.split(',').map(s=>s.trim()).filter(Boolean);
  const problem=validateAudit(payload,allowlist);
  if(problem)return json({error:problem},400);
  const id=crypto.randomUUID(),timestamp=new Date().toISOString(),digest=await sha256(raw);
  try{
    const result=await env.DB.prepare(
      'INSERT INTO ops_ci_audit_log (id,repo,sha,status,trigger,actor,branch,environment,duration_ms,ts,request_hash,idempotency_key) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING'
    ).bind(id,payload.repo,payload.sha.toLowerCase(),payload.status,payload.trigger,payload.actor??null,payload.branch??null,payload.environment??null,payload.duration_ms??null,timestamp,digest,payload.event_id).run();
    if(result.meta?.changes===0){
      const existing=await env.DB.prepare('SELECT id,request_hash FROM ops_ci_audit_log WHERE idempotency_key=?').bind(payload.event_id).first();
      if(!existing||existing.request_hash!==digest)return json({error:'Idempotency key conflict'},409);
      return json({ok:true,id:existing.id,duplicate:true});
    }
    return json({ok:true,id,ts:timestamp},201);
  }catch{return json({error:'Unable to persist audit record'},503);}
}
export default {fetch:handleRequest};
