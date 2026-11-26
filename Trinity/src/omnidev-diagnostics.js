/**
 * @module TRINITY_OMNI_CORE
 * @subsystem OMNIDEV_DIAGNOSTICS_AND_RECOVERY
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Deterministický analyzátor stack-trace chýb, AST/JSX párovač a generátor diff návrhov pre OmniDev Studio.
 */
/**
 * OMNIDEV STUDIO DIAGNOSTICS & SELF-HEALING MODULE (Pillar 5 / P1)
 * Analyzuje stack trace chyby v OmniDev Studio, izoluje padajúce závislosti
 * a generuje opravný patch, ktorý vyžaduje Ring 0 autorizáciu vlastníka Basterix.
 */

import { SovereignLockMiddleware } from './sovereign-lock.js';

export function diagnoseOmniDevStackTrace(rawStack = '', context = {}) {
  const stack = String(rawStack || '');
  const lines = stack.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const errorHeader = lines[0] || 'Unknown OmniDev Error';

  const frameMatch = stack.match(/(?:at\s+.*?\(?|@)((?:[a-zA-Z]:\\|\/|file:\/\/|[A-Za-z0-9_.-]+\.[A-Za-z0-9]+)[^\s:)]*):(\d+):(\d+)/);
  const missingModuleMatch = stack.match(/Cannot find (?:module|package) ['"]([^'"]+)['"]/i) ||
    stack.match(/Error:\s*Missing dependency ['"]([^'"]+)['"]/i);
  const isUnclosedTag = /Expected corresponding JSX closing tag|unclosed tag|closing tag/i.test(stack);
  const isSyntaxError = /SyntaxError/i.test(stack);

  const category = isUnclosedTag
    ? 'UNCLOSED_TAG_OR_JSX'
    : missingModuleMatch
      ? 'MISSING_DEPENDENCY'
      : isSyntaxError
        ? 'SYNTAX_ERROR'
        : 'RUNTIME_ERROR';

  return {
    module: 'OmniDev Studio',
    diagnosed: true,
    category,
    error_summary: errorHeader,
    failing_file: frameMatch ? frameMatch[1] : (context.filePath || null),
    failing_line: frameMatch ? Number(frameMatch[2]) : null,
    failing_column: frameMatch ? Number(frameMatch[3]) : null,
    isolated_dependency: missingModuleMatch ? missingModuleMatch[1] : null,
    remediation_type: missingModuleMatch ? 'INSTALL_OR_ISOLATE_DEPENDENCY' : 'SOURCE_PATCH_REQUIRED',
    raw_stack_preserved: stack,
    diagnosed_at: new Date().toISOString()
  };
}

export async function proposeOmniDevRecoveryPatch({
  env = {},
  stackTrace = '',
  errorText = '',
  proposedGitDiff = '',
  filePath = '',
  targetFile = 'Trinity/src/omnidev-studio.js',
  sourceCode = '',
  operatorIdentity = '',
  verifiedSession = false,
  basterixManualConsent = false,
  basterixEscalationApproved = false,
  consentEnvelope = null,
  signingSecret = null
} = {}) {
  const effectiveStack = stackTrace || errorText;
  const effectiveTarget = filePath || targetFile;
  const diagnosis = diagnoseOmniDevStackTrace(effectiveStack, { filePath: effectiveTarget });
  const gitDiff = proposedGitDiff || (sourceCode
    ? `--- a/${effectiveTarget}\n+++ b/${effectiveTarget}\n@@ -1 +1 @@\n-${sourceCode}\n+${sourceCode.replace(/<\/span>;/, '</span></div>;')}`
    : `--- a/${effectiveTarget}\n+++ b/${effectiveTarget}\n@@ -1 +1 @@\n+// OmniDev Recovery Patch`);

  const lock = new SovereignLockMiddleware(env);

  const authResult = await lock.authorizeCodeMutation({
    operatorIdentity,
    verifiedSession,
    isAutonomousSubagent: false,
    basterixManualConsent,
    basterixEscalationApproved,
    consentEnvelope,
    signingSecret,
    gitDiff,
    filePath: effectiveTarget,
    source: 'internal',
    processTree: ['omnidev-recovery-engine']
  });

  if (!authResult.authorized) {
    return {
      applied: false,
      status: 'AWAITING_BASTERIX_APPROVAL',
      diagnosis,
      gitDiff,
      security_gate: authResult
    };
  }

  return {
    applied: true,
    status: 'RECOVERY_PATCH_AUTHORIZED',
    diagnosis,
    gitDiff,
    security_gate: authResult
  };
}
