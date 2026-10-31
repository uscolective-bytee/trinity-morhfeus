import {test} from 'node:test';
import assert from 'node:assert/strict';
import {productivityPlusSkills, skills} from '../src/skillRegistry.js';
import {copilotPluginRegistry} from '../src/copilot-plugins.js';

test('productivity-plus: skills are registered', () => {
  for (const name of ['slugify', 'readingTime', 'extractiveSummary', 'dateDiff', 'cronNextRuns']) {
    assert.equal(typeof productivityPlusSkills[name], 'function', name);
    assert.equal(typeof skills[name], 'function', `${name} in skills`);
  }
  const plugin = copilotPluginRegistry.list().find((p) => p.id === 'productivity-plus');
  assert.ok(plugin);
});

test('slugify removes diacritics', () => {
  const r = productivityPlusSkills.slugify({text: 'Čau Svet!'});
  assert.equal(r.slug, 'cau-svet');
  assert.equal(productivityPlusSkills.slugify({text: ' '}).success, false);
});

test('readingTime and extractiveSummary return success', async () => {
  const text = 'Trinity je asistent. Trinity pomaha s kodom a testami. Dnes nasadzujeme novu verziu Trinity. Pocasie je pekne.';
  const rt = await productivityPlusSkills.readingTime({text});
  assert.equal(rt.success, true);
  const sm = await productivityPlusSkills.extractiveSummary({text, sentences: 2});
  assert.equal(sm.success, true);
});

test('cronNextRuns gives runs for */15', async () => {
  const r = await productivityPlusSkills.cronNextRuns({expression: '*/15 * * * *', from: '2026-01-01T10:00:00Z', count: 3});
  assert.equal(r.success, true);
  assert.equal(r.next_runs.length, 3);
  const bad = await productivityPlusSkills.cronNextRuns({expression: 'x'});
  assert.equal(bad.success, false);
});

test('dateDiff computes days', async () => {
  const r = await productivityPlusSkills.dateDiff({from: '2026-01-01', to: '2026-01-11'});
  assert.equal(r.success, true);
  assert.equal(r.days, 10);
});

