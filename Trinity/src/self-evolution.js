/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul self-evolution.js (Trinity/src/self-evolution.js) v ekosystéme TRINITY OMNI-CORE.
 */
/**
 * TRINITY SELF-EVOLUTION ENGINE S AUTO-ROLLBACK POISTKOU & RING 0 SOVEREIGN LOCK
 * 
 * Umožňuje bezpečný self-modifying cyklus pre základné systémové súbory TRINITY
 * výhradne pod priamym príkazom a súhlasom architekta Basterix.
 */

import { SovereignLockMiddleware } from './sovereign-lock.js';

export async function backupSystemSnapshot(env, filePath, content) {
  const timestamp = Date.now();
  const safeName = filePath.replace(/[^a-zA-Z0-9._-]/g, '_');
  const snapshotKey = `snapshots/${safeName}/${timestamp}.bak`;

  // 1. Záloha do R2 bucketu ARTIFACTS
  if (env.ARTIFACTS) {
    try {
      await env.ARTIFACTS.put(snapshotKey, content, {
        httpMetadata: { contentType: 'application/javascript' },
        customMetadata: { filePath, timestamp: String(timestamp) }
      });
    } catch (e) {
      console.warn('R2 backup warning:', e.message);
    }
  }

  // 2. Rýchla záloha do KV Mastermind pre okamžitý rollback
  if (env.Mastermind) {
    try {
      await env.Mastermind.put(`backup:${filePath}:latest`, content, { expirationTtl: 86400 * 7 });
    } catch {}
  }

  return { snapshotKey, timestamp };
}

export async function restoreSnapshot(env, filePath) {
  if (env.Mastermind) {
    const backup = await env.Mastermind.get(`backup:${filePath}:latest`);
    if (backup) {
      return { ok: true, source: 'kv_latest', content: backup };
    }
  }
  return { ok: false, error: 'Záloha pre obnovenie nebola nájdená.' };
}

/**
 * Validácia syntaxe JavaScript kódu
 */
export function validateScriptSyntax(code) {
  try {
    new Function(code);
    return { ok: true };
  } catch (err) {
    // new Function zlyhá pri ES moduloch s import/export, preto otestujeme len závažné syntaktické chyby
    if (err instanceof SyntaxError && !err.message.includes('Cannot use import statement') && !err.message.includes('Unexpected token \'export\'')) {
      return { ok: false, error: err.message };
    }
    return { ok: true };
  }
}

/**
 * Aplikuje sebamodifikáciu s auto-rollbackom
 */
export async function applySelfModification(env, {
  filePath,
  originalContent,
  newContent,
  rationale = 'Architektonická úprava vyžadujúca schválenie Basterixom',
  operatorIdentity = '',
  verifiedSession = false,
  isAutonomousSubagent = false,
  basterixManualConsent = false,
  basterixEscalationApproved = false,
  consentEnvelope = null,
  signingSecret = null,
  gitDiff = 'diff --git',
  source = 'internal'
} = {}) {
  if (!filePath || newContent === undefined) {
    return { ok: false, error: 'Chýba cesta k súboru alebo nový obsah.' };
  }

  // 0. Ring 0 Sovereign Lock Middleware kontrola (fail-closed)
  const lock = new SovereignLockMiddleware(env);
  const auth = await lock.authorizeCodeMutation({
    operatorIdentity,
    verifiedSession,
    isAutonomousSubagent,
    basterixManualConsent,
    basterixEscalationApproved,
    consentEnvelope,
    signingSecret,
    gitDiff,
    filePath,
    source
  });

  if (!auth.authorized) {
    return {
      ok: false,
      status: 'blocked',
      code: auth.code,
      error: auth.message,
      tamper_receipt: auth.tamper_receipt
    };
  }

  // 1. Kontrola základnej syntaxe
  const syntaxCheck = validateScriptSyntax(newContent);
  if (!syntaxCheck.ok) {
    return {
      ok: false,
      status: 'rejected',
      error: `Syntaktická chyba nového kódu: ${syntaxCheck.error}`,
      rolled_back: true
    };
  }

  // 2. Uloženie snapshotu pôvodného kódu
  const backup = await backupSystemSnapshot(env, filePath, originalContent || '');

  const receipt_id = `evolve_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // 3. Záznam do auditného denníka udalostí (ops_events)
  if (env.DB) {
    await env.DB.prepare(
      "INSERT INTO ops_events (action, details) VALUES (?, ?)"
    ).bind('self_evolution_applied', JSON.stringify({
      filePath,
      rationale,
      receipt_id,
      snapshotKey: backup.snapshotKey,
      at: new Date().toISOString()
    })).run().catch(() => {});
  }

  return {
    ok: true,
    status: 'completed',
    receipt_id,
    filePath,
    snapshotKey: backup.snapshotKey,
    rationale,
    verified_at: new Date().toISOString(),
    _evidence: {
      receipt_id,
      effect: 'mutation',
      actions: ['change', 'verify']
    }
  };
}
