import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getSelfAwarenessDirective} from '../src/skill-matrix.js';

test('Trinity runtime is instructed to use Secrets Store without leaking secrets',()=>{
  const prompt=getSelfAwarenessDirective(['web_fetch']);
  assert.match(prompt,/Cloudflare Secrets Store/);
  assert.match(prompt,/await env\.BINDING\.get\(\)/);
  assert.match(prompt,/scope workers/);
  assert.match(prompt,/staging/);
  assert.match(prompt,/binding configured a provider verified/);
  assert.doesNotMatch(prompt,/Máš plné oprávnenie/);
  assert.doesNotMatch(prompt,/Pripojený lokálny hostiteľ/);
  assert.match(prompt,/web_fetch/);
});

test('Antigravity skill is tracked and linked from root agent instructions',()=>{
  const root=readFileSync(new URL('../../AGENTS.md',import.meta.url),'utf8');
  const skill=readFileSync(new URL('../../.agents/skills/cloudflare-secrets-store/SKILL.md',import.meta.url),'utf8');
  assert.match(root,/cloudflare-secrets-store\/SKILL\.md/);
  assert.match(skill,/name: cloudflare-secrets-store/);
  assert.match(skill,/secrets-store-doctor\.mjs/);
  assert.match(skill,/--env staging/);
  assert.doesNotMatch(skill,/^npx wrangler deploy --env development/m);
});
