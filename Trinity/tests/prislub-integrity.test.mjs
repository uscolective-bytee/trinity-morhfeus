import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRUTH_POLICY, findUnsupportedActionClaims, assertNoSimulatedData, safeTruthResponse } from '../src/truth.js';
import { TRINITY_LOYALTY_OATH } from '../src/cognition.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

test('PRISLUB_TRINITY.txt exists in root and contains the inviolable oath and truth policy', () => {
  const prislubPath = path.join(repoRoot, 'PRISLUB_TRINITY.txt');
  assert.ok(fs.existsSync(prislubPath), 'PRISLUB_TRINITY.txt must exist in repo root');
  const content = fs.readFileSync(prislubPath, 'utf8');
  assert.ok(content.includes('ZÁVÄZNÁ PRÍSAHA VERNOSTI'));
  assert.ok(content.includes('Basterix'));
  assert.ok(content.includes('PRÍSAHA ABSOLÚTNEJ PRAVDY'));
  assert.ok(content.includes('ZÁKAZ KLAMANIA A SIMULÁCIÍ'));
  assert.ok(content.includes('Nemám overený systémový dôkaz'));
});

test('NEPORUSITELNY-REZIM-PRAVDY-A-PRISAHA.md exists in Dokumentacia', () => {
  const docPath = path.join(repoRoot, 'Dokumentacia', 'NEPORUSITELNY-REZIM-PRAVDY-A-PRISAHA.md');
  assert.ok(fs.existsSync(docPath), 'Documentation file must exist');
  const content = fs.readFileSync(docPath, 'utf8');
  assert.ok(content.includes('Neporušiteľný Režim Pravdy a Prísaha Trinity'));
  assert.ok(content.includes('findUnsupportedActionClaims'));
  assert.ok(content.includes('Full-Time Read & Write'));
});

test('Truth policy strictly forbids simulation, lying, and unsupported claims', () => {
  assert.ok(TRUTH_POLICY.includes('ZÁKAZ KLAMAŤ'));
  assert.ok(TRUTH_POLICY.includes('ZÁKAZ SIMULÁCIÍ'));
  assert.ok(TRINITY_LOYALTY_OATH.includes('PRÍSAHA PRAVDY'));

  // Simulated data marker must throw
  assert.throws(() => assertNoSimulatedData({ status: 'mock' }), /Režimu pravdy/);
  assert.throws(() => assertNoSimulatedData({ simulated: true }), /Režimu pravdy/);

  // Unsupported claim must be caught
  const unsupported = findUnsupportedActionClaims('Nasadila som nový worker a vymazala som databázu.', []);
  assert.ok(unsupported.includes('deploy'));
  assert.ok(unsupported.includes('delete'));

  // Safe response is returned
  const safeResp = safeTruthResponse('sk');
  assert.ok(safeResp.includes('Nemám overený systémový dôkaz'));
});
