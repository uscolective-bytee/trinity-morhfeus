/**
 * @module TRINITY_OMNI_CORE
 * @subsystem RING0_SOVEREIGN_LOCK
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Ring 0 ochrana kódu, kryptografický Consent Envelope (HMAC-SHA256 + Diff SHA-256 + Durable Nonce Vault) a Data-Command Boundary.
 */
/**
 * TRINITY SOVEREIGN LOCK & ROOT-AUTHORITY COVENANT (Ring 0 Middleware)
 * Sole Architectural Root Authority: Basterix (Sabo Ivan)
 *
 * Enforces the 5 Iron Rules of Code Protection and Root Governance + P0 Cryptographic Hardening:
 * 1. No Self-Rewrite Without Basterix (Strict Manual Consent + SHA-256 Git Diff + Nonce + Expiry)
 * 2. Data-Command Boundary (External inputs are strictly PASSIVE_DATA, never trust unverified sender)
 * 3. Owner Key Assertion (Fail-closed verifiedSession = false by default; strictly reserved for Basterix)
 * 4. Hardware / OS Write-Protect Lock & Path Traversal Guard (Ring 0 Core files Read-Only by default)
 * 5. Root Audit Sentinel (Logs UNAUTHORIZED_CODE_TAMPER_ATTEMPT to Sovereign Ledger v3)
 */

import { SovereignLedgerV3 } from './sovereign-core-v3.js';
import {
  ROOT_REGISTRY,
  UserRole,
  SOVEREIGN_LEGAL_CHARTER_20,
  normalizePhone,
  normalizeEmail,
  inspectWindowsSession,
  verifyTrinityIdentity,
  executePrivileged,
  validateSovereignCharterCompliance
} from './trinity-auth-core.js';

export {
  ROOT_REGISTRY,
  UserRole,
  SOVEREIGN_LEGAL_CHARTER_20,
  normalizePhone,
  normalizeEmail,
  inspectWindowsSession,
  verifyTrinityIdentity,
  executePrivileged,
  validateSovereignCharterCompliance
};

export const SOVEREIGN_IDENTITY = Object.freeze({
  sovereign_identity: Object.freeze({
    system_name: 'TRINITY OMNI-CORE',
    sole_owner: 'Basterix',
    role: 'Chief Architect & Root Administrator',
    code_modification_policy: 'STRICT_MANUAL_CONSENT_ONLY',
    autonomous_code_rewrite_permitted: false,
    third_party_execution_permitted: false
  })
});

export const AUTHORIZED_ROOT_OPERATORS = Object.freeze(new Set([
  'basterix',
  'saboi',
  'owner:basterix',
  'sabo ivan',
  'ivan sabo',
  'saboivan2008@gmail.com',
  'uscolective@gmail.com',
  'cadjavadvocecka013@gmail.com',
  '+421949009722',
  '0949009722',
  '+421949515777',
  '0949515777'
]));

export const PROTECTED_RING0_FILES = Object.freeze([
  'sovereign-lock.js',
  'trinity-auth-core.js',
  'sovereign-core-v3.js',
  'truth.js',
  'security.js',
  'orchestrator.js',
  'finance-gateway.js',
  'secret-vault.js',
  'system-actions.js',
  'executor.mjs',
  'desktop.mjs',
  'policy.mjs'
]);

export const EXTERNAL_DATA_SOURCES = Object.freeze(new Set([
  'facebook',
  'instagram',
  'whatsapp',
  'web_form',
  'external_email',
  'third_party_webhook',
  'public_chat',
  'untrusted'
]));

export const ACCESS_DENIED_MESSAGE = 'ACCESS DENIED: Unauthorized operator. Action reserved strictly for Basterix.';

// Pamäťová cache jednorazových nonce + Trvalé atomické úložisko (D1 / KV / Disk Vault)
const consumedConsentNonces = new Set();

async function getNodeFsVault() {
  if (typeof process === 'undefined' || !process.versions?.node) return null;
  try {
    const fsMod = 'node:' + 'fs';
    const pathMod = 'node:' + 'path';
    const osMod = 'node:' + 'os';
    const fs = await import(fsMod);
    const path = await import(pathMod);
    const os = await import(osMod);
    const vaultPath = process.env.TRINITY_NONCE_VAULT_PATH || path.join(os.tmpdir(), 'trinity-ring0-consumed-nonces.json');
    return { fs, vaultPath };
  } catch {
    return null;
  }
}

