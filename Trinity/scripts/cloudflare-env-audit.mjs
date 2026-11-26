import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const configFile=fileURLToPath(new URL('../wrangler.jsonc',import.meta.url));

export function sharedMutableBindings(config){
  const staging=config?.env?.staging;
  if(!staging)throw new Error('Staging environment not defined.');
  const categories=[
    ['D1','d1_databases','binding','database_id'],
    ['KV','kv_namespaces','binding','id'],
    ['R2','r2_buckets','binding','bucket_name']
  ];
  const collisions=[];
  for(const [type,key,bindingKey,idKey] of categories){
    const prod=Array.isArray(config[key])?config[key]:[];
    const dev=Array.isArray(staging[key])?staging[key]:[];
    for(const p of prod){
      const identifier=p[idKey];
      if(!identifier)continue;
      for(const d of dev){
        if(d[idKey]===identifier){
          collisions.push({
            type,
            production_binding:p[bindingKey],
            staging_binding:d[bindingKey],
            shared_resource:true,
            isolation_verified:false
          });
        }
      }
    }
  }
  return collisions;
}

export function reportEnvironmentIsolation(config){
  const collisions=sharedMutableBindings(config);
  return {
    checked:'configuration-only',
    staging:config.env.staging?.name||'unknown',
    production:config.name||'unknown',
    shared_mutable_resources:collisions,
    isolated:collisions.length===0,
    note:collisions.length
      ?'Shared D1/KV/R2 resources can leak staging writes into production. Provision distinct resources and migrate safely.'
      :'No common D1/KV/R2 identifiers detected in config; live deployment remains unverified.'
  };
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const config=JSON.parse(readFileSync(configFile,'utf8'));
  const report=reportEnvironmentIsolation(config);
  console.log(JSON.stringify(report,null,2));
  if(process.argv.includes('--strict')&&!report.isolated)process.exitCode=2;
}
