// Trinity Workspace Script: workspace-inventory.mjs
// Inspects and computes SHA-256 hashes of workspace scripts and assets.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function hashFile(filepath) {
  try {
    const data = fs.readFileSync(filepath);
    return crypto.createHash('sha256').update(data).digest('hex');
  } catch {
    return null;
  }
}

function run() {
  const dir = path.resolve('Trinity/workspace/scripts');
  if (!fs.existsSync(dir)) {
    console.log(JSON.stringify({ error: 'Scripts directory not found', path: dir }));
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const scripts = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(dir, entry.name);
    const stat = fs.statSync(fullPath);
    const hash = hashFile(fullPath);
    let runtime = 'unknown';
    if (['.js', '.mjs', '.cjs'].includes(path.extname(entry.name))) runtime = 'node';
    if (entry.name.endsWith('.py')) runtime = 'python';
    if (['.cmd', '.bat'].includes(path.extname(entry.name))) runtime = 'cmd';

    scripts.push({
      name: entry.name,
      relative_path: `Trinity/workspace/scripts/${entry.name}`,
      runtime,
      size_bytes: stat.size,
      sha256: hash
    });
  }

  const output = {
    service: 'Trinity Workspace Inventory',
    timestamp: new Date().toISOString(),
    total_scripts: scripts.length,
    scripts
  };

  console.log(JSON.stringify(output, null, 2));
}

run();