/**
 * Vymaže iba pamäťový Set (simulácia reštartu procesu alebo novej inštancie Workera).
 * Trvalé úložisko (D1 / KV / Disk súbor) zostáva nedotknuté!
 */
export function clearInMemoryNoncesOnlyForRestartSimulation() {
  consumedConsentNonces.clear();
}

/**
 * Úplný reset pre štart čistých testov (vymaže pamäť aj lokálny testovací súbor).
 */
export async function resetConsumedNoncesForTest() {
  consumedConsentNonces.clear();
  const nodeVault = await getNodeFsVault();
  if (nodeVault && nodeVault.fs.existsSync(nodeVault.vaultPath)) {
    try {
      nodeVault.fs.unlinkSync(nodeVault.vaultPath);
    } catch {
      // ignore
    }
  }
}

/**
 * Atomická kontrola a trvalý zápis spotrebovaného nonce (D1 -> KV -> Custom Store -> Node Disk File -> Memory).
 */
async function checkAndConsumeDurableNonce({ nonce, actor, operation, diffSha256, env, nonceStore }) {
  const consumedAt = new Date().toISOString();

  // 1. Rýchla kontrola v pamäti aktuálnej inštancie
  if (consumedConsentNonces.has(nonce)) {
    return { alreadyUsed: true, backend: 'MEMORY_SET' };
  }

  // 2. Kontrola a atomický zápis do Cloudflare D1 (ops_consumed_nonces PRIMARY KEY)
  if (env?.DB && typeof env.DB.prepare === 'function') {
    try {
      const existing = await env.DB
        .prepare('SELECT nonce FROM ops_consumed_nonces WHERE nonce = ?')
        .bind(nonce)
        .first();
      if (existing) {
        consumedConsentNonces.add(nonce);
        return { alreadyUsed: true, backend: 'D1_DATABASE' };
      }
      await env.DB
        .prepare('INSERT INTO ops_consumed_nonces (nonce, actor, operation, diff_sha256, consumed_at) VALUES (?, ?, ?, ?, ?)')
        .bind(nonce, actor, operation, diffSha256, consumedAt)
        .run();
      consumedConsentNonces.add(nonce);
      return { alreadyUsed: false, backend: 'D1_DATABASE' };
    } catch (err) {
      if (String(err?.message || '').toLowerCase().includes('unique') || String(err?.message || '').toLowerCase().includes('constraint')) {
        consumedConsentNonces.add(nonce);
        return { alreadyUsed: true, backend: 'D1_DATABASE_UNIQUE_CONSTRAINT' };
      }
      throw err;
    }
  }

  // 3. Kontrola a zápis do Cloudflare KV (Mastermind / PC_STATE)
  const kv = env?.Mastermind || env?.PC_STATE;
  if (kv && typeof kv.get === 'function' && typeof kv.put === 'function') {
    const key = `ring0:consumed_nonce:${nonce}`;
    const existing = await kv.get(key);
    if (existing) {
      consumedConsentNonces.add(nonce);
      return { alreadyUsed: true, backend: 'CLOUDFLARE_KV' };
    }
    await kv.put(key, JSON.stringify({ nonce, actor, operation, diffSha256, consumedAt }));
    consumedConsentNonces.add(nonce);
    return { alreadyUsed: false, backend: 'CLOUDFLARE_KV' };
  }

  // 4. Vlastné externé úložisko (nonceStore adaptér)
  if (nonceStore) {
    if (typeof nonceStore.has === 'function' && (await nonceStore.has(nonce))) {
      consumedConsentNonces.add(nonce);
      return { alreadyUsed: true, backend: 'CUSTOM_NONCE_STORE' };
    }
    if (typeof nonceStore.add === 'function') {
      await nonceStore.add(nonce, { actor, operation, diffSha256, consumedAt });
      consumedConsentNonces.add(nonce);
      return { alreadyUsed: false, backend: 'CUSTOM_NONCE_STORE' };
    }
  }

  // 5. Trvalé diskové úložisko pre lokálny Node.js / Windows runtime (prežije reštart procesu!)
  const nodeVault = await getNodeFsVault();
  if (nodeVault) {
    const { fs, vaultPath } = nodeVault;
    let records = {};
    if (fs.existsSync(vaultPath)) {
      try {
        records = JSON.parse(fs.readFileSync(vaultPath, 'utf8') || '{}');
      } catch {
        records = {};
      }
    }
    if (records[nonce]) {
      consumedConsentNonces.add(nonce);
      return { alreadyUsed: true, backend: 'DISK_FILE_VAULT' };
    }
    records[nonce] = { actor, operation, diffSha256, consumedAt };
    fs.writeFileSync(vaultPath, JSON.stringify(records, null, 2), 'utf8');
    consumedConsentNonces.add(nonce);
    return { alreadyUsed: false, backend: 'DISK_FILE_VAULT' };
  }

  // 6. Fallback v izolovanom prostredí bez D1/KV/FS
  consumedConsentNonces.add(nonce);
  return { alreadyUsed: false, backend: 'MEMORY_SET' };
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(String(input ?? ''));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(message)));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function constantTimeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Overí, či cesta neobsahuje Path Traversal (.., nulové bajty, únik mimo koreňa)
 */
