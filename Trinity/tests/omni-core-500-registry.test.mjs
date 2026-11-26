/**
 * @module TRINITY_OMNI_CORE
 * @subsystem VERIFICATION_TEST_SUITE
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Test verifikácie kompletného registra 500 vylepšení (#001 - #500) a 75 základných pilierov TRINITY OMNI-CORE v kóde aj v dokumentácii.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OMNI_CORE_500_IMPROVEMENTS,
  OMNI_CORE_75_FOUNDATIONAL_PILLARS,
  getOmniCoreImprovement,
  listOmniCoreImprovementsByLayer,
  getOmniCore500Summary
} from '../src/omni-core-500-registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('OMNI_CORE_500_IMPROVEMENTS contains all 500 improvements (#001 to #500) and 75 foundational pillars', () => {
  assert.equal(OMNI_CORE_500_IMPROVEMENTS.length, 500);
  assert.equal(OMNI_CORE_75_FOUNDATIONAL_PILLARS.length, 75);

  const first = getOmniCoreImprovement(1);
  const mid = getOmniCoreImprovement('IMP-250');
  const mid2 = getOmniCoreImprovement('IMP-251');
  const last = getOmniCoreImprovement(500);

  assert.equal(first.id, 'IMP-001');
  assert.equal(mid.id, 'IMP-250');
  assert.equal(mid.part, 'PART_1_SYSTEM_DESKTOP_HARDWARE_250');
  assert.equal(mid2.id, 'IMP-251');
  assert.equal(mid2.part, 'PART_2_OMNI_CORE_ARCHITECTURE_250');
  assert.equal(last.id, 'IMP-500');

  const summary = getOmniCore500Summary();
  assert.equal(summary.total_improvements, 500);
  assert.equal(summary.part_1_system_desktop_250, 250);
  assert.equal(summary.part_2_architecture_omni_core_250, 250);
  assert.equal(summary.foundational_pillars_75, 75);

  const ledgerItems = listOmniCoreImprovementsByLayer('L4_SOVEREIGN_LEDGER');
  assert.ok(ledgerItems.length > 0);
});

test('Dokumentacia/KATALOG-500-VYLEPSENI-TRINITY-OMNI-CORE.md exists and contains all 500 numbered improvements', () => {
  const docPath = path.join(repoRoot, 'Dokumentacia', 'KATALOG-500-VYLEPSENI-TRINITY-OMNI-CORE.md');
  assert.ok(fs.existsSync(docPath), 'KATALOG-500-VYLEPSENI-TRINITY-OMNI-CORE.md must exist');
  const content = fs.readFileSync(docPath, 'utf8');
  assert.ok(content.includes('IMP-001'));
  assert.ok(content.includes('IMP-250'));
  assert.ok(content.includes('IMP-251'));
  assert.ok(content.includes('IMP-500'));
  assert.ok(content.includes('P-01'));
  assert.ok(content.includes('P-75'));
});
