import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {developerTools} from '../src/developer-tools.mjs';
import {executeProposal} from '../src/executor.mjs';
const project='Trinity/workspace/projects/demo';
async function fixture(){const root=await mkdtemp(path.join(os.tmpdir(),'trinity-devtools-'));await mkdir(path.join(root,'Trinity'));return root;}
function proposal(action,payload){return {action,payload:{task:'developer-tools',...payload},status:'approved',expiresAt:new Date(Date.now()+60000).toISOString()};}
test('real project creation, catalog and npm inspection through executor',async()=>{
  const root=await fixture();
  const catalog=await executeProposal(root,proposal('read',{operation:'catalog'}));assert.ok(catalog.tools.length>10);
  const receipt=await executeProposal(root,proposal('run',{operation:'create',project}));assert.equal(receipt.success,true);
  assert.equal(JSON.parse(await readFile(path.join(root,project,'package.json'))).private,true);
  const check=await executeProposal(root,proposal('read',{operation:'inspect',project,tool:'typescript'}));assert.equal(check.status,'missing-or-invalid');assert.equal(check.version,null);
  await assert.rejects(()=>executeProposal(root,proposal('run',{operation:'create',project})),/EEXIST/);
});
test('mutations cannot use read and paths/tools/versions fail closed',async()=>{
  const root=await fixture();
  await assert.rejects(()=>executeProposal(root,proposal('read',{operation:'create',project})),/approved run/);
  await assert.rejects(()=>executeProposal(root,proposal('read',{operation:'execute',project,tool:'prettier'})),/approved run/);
  await assert.rejects(()=>developerTools(root,{operation:'create',project:'../escape'}),/projects/);
  await developerTools(root,{operation:'create',project});
  await assert.rejects(()=>developerTools(root,{operation:'install',project,tool:'unknown',version:'1.0.0'}),/catalog/);
  await assert.rejects(()=>developerTools(root,{operation:'install',project,tool:'typescript',version:'latest'}),/presnú/);
});
test('execute rejects unknown modes and escaping package binaries',async()=>{
  const root=await fixture();await developerTools(root,{operation:'create',project});
  const packageRoot=path.join(root,project,'node_modules','prettier');await mkdir(packageRoot,{recursive:true});
  await writeFile(path.join(packageRoot,'package.json'),JSON.stringify({bin:'../../package.json'}));
  await assert.rejects(()=>developerTools(root,{operation:'execute',project,tool:'prettier',mode:'shell'}),/Unsupported execution/);
  await assert.rejects(()=>developerTools(root,{operation:'execute',project,tool:'prettier'}),/executable path/);
});
test('install arguments disable hooks and require read-back of exact version',async()=>{
  const root=await fixture();await developerTools(root,{operation:'create',project});let calls=0;
  const run=async(command,args)=>{
    calls++;assert.equal(command,'npm');
    if(args[0]==='install'){
      assert.deepEqual(args,['install','--save-dev','--save-exact','--ignore-scripts','--no-audit','--no-fund','--','typescript@5.0.0']);
      await writeFile(path.join(root,project,'package.json'),JSON.stringify({devDependencies:{typescript:'5.0.0'}}));
      return {success:true,exitCode:0,stdout:'',stderr:''};
    }
    return {success:true,exitCode:0,stdout:JSON.stringify({dependencies:{typescript:{version:'5.0.0'}}}),stderr:''};
  };
  assert.equal((await developerTools(root,{operation:'install',project,tool:'typescript',version:'5.0.0'},run)).success,true);assert.equal(calls,2);
  const failed=await developerTools(root,{operation:'install',project,tool:'typescript',version:'5.0.0'},async()=>({success:false,exitCode:1}));assert.equal(failed.success,false);
});
