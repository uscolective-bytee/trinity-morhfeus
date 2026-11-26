/**
 * @module TRINITY_OMNI_CORE
 * @subsystem LOCAL_BRIDGE_GATEWAY
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul developer-tools.mjs (Local-Gateway/src/developer-tools.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import {mkdir,writeFile,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {resolveSafePath,validatePackage,isInside} from './policy.mjs';
import {scriptEnvironment} from './script-command.mjs';

// Extend reviewed entries here; a catalog entry is not an installation claim.
export const DEVELOPER_TOOLS=Object.freeze([
  ['typescript','languages'],['vite','frontend'],['esbuild','build'],
  ['vitest','testing'],['playwright','browser-testing'],['eslint','quality'],
  ['prettier','formatting'],['typedoc','documentation'],['tsx','runtime'],
  ['wrangler','cloud'],['firebase-tools','cloud'],['vercel','cloud'],
  ['prisma','database'],['drizzle-kit','database'],['@nestjs/cli','backend'],
  ['@openapitools/openapi-generator-cli','api'],['npm-check-updates','dependencies']
].map(([id,category])=>Object.freeze({id,category,manager:'npm',installation:'project-local',requires_exact_version:true})));

export async function developerTools(workspaceRoot,payload,run){
  const operation=payload.operation||'catalog';
  if(operation==='catalog')return {success:true,tools:DEVELOPER_TOOLS,note:'Catalog only; use inspect to verify installation. Some tools need additional runtimes or binaries.'};
  const project=payload.project;
  if(typeof project!=='string'||!/^Trinity\/workspace\/projects\/[a-z0-9][a-z0-9-]{0,63}$/.test(project))throw new Error('Use Trinity/workspace/projects/<project-name>.');
  const cwd=await resolveSafePath(workspaceRoot,project,{allowMissing:operation==='create'});
  if(operation==='create'){
    await mkdir(path.dirname(cwd),{recursive:true});
    await mkdir(cwd); // Fail on existing projects; never overwrite their files.
    const name=path.basename(cwd);
    await writeFile(path.join(cwd,'package.json'),JSON.stringify({name,version:'0.1.0',private:true,type:'module',scripts:{test:'node --test'}},null,2)+'\n',{flag:'wx'});
    await writeFile(path.join(cwd,'README.md'),`# ${name}\n\nCreated by Trinity Local Gateway.\n`,{flag:'wx'});
    return {success:true,operation,project,files:['package.json','README.md']};
  }
  const tool=DEVELOPER_TOOLS.find(entry=>entry.id===payload.tool);
  if(!tool)throw new Error('Tool is not in the reviewed catalog.');
  if(operation==='execute'){
    const modes={version:['--version'],check:{prettier:['--check','.'],typescript:['--noEmit'],eslint:['.']},build:{vite:['build']},test:{vitest:['run']}};
    const mode=payload.mode||'version';
    const args=mode==='version'?modes.version:modes[mode]?.[tool.id];
    if(!args)throw new Error('Unsupported execution mode for this tool.');
    const packageRoot=await realpath(path.join(cwd,'node_modules',tool.id));
    if(!isInside(cwd,packageRoot))throw new Error('Tool resolves outside project.');
    const manifest=JSON.parse(await readFile(path.join(packageRoot,'package.json'),'utf8'));
    const bin=typeof manifest.bin==='string'?manifest.bin:manifest.bin?.[tool.id==='typescript'?'tsc':tool.id.split('/').at(-1)];
    if(typeof bin!=='string')throw new Error('Tool has no supported executable.');
    const target=await realpath(path.resolve(packageRoot,bin));
    if(!isInside(packageRoot,target)||!['','.js','.mjs','.cjs'].includes(path.extname(target)))throw new Error('Unsupported executable path.');
    return {operation,project,tool:tool.id,mode,version:manifest.version,...await run(process.execPath,[target,...args],{cwd,timeoutMs:120_000,environment:scriptEnvironment()})};
  }
  if(operation==='inspect'){
    const result=await run('npm',['ls','--json','--depth=0','--',tool.id],{cwd,environment:scriptEnvironment()});
    let data;try{data=JSON.parse(result.stdout);}catch{return {...result,success:false,operation,tool:tool.id,status:'unknown'};}
    const installed=data.dependencies?.[tool.id];
    return {...result,operation,tool:tool.id,status:result.success&&installed?.version?'installed':'missing-or-invalid',version:installed?.version||null};
  }
  if(operation!=='install')throw new Error('Unsupported developer tool operation.');
  const spec=validatePackage(tool.id,payload.version);
  // Disable dependency hooks. Binary downloads/authentication are separate actions.
  const install=await run('npm',['install','--save-dev','--save-exact','--ignore-scripts','--no-audit','--no-fund','--',spec],{cwd,timeoutMs:300_000,environment:scriptEnvironment()});
  if(!install.success)return {success:false,operation,tool:tool.id,install};
  const verification=await developerTools(workspaceRoot,{operation:'inspect',project,tool:tool.id},run);
  const manifest=JSON.parse(await readFile(path.join(cwd,'package.json'),'utf8'));
  return {success:verification.success&&verification.version===payload.version&&manifest.devDependencies?.[tool.id]===payload.version,operation,project,tool:tool.id,install,verification,lifecycle_scripts:false};
}
