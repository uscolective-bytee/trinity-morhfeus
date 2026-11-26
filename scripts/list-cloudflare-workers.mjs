/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul list-cloudflare-workers.mjs (scripts/list-cloudflare-workers.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tomlPath = path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml');
const content = fs.readFileSync(tomlPath, 'utf8');
const tokenMatch = content.match(/oauth_token\s*=\s*"([^"]+)"/);
if (!tokenMatch) {
  console.error('No oauth_token found in default.toml');
  process.exit(1);
}

const token = tokenMatch[1];
const accountId = 'b60342e5e52f5646fbd4e913bb409334';

async function listWorkers() {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!data.success) {
    console.error('Cloudflare API error:', data.errors);
    process.exit(1);
  }
  const workers = data.result || [];
  console.log(`Total workers on Cloudflare: ${workers.length}`);
  const summary = workers.map(w => ({
    id: w.id,
    created_on: w.created_on,
    modified_on: w.modified_on,
    routes: w.routes || []
  })).sort((a, b) => a.id.localeCompare(b.id));

  console.log(JSON.stringify(summary, null, 2));
}

listWorkers().catch(console.error);
