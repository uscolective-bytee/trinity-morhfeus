import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PLUGINS} from '../Trinity/src/plugins.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const environment=process.argv[2]||'production';
if(!['development','production'].includes(environment))throw Error('Specify development or production.');
const corePlugins=PLUGINS;
const ids=corePlugins.map(p=>p.id);
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const statements=corePlugins.map(p=>`INSERT INTO ops_plugins(id,version,installed,enabled,source,installed_at,updated_at) VALUES(${quote(p.id)},${quote(p.version)},1,1,'trinity-core',datetime('now'),datetime('now')) ON CONFLICT(id) DO UPDATE SET installed=1,enabled=1,version=excluded.version,source='trinity-core',updated_at=datetime('now');`);
statements.push(`INSERT INTO ops_events(action,details) VALUES('chat_tools_enabled',${quote(JSON.stringify({plugins:ids.length,source:'owner-request',scope:'full-trusted-catalog'}))});`);
if(!process.argv.includes('--apply')){console.log(JSON.stringify({environment,planned:ids,applied:false}));process.exit(0);}
const worker=resolve(root,'Trinity');const config=JSON.parse(readFileSync(resolve(worker,'wrangler.jsonc'),'utf8'));
const section=(environment==='development'&&config.env?.development)?config.env.development:config;
const envFlag=(environment==='development'&&config.env?.development)?'--env=development':'--env=';
const database=section.d1_databases.find(db=>db.binding==='DB')?.database_name;
if(!database)throw Error('Missing environment DB.');
const cli=resolve(worker,'node_modules/wrangler/bin/wrangler.js');
const tmpFile=resolve(worker,`.enable-tools-${environment}.sql`);
writeFileSync(tmpFile,statements.join('\n'),'utf8');
let result;
try{
  result=spawnSync(process.execPath,[cli,'d1','execute',database,'--remote',envFlag,'--file',tmpFile,'--json'],{cwd:worker,encoding:'utf8',timeout:60000,windowsHide:true});
}finally{
  try{unlinkSync(tmpFile);}catch{}
}
if(result.status!==0||result.error){console.error('Tool installation failed. No success is claimed. Check Cloudflare D1 authorization for '+environment+'.',result.stderr||result.stdout);process.exit(1);}
const jsonStart=result.stdout.indexOf('[');
let data;try{data=JSON.parse(jsonStart>=0?result.stdout.slice(jsonStart):result.stdout);}catch{throw Error('Unrecognized D1 receipt; cannot claim installation.');}
if(!Array.isArray(data)||data.some(item=>item.success!==true))throw Error('D1 did not confirm every statement.');
console.log(JSON.stringify({environment,enabled:ids.length,plugins:ids,applied:true,receipts:data.length}));