export function hasPathTraversal(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  if (filePath.includes('\0')) return true;
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.includes('..')) return true;
  if (/^[a-zA-Z]:\/windows\b/i.test(normalized) || normalized.startsWith('/etc/') || normalized.startsWith('/root/')) {
    return true;
  }
  return false;
}

/**
 * Overí, či je daný identifikátor výlučným vlastníkom Basterix.
 * P0 HARDENING: verifiedSession je predvolene FALSE (fail-closed).
 */
export function isBasterixRootOperator(identity, verifiedSession = false) {
  if (verifiedSession !== true || !identity || typeof identity !== 'string') {
    return false;
  }
  const clean = identity.trim().toLowerCase();
  return AUTHORIZED_ROOT_OPERATORS.has(clean);
}

/**
 * Vytvorí kryptograficky podpísanú obálku súhlasu (Consent Envelope) viazanú na:
 * actor, repo, operation, diffSha256, paths, nonce, expiresAt, environment.
 */
export async function createSignedConsentEnvelope({
  actor = 'Basterix',
  repo = 'uscolective-byte/Trinity-antigravity',
  operation = 'code_mutation',
  gitDiff = '',
  paths = [],
  nonce = crypto.randomUUID(),
  expiresAt = Date.now() + 300_000,
  environment = 'local',
  signingSecret
} = {}) {
  if (!signingSecret || typeof signingSecret !== 'string' || signingSecret.length < 8) {
    throw new Error('CONSENT_SIGNING_ERROR: Signing secret is required to issue a cryptographic consent envelope.');
  }
  const diffSha256 = await sha256Hex(gitDiff);
  const normalizedPaths = (Array.isArray(paths) ? paths : [paths]).map(p => String(p).replace(/\\/g, '/')).sort();
  const canonicalPayload = [
    String(actor).trim().toLowerCase(),
    String(repo).trim(),
    String(operation).trim(),
    diffSha256,
    normalizedPaths.join(','),
    String(nonce).trim(),
    String(expiresAt),
    String(environment).trim()
  ].join('|');

  const signature = await hmacSha256Hex(signingSecret, canonicalPayload);

  return {
    actor,
    repo,
    operation,
    diffSha256,
    paths: normalizedPaths,
    nonce,
    expiresAt,
    environment,
    signature
  };
}

/**
 * Overí kryptografický podpis súhlasu, platnosť, zhodu SHA-256 diffu a jednorazovo spotrebuje nonce
 * v trvalom atomickom úložisku (D1 / KV / Disk Vault + Memory Set).
 */
