import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAT_ENGINE_VALUES,normalizeChatEngine,selectChatProvider} from '../src/chat-routing.js';
test('ordinary conversation uses fast inference',()=>assert.equal(selectChatProvider('auto','Ahoj, ako sa máš?'),'fast'));
test('repair and PC tasks stay with the cloud planner',()=>{for(const message of ['Oprav chybu v aplikácii','Spusti program na mojom PC'])assert.equal(selectChatProvider('auto',message),'workers-ai');});
test('explicit engines remain explicit',()=>{assert.equal(selectChatProvider('local','Ahoj'),'local');assert.equal(selectChatProvider('gemini','Ahoj'),'gemini');assert.equal(selectChatProvider('cloud','Ahoj'),'workers-ai');});
test('chat engines have one canonical normalized allowlist',()=>{assert.equal(normalizeChatEngine(' GEMINI '),'gemini');assert.equal(new Set(CHAT_ENGINE_VALUES).size,CHAT_ENGINE_VALUES.length);for(const unsupported of ['edge','copilot','codex'])assert.equal(CHAT_ENGINE_VALUES.includes(unsupported),false);});
test('assistant engine switch exposes only canonical backend values',()=>{const html=readFileSync(new URL('../public/assistant/chat.html',import.meta.url),'utf8');const select=html.match(/<select id="engine"[\s\S]*?<\/select>/)?.[0]||'';const values=[...select.matchAll(/<option value="([^"]+)"/g)].map(match=>match[1]);assert.ok(values.length>0);assert.equal(new Set(values).size,values.length);assert.deepEqual(values.filter(value=>!CHAT_ENGINE_VALUES.includes(value)),[]);});
