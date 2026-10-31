import {z} from 'zod';
import {HttpError} from './security.js';
import {extractModelText} from './services.js';

export const TRINITY2_CAPABILITIES=[
  'chat','studio','generate_image','analyze_image','transcribe_audio','text_to_speech',
  'manage_workflows','view_audit','manage_integrations','manage_users','execute_pc'
];

const defaults={
  owner:new Set(TRINITY2_CAPABILITIES),
  admin:new Set(TRINITY2_CAPABILITIES.filter(item=>item!=='manage_users')),
  user:new Set(['chat','studio','generate_image','analyze_image','transcribe_audio','text_to_speech','manage_workflows'])
};

export async function rolePermissions(env,role){
  const effective=new Set(defaults[role]||[]);
  const rows=await env.DB.prepare('SELECT capability,allowed FROM ops_role_permissions WHERE role=?').bind(role).all();
  for(const row of rows.results||[]){if(row.allowed)effective.add(row.capability);else effective.delete(row.capability);}
  return TRINITY2_CAPABILITIES.map(capability=>({capability,allowed:effective.has(capability)}));
}

export async function requireCapability(env,user,capability){
  if(!TRINITY2_CAPABILITIES.includes(capability))throw new HttpError(500,'Neznáme oprávnenie Trinity.');
  const permission=(await rolePermissions(env,user.role)).find(item=>item.capability===capability);
  if(!permission?.allowed)throw new HttpError(403,'Táto rola nemá oprávnenie na požadovanú schopnosť.');
}

export async function updateRolePermission(env,{role,capability,allowed,updatedBy}){
  z.enum(['admin','user']).parse(role);z.enum(TRINITY2_CAPABILITIES).parse(capability);
  await env.DB.prepare(`INSERT INTO ops_role_permissions(role,capability,allowed,updated_by,updated_at)
    VALUES(?,?,?,?,datetime('now')) ON CONFLICT(role,capability) DO UPDATE SET allowed=excluded.allowed,updated_by=excluded.updated_by,updated_at=excluded.updated_at`)
    .bind(role,capability,allowed?1:0,updatedBy).run();
  await env.DB.prepare("INSERT INTO ops_events(action,details) VALUES('role_permission_changed',?)")
    .bind(JSON.stringify({role,capability,allowed,updated_by:updatedBy})).run();
  return {role,permissions:await rolePermissions(env,role)};
}

const dataUrl=(kind,max)=>z.string().max(max).refine(value=>new RegExp(`^data:${kind}\\/[a-z0-9.+-]+;base64,`,'i').test(value),'Neplatný dátový formát.');
const bytesFromDataUrl=value=>Uint8Array.from(Buffer.from(value.slice(value.indexOf(',')+1),'base64'));
const modelText=result=>extractModelText(result)||result?.description||result?.text||result?.result||'';

export async function analyzeImage(env,input){
  if(!env.AI)throw new HttpError(503,'Workers AI nie je dostupné.');
  const parsed=z.object({image:dataUrl('image',8_000_000),prompt:z.string().trim().min(1).max(2000).default('Podrobne opíš obrázok a dôležité súvislosti.')}).strict().parse(input);
  const model=env.VISION_MODEL||'@cf/meta/llama-3.2-11b-vision-instruct';
  const result=await env.AI.run(model,{messages:[{role:'system',content:'Analyzuj iba poskytnutý obrázok. Jasne odlíš pozorovanie od odhadu.'},{role:'user',content:parsed.prompt}],image:parsed.image});
  const text=modelText(result).trim();if(!text)throw new HttpError(502,'Model obrazu vrátil prázdnu odpoveď.');
  return {text,model,verified_at:new Date().toISOString()};
}

export async function transcribeAudio(env,input){
  if(!env.AI)throw new HttpError(503,'Workers AI nie je dostupné.');
  const parsed=z.object({audio:dataUrl('audio',12_000_000),language:z.string().trim().max(20).optional()}).strict().parse(input);
  const bytes=bytesFromDataUrl(parsed.audio);if(bytes.length>8_000_000)throw new HttpError(413,'Zvukový súbor je príliš veľký.');
  const model=env.STT_MODEL||'@cf/openai/whisper-large-v3-turbo';
  const result=await env.AI.run(model,{audio:[...bytes],language:parsed.language});
  const text=(result?.text||result?.transcription||modelText(result)).trim();if(!text)throw new HttpError(502,'Prepis hlasu je prázdny.');
  return {text,model,word_count:Array.isArray(result?.word_count)?result.word_count:undefined,verified_at:new Date().toISOString()};
}

async function audioBytes(result){
  if(result instanceof Response)return new Uint8Array(await result.arrayBuffer());
  if(result instanceof ArrayBuffer)return new Uint8Array(result);
  if(result instanceof Uint8Array)return result;
  if(result?.audio instanceof Uint8Array)return result.audio;
  if(typeof result?.audio==='string')return Uint8Array.from(Buffer.from(result.audio,'base64'));
  throw new HttpError(502,'Hlasový model nevrátil zvuk.');
}