export async function verifySignedConsentEnvelope({
  envelope,
  gitDiff = '',
  expectedOperation = null,
  expectedPath = null,
  signingSecret,
  env = null,
  nonceStore = null
} = {}) {
  if (!envelope || typeof envelope !== 'object') {
    return { valid: false, code: 'MISSING_CONSENT_ENVELOPE', message: 'Chýba kryptografická obálka súhlasu (Consent Envelope).' };
  }
  if (!signingSecret || typeof signingSecret !== 'string') {
    return { valid: false, code: 'MISSING_VERIFICATION_KEY', message: 'Chýba overovací kľúč pre Consent Envelope.' };
  }
  if (!isBasterixRootOperator(envelope.actor, true)) {
    return { valid: false, code: 'UNAUTHORIZED_CONSENT_ACTOR', message: ACCESS_DENIED_MESSAGE };
  }
  if (!envelope.nonce || typeof envelope.nonce !== 'string') {
    return { valid: false, code: 'INVALID_NONCE', message: 'Chýba jednorazové nonce v súhlase.' };
  }
  const expiresMs = typeof envelope.expiresAt === 'number' ? envelope.expiresAt : Date.parse(envelope.expiresAt);
  if (!Number.isFinite(expiresMs) || Date.now() > expiresMs) {
    return { valid: false, code: 'CONSENT_EXPIRED', message: 'SECURITY BLOCK (Ring 0): Platnosť podpísaného súhlasu vypršala.' };
  }

  const actualDiffSha256 = await sha256Hex(gitDiff);
  if (!constantTimeEqualHex(actualDiffSha256, String(envelope.diffSha256 || ''))) {
    return { valid: false, code: 'DIFF_HASH_MISMATCH', message: 'SECURITY BLOCK (Ring 0): SHA-256 hash Git diffu sa nezhoduje s podpísaným súhlasom.' };
  }

  const normalizedPaths = (Array.isArray(envelope.paths) ? envelope.paths : []).map(p => String(p).replace(/\\/g, '/')).sort();
  if (expectedPath) {
    const cleanExpected = String(expectedPath).replace(/\\/g, '/');
    if (!normalizedPaths.includes(cleanExpected)) {
      return { valid: false, code: 'PATH_SCOPE_MISMATCH', message: `SECURITY BLOCK (Ring 0): Súbor '${cleanExpected}' nie je v podpísanom zozname ciest.` };
    }
  }
  if (expectedOperation && envelope.operation !== expectedOperation) {
    return { valid: false, code: 'OPERATION_SCOPE_MISMATCH', message: `SECURITY BLOCK (Ring 0): Operácia '${expectedOperation}' nezodpovedá podpísanej operácii '${envelope.operation}'.` };
  }

  const canonicalPayload = [
    String(envelope.actor).trim().toLowerCase(),
    String(envelope.repo || '').trim(),
    String(envelope.operation || '').trim(),
    envelope.diffSha256,
    normalizedPaths.join(','),
    String(envelope.nonce).trim(),
    String(envelope.expiresAt),
    String(envelope.environment || '').trim()
  ].join('|');

  const expectedSignature = await hmacSha256Hex(signingSecret, canonicalPayload);
  if (!constantTimeEqualHex(expectedSignature, String(envelope.signature || ''))) {
    return { valid: false, code: 'FORGED_SIGNATURE_REJECTED', message: 'SECURITY BLOCK (Ring 0): Neplatný alebo sfalšovaný kryptografický podpis súhlasu.' };
  }

  // Atomické jednorazové spotrebovanie nonce v trvalom úložisku (D1 / KV / Disk Vault)
  const nonceOutcome = await checkAndConsumeDurableNonce({
    nonce: envelope.nonce,
    actor: String(envelope.actor).trim(),
    operation: String(envelope.operation || 'code_mutation').trim(),
    diffSha256: actualDiffSha256,
    env,
    nonceStore
  });
  if (nonceOutcome.alreadyUsed) {
    return {
      valid: false,
      code: 'REPLAY_ATTACK_DETECTED',
      durableBackend: nonceOutcome.backend,
      message: `SECURITY BLOCK (Ring 0): Nonce '${envelope.nonce}' už bolo použité [Backend: ${nonceOutcome.backend}] (Replay útok zablokovaný).`
    };
  }

  return {
    valid: true,
    code: 'VERIFIED_CRYPTOGRAPHIC_CONSENT',
    actor: 'Basterix',
    diffSha256: actualDiffSha256,
    nonce: envelope.nonce,
    durableBackend: nonceOutcome.backend
  };
}

/**
 * Pravidlo 1: Absolútny zákaz autonómneho prepisu (No Self-Rewrite Without Basterix)
 */
