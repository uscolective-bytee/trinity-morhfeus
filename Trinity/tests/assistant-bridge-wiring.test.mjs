import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createApiKeySchema} from '../src/api-keys.js';

test('Trinity can issue minimum-privilege assistant keys independent from MCP and admin',()=>{
  const common={name:'ChatGPT shared notes',rate_limit_per_minute:20,expires_at:null};
  for(const scope of ['assistant:read','assistant:write']){
    const result=createApiKeySchema.parse({...common,scopes:[scope]});
    assert.deepEqual(result.scopes,[scope]);
    assert.equal(result.scopes.includes('mcp:write'),false);
    assert.equal(result.scopes.includes('api:invoke'),false);
  }
  assert.equal(createApiKeySchema.safeParse({...common,scopes:['admin']}).success,false);
  assert.equal(createApiKeySchema.safeParse({...common,scopes:['assistant:write','assistant:write']}).success,false);
});

test('Assistant Bridge is gated before browser session authentication',()=>{
  const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  const gate=source.indexOf("if(path.startsWith('/api/assistant-bridge/'))");
  const session=source.indexOf("user=await authenticate(request,env)");
  assert.ok(gate>0&&gate<session,'Scoped key validation must bypass unrelated cookie login without bypassing key auth');
  assert.match(source,/TRINITY_ASSISTANT_BRIDGE_ENABLED!==['"]true['"]/);
  assert.match(source,/return handleAssistantBridge\(request,env\)/);
});

test('Shared notes bridge is not switched on before staging migrations/authorization',()=>{
  const wrangler=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  assert.equal(wrangler.env.staging.vars.TRINITY_ASSISTANT_BRIDGE_ENABLED,'false');
  assert.notEqual(wrangler.vars.TRINITY_ASSISTANT_BRIDGE_ENABLED,'true');
});
