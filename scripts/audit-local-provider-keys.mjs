// Explicitly scoped audit of the owner's known Trinity configuration.
// Never print values, fingerprints, raw provider responses or request headers.
import {readFile,writeFile} from 'node:fs/promises';
const path='C:/Users/saboi/OneDrive/trinity/.env';
const buffer=await readFile(path);
const utf16le=(buffer[0]===0xff&&buffer[1]===0xfe)||(buffer.length>3&&buffer[1]===0&&buffer[3]===0);
const raw=buffer.toString(utf16le?'utf16le':'utf8').replace(/^\uFEFF/,'');
const entries=new Map();
for(const line of raw.split(/\r?\n/)){
  const match=line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if(match)entries.set(match[1],match[2].trim().replace(/^(['"])(.*)\1$/,'$2'));
}
const checks=[];
for(const spec of [
  {provider:'openai',name:'OPENAI_API_KEY',pattern:/^sk-[A-Za-z0-9_-]{20,}$/,url:'https://api.openai.com/v1/models'},
  {provider:'anthropic',name:'ANTHROPIC_API_KEY',pattern:/^sk-ant-[A-Za-z0-9_-]{20,}$/,url:'https://api.anthropic.com/v1/models'}
]){
  const key=entries.get(spec.name);
  const row={provider:spec.provider,source_file:path,variable:spec.name,present:!!key,verified:false};
  if(!key||!spec.pattern.test(key)||/placeholder|your[_-]?api|example|replace[_-]?me/i.test(key))row.status='missing-or-placeholder-or-unrecognized-format';
  else{
    try{
      const headers=spec.provider==='openai'?{Authorization:'Bearer '+key}:{'x-api-key':key,'anthropic-version':'2023-06-01'};
      const response=await fetch(spec.url,{headers,signal:AbortSignal.timeout(10000),redirect:'error'});
      row.http_status=response.status;
      row.verified=response.ok;row.status=response.ok?'models-read-verified':'provider-rejected-or-unavailable';
      await response.body?.cancel();
    }catch{row.status='request-failed-or-timed-out';}
  }
  checks.push(row);
}
const report={checked_at:new Date().toISOString(),scope:'known-local-trinity-env-only',secret_values_exported:false,provider_accounts_created:false,checks};
await writeFile(new URL('../Trinity/verification/local-provider-key-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