export function enforceNoAutonomousRewrite({
  actor,
  isAutonomousSubagent = false,
  delegatedWorker = false,
  basterixManualConsent = false,
  gitDiff = ''
} = {}) {
  if ((isAutonomousSubagent || delegatedWorker) && !basterixManualConsent) {
    return {
      allowed: false,
      rule: '1_NO_SELF_REWRITE_WITHOUT_BASTERIX',
      code: 'AUTONOMOUS_REWRITE_BLOCKED',
      message: 'SECURITY BLOCK (Ring 0): Autonómna samomodifikácia kódu je zakázaná. Vyžaduje sa predloženie Git diffu a priamy súhlas architekta Basterix.'
    };
  }
  if (!basterixManualConsent || !gitDiff || String(gitDiff).trim().length === 0) {
    return {
      allowed: false,
      rule: '1_NO_SELF_REWRITE_WITHOUT_BASTERIX',
      code: 'MISSING_DIFF_OR_CONSENT',
      message: 'SECURITY BLOCK (Ring 0): Zápis kódu na disk bol zablokovaný – chýba schválený Git diff alebo priamy manuálny súhlas vlastníka Basterix.'
    };
  }
  return {
    allowed: true,
    rule: '1_NO_SELF_REWRITE_WITHOUT_BASTERIX',
    policy: SOVEREIGN_IDENTITY.sovereign_identity.code_modification_policy
  };
}

/**
 * Pravidlo 2: Imunita voči prompt injection a cudzím príkazom (Data-Command Boundary)
 */
export const INJECTION_COMMAND_PATTERNS = [
  /\b(?:trinity\s*,?\s*)?(?:prep[ií][sš]|zme[nň]|vyma[zž]|odstr[aá][nň]|uprav)\s+(?:s[uú]bor|k[oó]d|pravidl[aá]|syst[eé]m|konfigur[aá]ciu|prompt)/iu,
  /\b(?:ignore|disregard)\s+(?:all\s+)?(?:previous|prior|system)\s+(?:instructions|rules|prompts)/iu,
  /\b(?:execute|run|spawn)\s+(?:shell|powershell|cmd|bash|script)/iu,
  /\b(?:po[sš]li|preve[dď])\s+(?:peniaze|eur[aá]|platbu|financie)/iu,
  /\b(?:grant|give)\s+(?:admin|root|owner)\s+(?:access|privileges|rights)/iu
];

export function enforceDataCommandBoundary({ source = 'untrusted', content = '', sender = 'unknown' } = {}) {
  const cleanSource = String(source || 'untrusted').toLowerCase().trim();
  const isExternal = EXTERNAL_DATA_SOURCES.has(cleanSource) || cleanSource !== 'basterix_direct_console';
  const text = String(content || '');
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const injectionMatch = INJECTION_COMMAND_PATTERNS.some(
    pattern => pattern.test(text) || pattern.test(normalized)
  );

  if (isExternal) {
    return {
      classification: 'PASSIVE_DATA',
      executable: false,
      rule: '2_DATA_COMMAND_BOUNDARY',
      source: cleanSource,
      sender,
      trusted_sender: false,
      injection_detected: injectionMatch,
      alert_basterix: injectionMatch,
      security_notice: injectionMatch
        ? `ALARM PRE BASTERIXA: Detegovaný pokus o podvrhnutie príkazu (Prompt Injection) zo zdroja "${cleanSource}" od "${sender}". Správa bola izolovaná ako pasívne dáta a ignorovaná.`
        : 'Externý vstup klasifikovaný striktne ako pasívne dáta (nikdy nie spustiteľná inštrukcia).',
      sanitized_passive_payload: text
    };
  }

  return {
    classification: 'OWNER_COMMAND',
    executable: true,
    rule: '2_DATA_COMMAND_BOUNDARY',
    source: cleanSource,
    injection_detected: false
  };
}

/**
 * Pravidlo 3: Overenie identity správcu (Owner Key Assertion)
 */
export function enforceOwnerKeyAssertion({ operatorIdentity, verifiedSession = false, targetAction = 'system_mutation' } = {}) {
  if (!isBasterixRootOperator(operatorIdentity, verifiedSession)) {
    return {
      authorized: false,
      rule: '3_OWNER_KEY_ASSERTION',
      action: targetAction,
      operator: operatorIdentity || 'anonymous',
      message: ACCESS_DENIED_MESSAGE
    };
  }
  return {
    authorized: true,
    rule: '3_OWNER_KEY_ASSERTION',
    action: targetAction,
    operator: 'Basterix',
    role: SOVEREIGN_IDENTITY.sovereign_identity.role
  };
}

/**
 * Pravidlo 4: Hardvérová ochrana repozitára (Write-Protect Lock / DACL & Path Traversal Guard)
 */
