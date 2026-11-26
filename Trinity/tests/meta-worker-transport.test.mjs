import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';

const projectDir=fileURLToPath(new URL('../',import.meta.url));
const token='fixture-only-meta-access-token';
const secret='fixture-only-meta-app-secret';
const code='fixture-only-authorization-code';
const redirectBody='fixture-only-redirect-body';
const redirectLocation='https://must-not-be-called.invalid/leak?token='+token+'&code='+code;
const diagnosticCases=[
 {name:'numeric',code:190,subcode:463,http:401,details:'; code=190; subcode=463'},
 {name:'string',code:'UNTRUSTED_CODE_'+token,subcode:'UNTRUSTED_SUBCODE_'+secret,http:502,details:''},
 {name:'overflow',code:2147483648,subcode:-1,http:502,details:''},
 {name:'max',code:2147483647,subcode:0,http:502,details:'; code=2147483647; subcode=0'}
];
const calls=[];
let mf,db;

before(async()=>{
 const source=`
 import {beginMetaConnection,completeMetaConnection} from './src/meta-connector.js';
 export default {async fetch(request,env){
  const mode=new URL(request.url).pathname.slice(1);
  if(mode==='unsupported-mode'){
   try{
    await fetch('https://graph.facebook.com/v26.0/oauth/access_token',{redirect:'error'});
    return Response.json({unexpected:true});
   }catch(error){return Response.json({name:error.name,message:error.message});}
  }
  const context={ownerId:mode+'@fixture.test',session:'a'.repeat(64),origin:'https://trinity.test'};
  try{
   const pending=await beginMetaConnection(env,context);
   const state=new URL(pending.authorization_url).searchParams.get('state');
   const result=await completeMetaConnection(env,{...context,state,code:'fixture-only-authorization-code'},
    (url,options)=>fetch(url,{...options,headers:{...options.headers,'X-Meta-Fixture-Mode':mode}}));
   return Response.json(result);
  }catch(error){return Response.json({error:error.message},{status:error.status||500});}
 }};
 `;
 const bundled=await build({
  stdin:{contents:source,resolveDir:projectDir,sourcefile:'meta-worker-transport-fixture.js'},
  bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['node:*'],logLevel:'silent'
 });
 // Every outbound request terminates in this local handler. No live Meta or
 // Cloudflare account, secret, route or database is used by this runtime test.
 const outboundService=async request=>{
  const url=new URL(request.url);
  calls.push({host:url.hostname,path:url.pathname,mode:request.headers.get('X-Meta-Fixture-Mode')});
  assert.equal(url.hostname,'graph.facebook.com','redirects must never send credentials to another host');
  const mode=request.headers.get('X-Meta-Fixture-Mode');
  const tokenExchange=url.pathname.endsWith('/oauth/access_token');
  const rejected=/^reject-(token_exchange|profile|permissions|pages)-(numeric|string|overflow|max)$/.exec(mode||'');
  const rejectionFor=stage=>{
   if(!rejected||rejected[1]!==stage)return null;
   const diagnostic=diagnosticCases.find(item=>item.name===rejected[2]);
   return Response.json({error:{
    code:diagnostic.code,
    error_subcode:diagnostic.subcode,
    message:'UNTRUSTED_MESSAGE '+token+' '+secret+' '+code,
    type:'UNTRUSTED_TYPE_'+code,
    error_user_title:'UNTRUSTED_TITLE_'+secret,
    error_user_msg:'UNTRUSTED_USER_MESSAGE_'+token,
    error_data:{access_token:token,app_secret:secret,authorization_code:code,url:redirectLocation,body:redirectBody},
    fbtrace_id:'UNTRUSTED_TRACE_'+token
   }},{status:400});
  };
  if(mode?.startsWith('redirect-')&&(tokenExchange||mode==='redirect-profile')){
   if(mode!=='redirect-profile'||!tokenExchange){
    const status=mode==='redirect-profile'?307:Number(mode.slice('redirect-'.length));
    return new Response(redirectBody,{status,headers:{Location:redirectLocation}});
   }
  }
  if(tokenExchange){
   assert.equal(request.method,'POST');
   const body=new URLSearchParams(await request.text());
   assert.equal(body.get('client_secret'),secret);
   assert.equal(body.get('code'),code);
   return rejectionFor('token_exchange')||Response.json({access_token:token,expires_in:3600});
  }
  assert.equal(request.headers.get('Authorization'),'Bearer '+token);
  if(url.pathname.endsWith('/me/permissions'))return rejectionFor('permissions')||Response.json({data:[
   'public_profile','pages_show_list','pages_read_engagement','instagram_basic'
  ].map(permission=>({permission,status:'granted'}))});
  if(url.pathname.endsWith('/me/accounts'))return rejectionFor('pages')||Response.json({data:[{
   id:'456',name:'Fixture Page',access_token:'fixture-page-token-must-not-escape',
   instagram_business_account:{id:'789',username:'fixture_creator'}
  }]});
  if(url.pathname.endsWith('/me'))return rejectionFor('profile')||Response.json({id:'123',name:'Fixture Owner'});
  throw Error('Unexpected local Meta fixture endpoint');
 };
 mf=new Miniflare(convertV4MiniflareOptions({
  modules:true,script:bundled.outputFiles[0].text,
  compatibilityDate:'2026-10-11',compatibilityFlags:['nodejs_compat'],
  bindings:{META_APP_ID:'123456',META_APP_SECRET:secret,META_GRAPH_VERSION:'v26.0',
   TRINITY_VAULT_KEY:Buffer.alloc(32,7).toString('base64url')},
  d1Databases:{DB:'meta-worker-transport-fixture'},outboundService
 }));
 db=await mf.getD1Database('DB');
 for(const file of ['0053_meta_connections.sql','0021_secret_vault.sql']){
  const statements=readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8')
   .split(/;\s*(?:\r?\n|$)/).map(sql=>sql.trim()).filter(Boolean);
  await db.batch(statements.map(sql=>db.prepare(sql)));
 }
 await db.prepare('CREATE TABLE ops_events(action TEXT,details TEXT)').run();
},{timeout:60000});
after(async()=>{await mf?.dispose();});

