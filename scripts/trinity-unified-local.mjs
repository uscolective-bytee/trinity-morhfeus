#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║               ✦ TRINITY UNIFIED LOCAL RUNNER ✦                     ║');
console.log('║        Spúšťam spoločné lokálne jadro Trinity (Gateway + Desktop)   ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log(`[Trinity Core] Koreňový adresár: ${root}`);
console.log('[Trinity Core] Prepájanie: Local-Gateway (8791) + Local-Desktop (8795)...');

function startProcess(name, scriptPath, cwd, colorPrefix) {
  const child = spawn(process.execPath, [scriptPath], {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, PORT: name === 'Gateway' ? '8791' : '8795' }
  });

  child.stdout.on('data', (chunk) => {
    const lines = chunk.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`[${name}] ${line.trim()}`);
    }
  });

  child.stderr.on('data', (chunk) => {
    const lines = chunk.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`[${name} ERROR] ${line.trim()}`);
    }
  });

  child.on('exit', (code, signal) => {
    console.warn(`[${name}] Proces sa ukončil s kódom: ${code || signal}`);
  });

  return child;
}

const gatewayProc = startProcess('Gateway', resolve(root, 'Local-Gateway/src/server.mjs'), resolve(root, 'Local-Gateway'));
const desktopProc = startProcess('Desktop', resolve(root, 'Local-Desktop/server.mjs'), resolve(root, 'Local-Desktop'));

const cleanup = () => {
  console.log('\n[Trinity Core] Ukončujem lokálne procesy...');
  try { gatewayProc.kill(); } catch (_) {}
  try { desktopProc.kill(); } catch (_) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

console.log('[Trinity Core] Jednotné lokálne jadro beží. Pre ukončenie stlačte Ctrl+C.');
