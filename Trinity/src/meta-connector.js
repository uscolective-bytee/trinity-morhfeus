/**
 * @module TRINITY_OMNI_CORE
 * @subsystem EXTERNAL_CONNECTORS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul meta-connector.js (Trinity/src/meta-connector.js) v ekosystéme TRINITY OMNI-CORE.
 */
import {HttpError,hash,readJSON,checkOrigin,authenticate} from './security.js';
import {storeSecret,getSecretMaterial} from './secret-vault.js';

export const META_READ_SCOPES=Object.freeze(['public_profile','pages_show_list','pages_read_engagement','instagram_basic']);
const CALLBACK='/api/assistant/connectors/meta/callback';
const BASE='/api/assistant/connectors/meta';
const fail=(status,message)=>{throw new HttpError(status,message);};
function ownerSession(request,user){
 if(!user||!['owner','admin'].includes(user.role))fail(403,'Prepojenie Meta môže spravovať iba overený správca.');
 const session=request.headers.get('Cookie')?.match(/(?:^|;\s*)trinity_session=([a-f0-9]{64})(?:;|$)/)?.[1];
 if(!session)fail(401,'Pre Meta sa prihlás do Trinity v tomto prehliadači.');
 return session;
}
function configuration(env,origin){
 const missing=['META_APP_ID','META_APP_SECRET','META_GRAPH_VERSION','TRINITY_VAULT_KEY'].filter(key=>!env[key]);
 if(missing.length)return {missing};
 if(!/^\d+$/.test(env.META_APP_ID)||!/^v\d+\.\d+$/.test(env.META_GRAPH_VERSION))fail(503,'Neplatná konfigurácia Meta aplikácie alebo verzie API.');
 const redirect=new URL(env.META_REDIRECT_URI||CALLBACK,origin);
 if(redirect.origin!==origin||redirect.protocol!=='https:'||redirect.pathname!==CALLBACK||redirect.search||redirect.hash)fail(503,'Meta callback musí používať HTTPS a rovnakú doménu Trinity.');
 return {missing:[],appId:env.META_APP_ID,secret:env.META_APP_SECRET,version:env.META_GRAPH_VERSION,redirect:redirect.href};
}
const configDigest=config=>hash(config.appId+':'+config.version+':'+config.redirect);
async function providerJSON(fetcher,url,options={},stage='provider_request'){
 let response;
 // Workers supports manual/follow only. Never forward credentials across redirects.
 try{response=await fetcher(url,{...options,redirect:'manual',signal:AbortSignal.timeout(15000)});}catch{fail(502,'Meta je momentálne nedostupná.');}
 if(response.type==='opaqueredirect'||response.status>=300&&response.status<400){
  try{await response.body?.cancel();}catch{}
  fail(502,'Meta vrátila nepovolené presmerovanie.');
 }
 let data;try{
  const reader=response.body?.getReader();if(!reader)throw Error('empty');
  let size=0,text='';const decoder=new TextDecoder();
  while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>1000000){await reader.cancel();throw Error('large');}text+=decoder.decode(chunk.value,{stream:true});}
  data=JSON.parse(text+decoder.decode());
 }catch{fail(502,'Meta nevrátila platnú obmedzenú JSON odpoveď.');}
 if(!data||typeof data!=='object'||Array.isArray(data))fail(502,'Meta nevrátila objekt JSON.');
 if(!response.ok||data.error){
  // Only static stages and bounded numeric codes may leave this boundary.
  // Provider messages, URLs, bodies and traces can contain credentials.
  const details=['stage='+(['token_exchange','profile','permissions','pages'].includes(stage)?stage:'provider_request'),'http='+response.status];
  for(const [label,value] of [['code',data.error?.code],['subcode',data.error?.error_subcode]]){
   if(Number.isSafeInteger(value)&&value>=0&&value<=2147483647)details.push(label+'='+value);
  }
  fail(response.status===401||data.error?.code===190?401:502,'Meta odmietla požiadavku; skontroluj prihlásenie a oprávnenia. ['+details.join('; ')+']');
 }
 return data;
}
async function identityProbe(config,token,fetcher){
 const get=(endpoint,fields,stage)=>providerJSON(fetcher,'https://graph.facebook.com/'+config.version+'/'+endpoint+(fields?'?'+new URLSearchParams(fields):''),{headers:{Authorization:'Bearer '+token}},stage);
 const profile=await get('me',{fields:'id,name'},'profile');
 if(!/^\d+$/.test(profile.id||'')||typeof profile.name!=='string'||!profile.name.trim())fail(502,'Meta nepotvrdila identitu účtu.');
 const permissions=await get('me/permissions',undefined,'permissions');
 if(!Array.isArray(permissions.data))fail(502,'Meta nepotvrdila oprávnenia účtu.');
 const scopes=permissions.data.filter(item=>item.status==='granted'&&typeof item.permission==='string').map(item=>item.permission);
 if(META_READ_SCOPES.some(scope=>!scopes.includes(scope)))fail(403,'Neboli udelené potrebné oprávnenia na čítanie účtu a stránok.');
 const result=await get('me/accounts',{fields:'id,name,instagram_business_account{id,username}',limit:'50'},'pages');
 if(!Array.isArray(result.data))fail(502,'Meta nepotvrdila zoznam stránok.');
 const pages=result.data.map(page=>{
  if(!/^\d+$/.test(page.id||'')||typeof page.name!=='string')fail(502,'Meta vrátila neplatnú stránku.');
  const ig=page.instagram_business_account;
  if(ig&&(!/^\d+$/.test(ig.id||'')||typeof ig.username!=='string'))fail(502,'Meta vrátila neplatný Instagram účet.');
  return {id:page.id,name:page.name.slice(0,200),instagram:ig?{id:ig.id,username:ig.username.slice(0,100)}:null};
 });
 return {account_id:profile.id,account_name:profile.name.slice(0,200),scopes:[...new Set(scopes)].sort(),pages,pages_truncated:Boolean(result.paging?.next)};
}
function present(row){
 const expired=Number.isFinite(row.expires_at)&&row.expires_at<=Date.now();
 return {status:expired?'expired':row.status||'connected_read_only',account:{id:row.account_id,name:row.account_name},
 scopes:JSON.parse(row.scopes_json),pages:JSON.parse(row.pages_json),expires_at:row.expires_at,
 verified_at:row.verified_at,publishing_enabled:false,evidence:'provider_identity_and_permissions'};
}
export async function metaStatus(env,ownerId,origin){
 const config=configuration(env,origin);
 if(config.missing.length)return {status:'needs_setup',missing:config.missing,publishing_enabled:false};
 let row;try{row=await env.DB.prepare("SELECT c.*, v.status AS credential_status FROM meta_connections c LEFT JOIN ops_secret_vault v ON v.id=c.secret_id AND v.owner_id=c.owner_id AND v.provider='custom' WHERE c.owner_id=?").bind(ownerId).first();}
 catch{return {status:'needs_setup',missing:['migration:0053_meta_connections.sql'],publishing_enabled:false};}
 if(row&&(!['stored','verified'].includes(row.credential_status)||row.config_hash!==await configDigest(config)))row.status='reauthorization_required';
 return row?present(row):{status:'not_connected',publishing_enabled:false,requested_scopes:META_READ_SCOPES};
}
export async function beginMetaConnection(env,{ownerId,session,origin}){
 const config=configuration(env,origin);if(config.missing.length)fail(503,'Meta ešte nie je nastavená: '+config.missing.join(', '));
 const state=Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
 await env.DB.prepare('DELETE FROM meta_oauth_transactions WHERE expires_at<=?').bind(Date.now()).run();
 await env.DB.prepare('INSERT INTO meta_oauth_transactions(state_hash,owner_id,session_hash,redirect_uri,config_hash,expires_at) VALUES(?,?,?,?,?,?)')
 .bind(await hash(state),ownerId,await hash(session),config.redirect,await configDigest(config),Date.now()+600000).run();
 const target=new URL('https://www.facebook.com/'+config.version+'/dialog/oauth');
 target.search=new URLSearchParams({client_id:config.appId,redirect_uri:config.redirect,response_type:'code',scope:META_READ_SCOPES.join(','),state}).toString();
 return {status:'authorization_required',authorization_url:target.href,publishing_enabled:false};
}
export async function completeMetaConnection(env,{ownerId,session,origin,code,state},fetcher=fetch){
 if(typeof state!=='string'||!/^[a-f0-9]{64}$/.test(state)||typeof code!=='string'||!code||code.length>4096)fail(400,'Neplatná odpoveď prihlásenia Meta.');
 const config=configuration(env,origin);if(config.missing.length)fail(503,'Meta konfigurácia nie je dokončená.');
 // Atomic consumption blocks replay/concurrent redemption. Bound to actor and browser session.
 const transaction=await env.DB.prepare('DELETE FROM meta_oauth_transactions WHERE state_hash=? AND owner_id=? AND session_hash=? AND expires_at>? RETURNING *')
 .bind(await hash(state),ownerId,await hash(session),Date.now()).first();
 if(!transaction||transaction.redirect_uri!==config.redirect||transaction.config_hash!==await configDigest(config))fail(400,'Prihlásenie Meta vypršalo alebo patrí inej relácii. Začni ho znova.');
 const tokens=await providerJSON(fetcher,'https://graph.facebook.com/'+config.version+'/oauth/access_token',{
 method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.appId,client_secret:config.secret,redirect_uri:config.redirect,code}).toString()},'token_exchange');
 if(typeof tokens.access_token!=='string'||tokens.access_token.length<8||tokens.access_token.length>4096)fail(502,'Meta nevrátila platné poverenie.');
 const evidence=await identityProbe(config,tokens.access_token,fetcher);
 const stored=await storeSecret(env,ownerId,{provider:'custom',name:'meta-read-only-'+crypto.randomUUID(),secret:tokens.access_token});
 const lifetime=Number(tokens.expires_in);
 const expires=Number.isFinite(lifetime)&&lifetime>0?Date.now()+Math.min(lifetime,Number.MAX_SAFE_INTEGER/1000)*1000:null;
 await env.DB.prepare("INSERT INTO meta_connections(owner_id,secret_id,account_id,config_hash,account_name,scopes_json,pages_json,expires_at,verified_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET secret_id=excluded.secret_id,account_id=excluded.account_id,config_hash=excluded.config_hash,account_name=excluded.account_name,scopes_json=excluded.scopes_json,pages_json=excluded.pages_json,expires_at=excluded.expires_at,verified_at=excluded.verified_at,status='connected_read_only'")
 .bind(ownerId,stored.id,evidence.account_id,await configDigest(config),evidence.account_name,JSON.stringify(evidence.scopes),JSON.stringify(evidence.pages),expires,Date.now()).run();
 return {...await metaStatus(env,ownerId,origin),pages_truncated:evidence.pages_truncated};
}
export async function refreshMetaConnection(env,{ownerId,origin},fetcher=fetch){
 const config=configuration(env,origin);if(config.missing.length)fail(503,'Meta konfigurácia nie je dokončená.');
 const row=await env.DB.prepare('SELECT * FROM meta_connections WHERE owner_id=?').bind(ownerId).first();
 if(!row)fail(404,'Účet Meta ešte nie je pripojený.');
 if(row.config_hash!==await configDigest(config))fail(401,'Meta aplikácia sa zmenila. Prihlás účet znova.');
 if(row.expires_at&&row.expires_at<=Date.now())fail(401,'Poverenie Meta vypršalo. Prihlás účet znova.');
 let evidence;
 try{const stored=await getSecretMaterial(env,{ownerId,id:row.secret_id,provider:'custom'});evidence=await identityProbe(config,stored.secret,fetcher);}
 catch(error){
  const changed=await env.DB.prepare('UPDATE meta_connections SET status=? WHERE owner_id=? AND secret_id=? AND account_id=?').bind([401,403,404].includes(error.status)?'reauthorization_required':'verification_failed',ownerId,row.secret_id,row.account_id).run();
  if(changed.meta?.changes!==1)fail(409,'Pripojenie sa počas overenia zmenilo. Obnov jeho stav.');
  throw error;
 }
 if(evidence.account_id!==row.account_id){
  const changed=await env.DB.prepare("UPDATE meta_connections SET status='reauthorization_required' WHERE owner_id=? AND secret_id=? AND account_id=?").bind(ownerId,row.secret_id,row.account_id).run();
  if(changed.meta?.changes!==1)fail(409,'Pripojenie sa počas overenia zmenilo. Obnov jeho stav.');
  fail(409,'Overený účet nezodpovedá uloženému pripojeniu.');
 }
 const changed=await env.DB.prepare("UPDATE meta_connections SET account_name=?,scopes_json=?,pages_json=?,verified_at=?,status='connected_read_only' WHERE owner_id=? AND secret_id=? AND account_id=?")
 .bind(evidence.account_name,JSON.stringify(evidence.scopes),JSON.stringify(evidence.pages),Date.now(),ownerId,row.secret_id,row.account_id).run();
 if(changed.meta?.changes!==1)fail(409,'Pripojenie sa počas overenia zmenilo. Obnov jeho stav.');
 return {...await metaStatus(env,ownerId,origin),pages_truncated:evidence.pages_truncated};
}
export async function handleMetaConnection(request,env,user,fetcher=fetch){
 const url=new URL(request.url);if(!url.pathname.startsWith(BASE))return null;
 checkOrigin(request);
 const session=ownerSession(request,user);
 // Validate the browser cookie independently; an API key plus a fabricated cookie is insufficient.
 const sessionUser=await authenticate(new Request(request.url,{headers:{Cookie:'trinity_session='+session}}),env);
 ownerSession(request,sessionUser);
 const ownerId=(sessionUser.email||sessionUser.id).trim().toLowerCase(),context={ownerId,session,origin:url.origin};
 let result;
 if(request.method==='GET'&&url.pathname===BASE)result=await metaStatus(env,ownerId,url.origin);
 else if(request.method==='POST'&&url.pathname===BASE+'/start')result=await beginMetaConnection(env,context);
 else if(request.method==='POST'&&url.pathname===BASE+'/complete'){const {code,state}=await readJSON(request,10000);result=await completeMetaConnection(env,{...context,code,state},fetcher);}
 else if(request.method==='POST'&&url.pathname===BASE+'/verify')result=await refreshMetaConnection(env,context,fetcher);
 else fail(404,'Meta operácia nie je podporovaná.');
 return Response.json(result,{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
