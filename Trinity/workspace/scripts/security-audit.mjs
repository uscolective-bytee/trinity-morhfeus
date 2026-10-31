// Trinity Workspace Script: security-audit.mjs
// Scans workspace files for leaked tokens, keys, and credentials.

import fs from 'node:fs';
import path from 'node:path';

const SUSPICIOUS_PATTERNS = [
  { name: 'API Key Plaintext', regex: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH|PRIVATE) KEY-----/ },
  { name: 'AWS Secret Access Key', regex: /(?:aws_secret_access_key|Secret_Access_Key)\s*[:=]\s*[A-Za-z0-9/+=]{30,}/i },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ }
];

function scanDir(dir, findings = []) {
  if (!fs.existsSync(dir)) return findings;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) {
        scanDir(fullPath, findings);
      }
    } else if (entry.isFile() && ['.js', '.mjs', '.json', '.txt', '.md', '.py', '.cmd'].includes(path.extname(entry.name))) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of SUSPICIOUS_PATTERNS) {
          if (pattern.regex.test(content)) {
            findings.push({
              file: fullPath,
              issue: pattern.name
            });
          }
        }
      } catch {}
    }
  }
  return findings;
}

function run() {
  const workspaceDir = path.resolve('Trinity/workspace');
  const findings = scanDir(workspaceDir);

  const report = {
    service: 'Trinity Workspace Security Guard',
    timestamp: new Date().toISOString(),
    scanned_path: workspaceDir,
    clean: findings.length === 0,
    findings_count: findings.length,
    findings
  };

  console.log(JSON.stringify(report, null, 2));
}

run();
