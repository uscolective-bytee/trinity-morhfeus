// Root wrapper for Trinity chat contract verification
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const script = join(root, 'Trinity', 'scripts', 'verify-chat-contract.mjs');

const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });
process.exit(res.status ?? 0);
