import test from 'node:test';
import assert from 'node:assert/strict';
import {universalEcosystem, UNIVERSAL_DOMAINS, APPLICATION_TEMPLATES} from '../src/universal-ecosystem.js';
import {skillRegistry} from '../src/skillRegistry.js';
import {copilotPluginRegistry} from '../src/copilot-plugins.js';
import {TrinityCopilotAgent} from '../src/copilot-agent.js';

test('Universal Ecosystem: UNIVERSAL_DOMAINS a APPLICATION_TEMPLATES sú správne definované', () => {
  assert.ok(UNIVERSAL_DOMAINS.length >= 15);
  for (const domain of UNIVERSAL_DOMAINS) {
    assert.ok(domain.id);
    assert.ok(domain.name);
    assert.ok(domain.icon);
    assert.ok(domain.description);
  }

  assert.ok(APPLICATION_TEMPLATES.length >= 10);
  for (const template of APPLICATION_TEMPLATES) {
    assert.ok(template.templateId);
    assert.ok(template.name);
    assert.ok(template.domain);
  }
});

test('Universal Ecosystem: synthesizeSkill dynamicky vytvorí a zaregistruje nový skill', async () => {
  const meta = universalEcosystem.synthesizeSkill('QuantumValidator', 'cybersecurity', async (input) => {
    return { validated: true, input, quantumSafe: true };
  });

  assert.equal(meta.name, 'QuantumValidator');
  assert.equal(meta.domain, 'cybersecurity');
  assert.ok(skillRegistry.has(meta.id));

  // Overenie vykonania skillu
  const result = await skillRegistry.execute(meta.id, { key: 'sample-payload' });
  assert.equal(result.validated, true);
  assert.equal(result.quantumSafe, true);
});

test('Universal Ecosystem: synthesizePlugin dynamicky vytvorí plugin so sadou skillov', () => {
  const plugin = universalEcosystem.synthesizePlugin('DevOpsMasterPack', 'cloud-devops', ['deployKube', 'monitorPods']);

  assert.equal(plugin.name, 'DevOpsMasterPack');
  assert.equal(plugin.domain, 'cloud-devops');
  assert.ok(copilotPluginRegistry.get(plugin.id));
  assert.ok(plugin.skills.length >= 2);
  assert.ok(copilotPluginRegistry.isSkillEnabled(plugin.skills[0]));
});

test('Universal Ecosystem: synthesizeApp vytvorí a uloží definíciu novej aplikácie', () => {
  const app = universalEcosystem.synthesizeApp('BioGenomeVisualizer', 'biotech-health', {
    type: 'web-app',
    prompt: 'Interaktívny 3D prehliadač genómových sekvencií a mutácií'
  });

  assert.equal(app.name, 'BioGenomeVisualizer');
  assert.equal(app.domain, 'biotech-health');
  assert.equal(app.status, 'ready');
});

test('Universal Ecosystem: searchCatalog umožňuje rýchle hľadanie naprieč ekosystémom', () => {
  const searchApps = universalEcosystem.searchCatalog('Dashboard', { type: 'app' });
  assert.ok(searchApps.apps.length > 0);

  const searchCyber = universalEcosystem.searchCatalog('', { domain: 'cybersecurity' });
  assert.ok(searchCyber.total > 0);
});

test('Universal Ecosystem: getStats vracia komplexné štatistiky a kapacitu', () => {
  const stats = universalEcosystem.getStats();
  assert.ok(stats.domains_count >= 15);
  assert.ok(stats.active_apps >= 10);
  assert.ok(stats.active_plugins >= 7);
  assert.ok(stats.active_skills >= 20);
  assert.ok(stats.infinite_scale_capacity > 1000000);
  assert.equal(stats.status, 'operational');
});

test('Universal Ecosystem: TrinityCopilotAgent dokáže priamo spustiť syntetizovaný skill', async () => {
  universalEcosystem.synthesizeSkill('EchoAssistant', 'ai-agents', async (query) => {
    return `Echo: ${query.toUpperCase()}`;
  });

  const response = await TrinityCopilotAgent('Ahoj Trinity, otestuj echo', {}, {
    skill: 'skill_echoassistant',
    enableFallback: false
  });

  assert.ok(response.content.includes('Echo: AHOJ TRINITY, OTESTUJ ECHO'));
});