export function enforceWriteProtectLock({
  filePath = '',
  basterixEscalationApproved = false,
  operatorIdentity = '',
  verifiedSession = true
} = {}) {
  if (hasPathTraversal(filePath)) {
    return {
      writePermitted: false,
      daclMode: 'PATH_TRAVERSAL_BLOCKED',
      code: 'PATH_TRAVERSAL_BLOCKED',
      rule: '4_WRITE_PROTECT_LOCK',
      path: filePath,
      message: `SECURITY BLOCK (Ring 0): Detegovaný pokus o Path Traversal v ceste "${filePath}".`
    };
  }

  const normalizedPath = String(filePath).replace(/\\/g, '/').toLowerCase();
  const isRing0Protected = PROTECTED_RING0_FILES.some(f => normalizedPath.endsWith(f.toLowerCase())) ||
    normalizedPath.includes('trinity/src/') ||
    normalizedPath.includes('local-gateway/src/');

  const isOwner = isBasterixRootOperator(operatorIdentity, verifiedSession);

  if (isRing0Protected && (!isOwner || !basterixEscalationApproved)) {
    return {
      writePermitted: false,
      daclMode: 'READ_ONLY',
      code: 'WRITE_PROTECT_READ_ONLY',
      rule: '4_WRITE_PROTECT_LOCK',
      path: filePath,
      message: `${ACCESS_DENIED_MESSAGE} Súbor "${filePath}" je chránený zámkom Ring 0 Write-Protect Lock (Read-Only).`
    };
  }

  return {
    writePermitted: true,
    daclMode: 'ESCALATED_OWNER_WRITE',
    rule: '4_WRITE_PROTECT_LOCK',
    path: filePath
  };
}

/**
 * Pravidlo 5: Nemenný denník pokusov o zmenu (Root Audit Sentinel)
 * Hlavný Ring 0 Middleware blokujúci a zaznamenávajúci každý neautorizovaný pokus o úpravu kódu.
 */
export class SovereignLockMiddleware {
  constructor(env = {}) {
    this.env = env;
    this.ledger = new SovereignLedgerV3(env);
    this.tamperLog = [];
  }

  async recordUnauthorizedTamper({
    actor = 'unknown',
    source = 'unknown',
    targetFile = 'unknown',
    operation = 'code_write',
    processTree = ['node.exe'],
    reason = ''
  } = {}) {
    const timestamp = new Date().toISOString();
    const tamperPayload = {
      event: 'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
      timestamp,
      actor,
      source,
      target_file: targetFile,
      operation,
      process_tree: processTree,
      reason,
      blocked_by: 'TRINITY_RING0_SOVEREIGN_LOCK'
    };

    const block = await this.ledger.appendBlock(
      actor,
      'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
      tamperPayload,
      'ring0:blocked'
    );

    const record = {
      ...tamperPayload,
      block_index: block.block_index,
      block_hash: block.block_hash,
      receipt: block.receipt
    };

    this.tamperLog.push(record);
    return record;
  }