test('workerd rejects redirect:error before any outbound request',async()=>{
 const beforeCalls=calls.length;
 const result=await(await mf.dispatchFetch('https://trinity.test/unsupported-mode')).json();
 assert.equal(result.name,'TypeError');
 assert.match(result.message,/redirect/i);
 assert.equal(calls.length,beforeCalls);
});

test('actual Meta connector completes native workerd fetches and stores encrypted D1 evidence',async()=>{
 const beforeCalls=calls.length;
 const response=await mf.dispatchFetch('https://trinity.test/success');
 const body=await response.text();
 assert.equal(response.status,200,body);
 const result=JSON.parse(body);
 assert.equal(result.status,'connected_read_only');
 assert.equal(result.account.id,'123');
 assert.equal(result.pages[0].id,'456');
 assert.equal(result.pages[0].instagram.username,'fixture_creator');
 assert.equal(result.publishing_enabled,false);
 assert.equal(calls.length-beforeCalls,4);
 for(const sensitive of [token,secret,code,'fixture-page-token-must-not-escape'])assert.equal(body.includes(sensitive),false);
 const connection=await db.prepare('SELECT status,verified_at FROM meta_connections WHERE owner_id=?')
  .bind('success@fixture.test').first();
 assert.equal(connection.status,'connected_read_only');
 assert.ok(connection.verified_at>0);
 const stored=await db.prepare('SELECT secret_ciphertext FROM ops_secret_vault WHERE owner_id=?')
  .bind('success@fixture.test').first();
 assert.ok(stored.secret_ciphertext);
 assert.equal(stored.secret_ciphertext.includes(token),false);
});

for(const status of [301,302,303,307,308])test('workerd never follows a credential-bearing '+status+' token-exchange redirect',async()=>{
 const mode='redirect-'+status,beforeCalls=calls.length;
 const response=await mf.dispatchFetch('https://trinity.test/'+mode);
 const body=await response.text();
 assert.equal(response.status,502,body);
 assert.match(JSON.parse(body).error,/presmerovanie/i);
 assert.equal(calls.length-beforeCalls,1);
 for(const sensitive of [token,secret,code,redirectBody,redirectLocation])assert.equal(body.includes(sensitive),false);
 assert.equal(await db.prepare('SELECT count(*) AS n FROM meta_connections WHERE owner_id=?').bind(mode+'@fixture.test').first('n'),0);
});

test('workerd also rejects a redirect after token exchange without storing an account',async()=>{
 const beforeCalls=calls.length;
 const response=await mf.dispatchFetch('https://trinity.test/redirect-profile');
 const body=await response.text();
 assert.equal(response.status,502,body);
 assert.match(JSON.parse(body).error,/presmerovanie/i);
 assert.equal(calls.length-beforeCalls,2);
 assert.equal(calls.some(call=>call.host==='must-not-be-called.invalid'),false);
 for(const sensitive of [token,secret,code,redirectBody,redirectLocation])assert.equal(body.includes(sensitive),false);
 assert.equal(await db.prepare('SELECT count(*) AS n FROM meta_connections WHERE owner_id=?').bind('redirect-profile@fixture.test').first('n'),0);
});

for(const [stage,expectedCalls] of [['token_exchange',1],['profile',2],['permissions',3],['pages',4]]){
 for(const diagnostic of diagnosticCases)test('workerd sanitizes '+diagnostic.name+' provider diagnostics at '+stage,async()=>{
  const mode='reject-'+stage+'-'+diagnostic.name,beforeCalls=calls.length;
  const response=await mf.dispatchFetch('https://trinity.test/'+mode);
  const body=await response.text();
  assert.equal(response.status,diagnostic.http,body);
  const result=JSON.parse(body);
  assert.deepEqual(result,{error:'Meta odmietla požiadavku; skontroluj prihlásenie a oprávnenia. [stage='+stage+'; http=400'+diagnostic.details+']'});
  for(const sensitive of [token,secret,code,redirectLocation,redirectBody,'UNTRUSTED_','error_data','fbtrace_id'])assert.equal(body.includes(sensitive),false);
  assert.equal(calls.length-beforeCalls,expectedCalls,'no request may continue after its provider stage failed');
  for(const table of ['meta_connections','ops_secret_vault']){
   assert.equal(await db.prepare('SELECT count(*) AS n FROM '+table+' WHERE owner_id=?').bind(mode+'@fixture.test').first('n'),0);
  }
 });
}
