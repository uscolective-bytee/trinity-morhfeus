import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
let mf,db;
const session='a'.repeat(64),digest=createHash('sha256').update(session).digest('hex');
before(async()=>{
 const modules=readdirSync('dist').filter(n=>!n.endsWith('.map')&&!n.endsWith('.md')).map(name=>({type:name==='index.js'?'ESModule':name.endsWith('.webp')?'Data':'Text',path:resolve('dist',name)}));
 modules.sort((a,b)=>a.type==='ESModule'?-1:b.type==='ESModule'?1:0);
 mf=new Miniflare(convertV4MiniflareOptions({modules,compatibilityDate:'2026-10-11',compatibilityFlags:['nodejs_compat'],bindings:{TRINITY_AUTH_MODE:'google',TRINITY_OWNER_EMAIL:'owner@example.test'},d1Databases:{DB:'overview-test'}}));
 db=await mf.getD1Database('DB');
 await db.batch([db.prepare('CREATE TABLE ops_sessions(token_hash TEXT PRIMARY KEY,expires_at INTEGER,email TEXT)'),db.prepare('CREATE TABLE ops_users(email TEXT PRIMARY KEY,role TEXT,status TEXT)'),db.prepare('CREATE TABLE ops_control(id INTEGER,emergency_stop INTEGER,reason TEXT,updated_by TEXT,updated_at TEXT)'),
 db.prepare('INSERT INTO ops_sessions VALUES(?,?,?)').bind(digest,Date.now()+60000,'member@example.test'),
 db.prepare("INSERT INTO ops_users VALUES('member@example.test','user','active')")]);
});
after(async()=>{await mf?.dispose();});
test('overview rejects anonymous requests',async()=>{
 const r=await mf.dispatchFetch('https://trinity.test/api/assistant/dashboard');assert.equal(r.status,401);
});
for(const role of ['user','admin'])test('overview rejects authenticated '+role+' on the server',async()=>{
 await db.prepare('UPDATE ops_users SET role=?').bind(role).run();
 const r=await mf.dispatchFetch('https://trinity.test/api/assistant/dashboard',{headers:{Cookie:'trinity_session='+session}});
 assert.equal(r.status,403,await r.clone().text());
});