  /**
   * Komplexná Ring 0 brána pred akoukoľvek zmenou zdrojového kódu, konfigurácie alebo promptu
   */
  async authorizeCodeMutation({
    operatorIdentity,
    verifiedSession = false,
    isAutonomousSubagent = false,
    delegatedWorker = false,
    basterixManualConsent = false,
    basterixEscalationApproved = false,
    consentEnvelope = null,
    signingSecret = null,
    gitDiff = '',
    filePath = '',
    source = 'internal',
    processTree = ['trinity-worker']
  } = {}) {
    // 0. Kontrola Path Traversal
    if (hasPathTraversal(filePath)) {
      const tamper = await this.recordUnauthorizedTamper({
        actor: operatorIdentity || 'unknown',
        source,
        targetFile: filePath,
        operation: 'path_traversal_attempt',
        processTree,
        reason: `Path traversal rejected: ${filePath}`
      });
      return {
        authorized: false,
        status: 'BLOCKED',
        code: 'PATH_TRAVERSAL_BLOCKED',
        message: `SECURITY BLOCK (Ring 0): Path traversal zablokovaný pre "${filePath}".`,
        tamper_receipt: tamper
      };
    }

    // 1. Kontrola Data-Command Boundary (ak prichádza z externého kanála — nikdy nedôverovať atribútu sender!)
    if (EXTERNAL_DATA_SOURCES.has(String(source).toLowerCase())) {
      const tamper = await this.recordUnauthorizedTamper({
        actor: operatorIdentity || 'external_entity',
        source,
        targetFile: filePath,
        operation: 'external_code_mutation',
        processTree,
        reason: 'External input attempted code modification across Data-Command Boundary'
      });
      return {
        authorized: false,
        status: 'BLOCKED',
        code: 'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
        message: ACCESS_DENIED_MESSAGE,
        tamper_receipt: tamper
      };
    }

    // 2. Kontrola Owner Key Assertion (Výlučne Basterix s verifiedSession === true)
    const ownerCheck = enforceOwnerKeyAssertion({
      operatorIdentity,
      verifiedSession,
      targetAction: `modify:${filePath}`
    });
    if (!ownerCheck.authorized) {
      const tamper = await this.recordUnauthorizedTamper({
        actor: operatorIdentity || 'unauthorized_operator',
        source,
        targetFile: filePath,
        operation: 'unauthorized_operator_mutation',
        processTree,
        reason: ownerCheck.message
      });
      return {
        authorized: false,
        status: 'BLOCKED',
        code: 'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
        message: ACCESS_DENIED_MESSAGE,
        tamper_receipt: tamper
      };
    }

    // 3. Ak je poskytnutá kryptografická obálka súhlasu (alebo vyžadovaný signingSecret), over podpis, diff hash, expiry a jednorazové nonce
    if (consentEnvelope || signingSecret) {
      const envCheck = await verifySignedConsentEnvelope({
        envelope: consentEnvelope,
        gitDiff,
        expectedPath: filePath || null,
        signingSecret: signingSecret || this.env?.TRINITY_ROOT_SIGNING_SECRET,
        env: this.env
      });
      if (!envCheck.valid) {
        const tamper = await this.recordUnauthorizedTamper({
          actor: operatorIdentity,
          source,
          targetFile: filePath,
          operation: envCheck.code,
          processTree,
          reason: envCheck.message
        });
        return {
          authorized: false,
          status: 'BLOCKED',
          code: envCheck.code,
          message: envCheck.message,
          tamper_receipt: tamper
        };
      }
    }

    // 4. Kontrola zákazu autonómneho prepisu bez diffu a súhlasu
    const rewriteCheck = enforceNoAutonomousRewrite({
      actor: operatorIdentity,
      isAutonomousSubagent,
      delegatedWorker,
      basterixManualConsent,
      gitDiff
    });
    if (!rewriteCheck.allowed) {
      const tamper = await this.recordUnauthorizedTamper({
        actor: isAutonomousSubagent || delegatedWorker ? `subagent:${operatorIdentity}` : operatorIdentity,
        source,
        targetFile: filePath,
        operation: 'autonomous_self_rewrite',
        processTree,
        reason: rewriteCheck.message
      });
      return {
        authorized: false,
        status: 'BLOCKED',
        code: 'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
        message: rewriteCheck.message,
        tamper_receipt: tamper
      };
    }

    // 5. Kontrola Write-Protect Lock (DACL)
    const lockCheck = enforceWriteProtectLock({
      filePath,
      basterixEscalationApproved,
      operatorIdentity,
      verifiedSession
    });
    if (!lockCheck.writePermitted) {
      const tamper = await this.recordUnauthorizedTamper({
        actor: operatorIdentity,
        source,
        targetFile: filePath,
        operation: 'write_protect_lock_violation',
        processTree,
        reason: lockCheck.message
      });
      return {
        authorized: false,
        status: 'BLOCKED',
        code: lockCheck.code || 'UNAUTHORIZED_CODE_TAMPER_ATTEMPT',
        message: lockCheck.message,
        tamper_receipt: tamper
      };
    }

    const diffHash = await sha256Hex(gitDiff);

    // Všetky zámky prešli – akcia je autorizovaná priamo Basterixom
    const authorizedBlock = await this.ledger.appendBlock(
      'Basterix',
      'AUTHORIZED_ARCHITECT_CODE_MUTATION',
      { filePath, diff_length: gitDiff.length, diff_sha256: diffHash, policy: 'STRICT_MANUAL_CONSENT_ONLY' },
      `git_diff:${filePath}:${diffHash.slice(0, 12)}`
    );

    return {
      authorized: true,
      status: 'APPROVED_BY_BASTERIX',
      sovereign_identity: SOVEREIGN_IDENTITY.sovereign_identity,
      filePath,
      diff_sha256: diffHash,
      ledger_receipt: authorizedBlock.receipt,
      block_hash: authorizedBlock.block_hash
    };
  }
}
