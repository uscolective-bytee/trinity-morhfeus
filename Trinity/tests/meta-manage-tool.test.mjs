import test from 'node:test';
import assert from 'node:assert/strict';
import {TOOL_SCHEMAS,TOOL_HELP,runTool} from '../src/tools.js';

test('meta_manage: validuje schému vstupov', () => {
  const schema = TOOL_SCHEMAS.meta_manage;
  assert.ok(schema);

  // default action
  const parsedDefault = schema.parse({});
  assert.equal(parsedDefault.action, 'status');
  assert.equal(parsedDefault.model, 'llama-3.3-70b');
  assert.equal(parsedDefault.target_platform, 'all');

  // explicit actions
  assert.equal(schema.parse({ action: 'connect_url' }).action, 'connect_url');
  assert.equal(schema.parse({ action: 'pages' }).action, 'pages');
  assert.equal(schema.parse({ action: 'ai_generate', prompt: 'Napíš stratégiu' }).action, 'ai_generate');
  assert.equal(schema.parse({ action: 'create_post_draft', topic: 'Trinity AI', target_platform: 'instagram' }).action, 'create_post_draft');

  // reject unknown action
  assert.throws(() => schema.parse({ action: 'unknown_action' }));
});

test('meta_manage: action: status vracia stav pripojenia, AI flotilu a dôkazový receipt', async () => {
  const mockEnv = {
    TRINITY_OWNER_EMAIL: 'basterix@auru.space',
    TRINITY_ENV: 'production'
  };
  const agent = { id: 'orchestrator', tools: ['meta_manage'] };

  const res = await runTool(mockEnv, agent, 'meta_manage', { action: 'status' });
  assert.equal(res.action, 'status');
  assert.ok(res.meta_account);
  assert.ok(res.meta_ai);
  assert.equal(res.meta_ai.engine, 'Cloudflare Workers AI · Meta Llama Family');
  assert.ok(res.meta_ai.models.some(m => m.id.includes('llama-3.3-70b')));
  assert.ok(res.connect_url.includes('/connect/meta'));
  assert.equal(res._evidence?.action, 'meta_manage:status');
  assert.ok(res._evidence?.receipt_id);
});

test('meta_manage: action: connect_url vracia presnú linku a inštrukcie pre majiteľa', async () => {
  const mockEnv = {
    TRINITY_OWNER_EMAIL: 'basterix@auru.space'
  };
  const agent = { id: 'orchestrator', tools: ['meta_manage'] };
  const res = await runTool(mockEnv, agent, 'meta_manage', { action: 'connect_url' });
  assert.equal(res.action, 'connect_url');
  assert.equal(res.connect_url, 'https://auru.space/connect/meta');
  assert.ok(res.instructions.includes('/connect/meta'));
  assert.equal(res._evidence?.action, 'meta_manage:connect_url');
});

test('meta_manage: action: ai_generate volá Workers AI s modelom Llama 3.3', async () => {
  let aiCalledWith = null;
  const mockEnv = {
    TRINITY_OWNER_EMAIL: 'basterix@auru.space',
    AI: {
      run: async (model, input) => {
        aiCalledWith = { model, input };
        return { response: 'Meta AI Llama 3.3 úspešne vygenerovala odpoveď.' };
      }
    }
  };
  const agent = { id: 'orchestrator', tools: ['meta_manage'] };

  const res = await runTool(mockEnv, agent, 'meta_manage', { action: 'ai_generate', prompt: 'Otestuj uvažovanie' });
  assert.equal(res.action, 'ai_generate');
  assert.ok(aiCalledWith);
  assert.equal(aiCalledWith.model, '@cf/meta/llama-3.3-70b-instruct-fp8-fast');
  assert.equal(res.response, 'Meta AI Llama 3.3 úspešne vygenerovala odpoveď.');
  assert.equal(res._evidence?.action, 'meta_manage:ai_generate');
});

test('meta_manage: action: create_post_draft pripraví formátovaný draft s hashtagmi a cieľovými profilmi', async () => {
  const mockEnv = {
    TRINITY_OWNER_EMAIL: 'basterix@auru.space',
    AI: {
      run: async (model, input) => {
        return { response: '🚀 Trinity AI spája Meta AI a sociálny ekosystém.\n\n#trinity #meta #ai #sovereign' };
      }
    }
  };
  const agent = { id: 'orchestrator', tools: ['meta_manage'] };

  const res = await runTool(mockEnv, agent, 'meta_manage', {
    action: 'create_post_draft',
    topic: 'Trinity & Meta AI Spolupráca',
    target_platform: 'all'
  });

  assert.equal(res.action, 'create_post_draft');
  assert.equal(res.status, 'draft_ready');
  assert.equal(res.approval_required, true);
  assert.equal(res.target_profiles.facebook_page, 'underground Street collective');
  assert.equal(res.target_profiles.instagram_profile, 'old_dirty_bastard013');
  assert.ok(res.caption.includes('#trinity'));
  assert.equal(res._evidence?.action, 'meta_manage:create_post_draft');
});

test('meta_manage: je zdokumentovaný v TOOL_HELP', () => {
  assert.ok(TOOL_HELP.meta_manage);
  assert.ok(TOOL_HELP.meta_manage.includes('Llama'));
  assert.ok(TOOL_HELP.meta_manage.includes('Facebook'));
  assert.ok(TOOL_HELP.meta_manage.includes('Instagram'));
});