export async function synthesizeSpeech(env,input){
  if(!env.AI||!env.ARTIFACTS)throw new HttpError(503,'Hlasový výstup nie je dostupný.');
  const parsed=z.object({text:z.string().trim().min(1).max(5000),language:z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('sk')}).strict().parse(input);
  const model=env.TTS_MODEL||'@cf/myshell-ai/melotts';
  const result=await env.AI.run(model,{prompt:parsed.text,lang:parsed.language.slice(0,2)}),bytes=await audioBytes(result);
  const id=crypto.randomUUID();await env.ARTIFACTS.put(`media/audio/${id}.mp3`,bytes,{httpMetadata:{contentType:'audio/mpeg'},customMetadata:{model,language:parsed.language}});
  return {id,type:'audio',model,url:`/api/assistant/media/audio/${id}`,verified_at:new Date().toISOString()};
}

const workflowDefinition=z.object({nodes:z.array(z.object({id:z.string().max(80),type:z.enum(['input','ai','tool','approval','output']),label:z.string().max(120),x:z.number().finite(),y:z.number().finite()}).strict()).max(50),edges:z.array(z.object({from:z.string().max(80),to:z.string().max(80)}).strict()).max(100)}).strict();
export async function listVisualWorkflows(env,ownerId){const rows=await env.DB.prepare('SELECT id,name,status,definition_json,created_at,updated_at FROM ops_visual_workflows WHERE owner_id=? ORDER BY updated_at DESC LIMIT 100').bind(ownerId).all();return (rows.results||[]).map(row=>({...row,definition:JSON.parse(row.definition_json),definition_json:undefined}));}
export async function saveVisualWorkflow(env,ownerId,input){const parsed=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(2).max(100),status:z.enum(['draft','active','archived']).default('draft'),definition:workflowDefinition}).strict().parse(input),id=parsed.id||crypto.randomUUID();await env.DB.prepare(`INSERT INTO ops_visual_workflows(id,owner_id,name,definition_json,status) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,definition_json=excluded.definition_json,status=excluded.status,updated_at=datetime('now') WHERE owner_id=excluded.owner_id`).bind(id,ownerId,parsed.name,JSON.stringify(parsed.definition),parsed.status).run();return {id,name:parsed.name,status:parsed.status,definition:parsed.definition};}

export async function listIncidents(env){const rows=await env.DB.prepare('SELECT id,fingerprint,severity,status,title,details_json,created_at,updated_at,resolved_at FROM ops_incidents ORDER BY created_at DESC LIMIT 100').all();return (rows.results||[]).map(row=>({...row,details:JSON.parse(row.details_json),details_json:undefined}));}
export async function resolveIncident(env,id,by){const row=await env.DB.prepare("UPDATE ops_incidents SET status='resolved',resolved_at=datetime('now'),updated_at=datetime('now') WHERE id=? RETURNING id,status,resolved_at").bind(id).first();if(!row)throw new HttpError(404,'Incident neexistuje.');await env.DB.prepare("INSERT INTO ops_events(action,details) VALUES('incident_resolved',?)").bind(JSON.stringify({id,by})).run();return row;}

export async function recordHealthIncident(env,summary){
  if(summary.healthy)return;
  const fingerprint=`health:${[...summary.failed].sort().join(',')}`;
  const existing=await env.DB.prepare("SELECT id FROM ops_incidents WHERE fingerprint=? AND status='open' LIMIT 1").bind(fingerprint).first();
  const id=existing?.id||crypto.randomUUID(),severity=summary.reachable===0?'critical':'warning';
  if(existing)await env.DB.prepare("UPDATE ops_incidents SET severity=?,details_json=?,updated_at=datetime('now') WHERE id=?").bind(severity,JSON.stringify(summary),id).run();
  else await env.DB.prepare('INSERT INTO ops_incidents(id,fingerprint,severity,title,details_json) VALUES(?,?,?,?,?)').bind(id,fingerprint,severity,'Kontrola služieb Trinity zistila problém',JSON.stringify(summary)).run();
  if(env.TRINITY_ALERT_WEBHOOK){try{await fetch(env.TRINITY_ALERT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'trinity_incident',id,severity,summary}),signal:AbortSignal.timeout(10000)});}catch(error){console.error(JSON.stringify({event:'alert_webhook_failed',message:error instanceof Error?error.message:String(error)}));}}
}

const csvCell=value=>`"${String(value??'').replaceAll('"','""')}"`;
export async function exportAudit(env,format='json'){
  const rows=(await env.DB.prepare('SELECT id,action,details,created_at FROM ops_events ORDER BY id DESC LIMIT 5000').all()).results||[];
  if(format==='csv')return {content:['id,action,details,created_at',...rows.map(row=>[row.id,row.action,row.details,row.created_at].map(csvCell).join(','))].join('\n'),contentType:'text/csv; charset=utf-8',filename:'trinity-audit.csv'};
  const parseDetails=value=>{try{return JSON.parse(value||'{}');}catch{return {raw:String(value||'')};}};
  return {content:JSON.stringify({exported_at:new Date().toISOString(),items:rows.map(row=>({...row,details:parseDetails(row.details)}))},null,2),contentType:'application/json; charset=utf-8',filename:'trinity-audit.json'};
}
