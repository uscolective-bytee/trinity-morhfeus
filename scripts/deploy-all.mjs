#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║              ✦ TRINITY GUARDED STAGING DEPLOY ✦                    ║');
console.log('║       Tento príkaz nikdy automaticky nenasadzuje produkciu.         ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');

function run(command, args, cwd = root) {
  const quotedCommand = (command.includes(' ') && !command.startsWith('"')) ? `"${command}"` : command;
  console.log(`\n[Deploy] Spúšťam: ${quotedCommand} ${args.join(' ')} v ${cwd === root ? 'root' : cwd.slice(root.length)}`);
  const res = spawnSync(quotedCommand, args, { cwd, stdio: 'inherit', env: process.env, shell: true });
  if (res.status !== 0) {
    console.error(`[Deploy CHYBA] Príkaz ${command} zlyhal s kódom ${res.status}`);
    process.exit(res.status || 1);
  }
}

function runCapture(command, args, cwd = root) {
  const quotedCommand = (command.includes(' ') && !command.startsWith('"')) ? `"${command}"` : command;
  const res = spawnSync(quotedCommand, args, { cwd, encoding: 'utf8', env: process.env, shell: true });
  return (res.stdout || '').trim();
}

const commitSha = runCapture('git', ['rev-parse', 'HEAD']);
console.log(`[Deploy] Git Commit: ${commitSha}`);

// Staging is deployed and verified on its own. Production and supporting
// production workers require a separate, explicit post-ACK command.
console.log('\n--- 1/1 Nasadzujem izolovaný staging Worker trinity-staging (auru.dev) ---');
run(npm, ['run', 'deploy:staging', '--', '--tag', commitSha], resolve(root, 'Trinity'));
run(process.execPath, ['scripts/verify-deployment.mjs', 'https://auru.dev', commitSha], resolve(root, 'Trinity'));

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║             ✦ STAGING BOL NASADENÝ A OVERENÝ ✦                     ║');
console.log('║       Produkcia auru.space zostala bez zmeny a vyžaduje ACK.       ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
