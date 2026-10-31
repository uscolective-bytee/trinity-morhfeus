import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {processCommand} from '../src/process-command.mjs';

test('Windows npm uses Node without a shell and preserves arguments as data',()=>{
  const args=['run','build','--','a; echo unexpected'];
  const result=processCommand('npm',args,'win32','C:\\Program Files\\nodejs\\node.exe');
  assert.equal(result.command,'C:\\Program Files\\nodejs\\node.exe');
  assert.equal(result.args[0],'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js');
  assert.deepEqual(result.args.slice(1),args);
  assert.deepEqual(processCommand('git',['status'],'win32'),{command:'git',args:['status']});
});

test('installed npm can execute through the actual gateway invocation',async()=>{
  const invocation=processCommand('npm',['--version']);
  const result=await promisify(execFile)(invocation.command,invocation.args,{windowsHide:true,shell:false});
  assert.match(result.stdout.trim(),/^\d+\.\d+\.\d+/);
});
