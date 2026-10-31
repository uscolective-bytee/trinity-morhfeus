import test from 'node:test';
import assert from 'node:assert/strict';
import {handleTelegramWebhook,telegramIntegrationStatus,activateTelegramWebhook} from '../src/telegram-bridge.js';

function setup() {
  const sent = [];
  const seen = new Set();
  const requests = [];
  let activeWebhook='';
  const env = {
    TELEGRAM_BOT_TOKEN:'test-telegram-token',
    TELEGRAM_WEBHOOK_SECRET:'a_long_test_secret_12345',
    TELEGRAM_ALLOWED_USER_IDS:'12345',
    TELEGRAM_AI_PROVIDER:'openai',
    OPENAI_API_KEY:'test-openai-api-key',
    OPENAI_MODEL:'gpt-4o',
    DB:{
      prepare(sql) {
        return {
          bind(...args) { this.args=args; return this; },
          async first() {
            if (sql.includes('ops_limits')) return {count:1};
            const key=this.args[0];
            if (seen.has(key)) return null;
            seen.add(key);
            return {key};
          }
        };
      }
    }
  };
  const message = (text='/help', id=12345, chatType='private') =>
    ({update_id:100, message:{text,from:{id},chat:{id,type:chatType}}});
  const createRequest = (body, token=env.TELEGRAM_WEBHOOK_SECRET) =>
    new Request('https://auru.dev/api/telegram/webhook',{method:'POST',
      headers:{'Content-Type':'application/json','X-Telegram-Bot-Api-Secret-Token':token},
      body:JSON.stringify(body)});
  const context = () => {
    const pending=[];
    return {ctx:{waitUntil:p=>pending.push(p)},done:async()=>Promise.all(pending)};
  };
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async (url, options)=>{
    requests.push({url:String(url),body:options?.body});
    if (String(url).includes('api.telegram.org')) {
      const body=JSON.parse(options.body);
      if (String(url).endsWith('/getWebhookInfo')) return Response.json({ok:true,result:{url:activeWebhook}});
      if (String(url).endsWith('/setWebhook')) { activeWebhook=body.url; return Response.json({ok:true,result:true}); }
      sent.push(body);
      return Response.json({ok:true,result:{message_id:1}});
    }
    if (String(url).includes('api.openai.com')) {
      return Response.json({model:'gpt-4o',choices:[{message:{content:'Odpoveď z OpenAI'}}],usage:{}});
    }
    throw new Error('Unexpected external request');
  };
  return {env,sent,requests,message,createRequest,context,setExistingWebhook:url=>{activeWebhook=url;},restore:()=>{globalThis.fetch=oldFetch;}};
}

test('Telegram bridge fails closed when webhook is unconfigured',async()=>{
  const t=setup();
  try {
    const res=await handleTelegramWebhook(t.createRequest(t.message()),{...t.env,TELEGRAM_WEBHOOK_SECRET:''});
    assert.equal(res.status,503);
  } finally {t.restore();}
});

test('Telegram invalid signature is rejected before database access',async()=>{
  const t=setup();
  try {
    const res=await handleTelegramWebhook(t.createRequest(t.message(),'wrong-secret'),t.env);
    assert.equal(res.status,401);
    assert.equal(t.sent.length,0);
  } finally {t.restore();}
});

test('Telegram only processes allowlisted private accounts',async()=>{
  const t=setup();
  try {
    const {ctx,done}=t.context();
    assert.equal((await handleTelegramWebhook(t.createRequest(t.message('/help',56789)),t.env,ctx)).status,200);
    assert.equal((await handleTelegramWebhook(t.createRequest(t.message('/help',12345,'group')),t.env,ctx)).status,200);
    await done();
    assert.equal(t.sent.length,0);
  } finally {t.restore();}
});

test('Telegram answers private /help and rejects duplicate updates',async()=>{
  const t=setup();
  try {
    const first=t.context();
    const res=await handleTelegramWebhook(t.createRequest(t.message()),t.env,first.ctx);
    assert.equal(res.status,200);
    await first.done();
    assert.equal(t.sent.length,1);
    assert.match(t.sent[0].text,/Trinity Telegram AI/);
    const second=t.context();
    const again=await handleTelegramWebhook(t.createRequest(t.message()),t.env,second.ctx);
    assert.equal((await again.json()).duplicate,true);
    await second.done();
    assert.equal(t.sent.length,1);
  } finally {t.restore();}
});

test('Telegram uses own OpenAI API credentials and responds without exposing token',async()=>{
  const t=setup();
  try {
    const update=t.message('/openai Vysvetli čo je Trinity');
    const work=t.context();
    const res=await handleTelegramWebhook(t.createRequest(update),t.env,work.ctx);
    assert.equal(res.status,200);
    await work.done();
    assert.equal(t.sent.length,1);
    assert.equal(t.sent[0].text,'Odpoveď z OpenAI');
    assert.equal(t.requests.filter(x=>x.url.includes('api.openai.com')).length,1);
    assert.equal(JSON.parse(t.requests.find(x=>x.url.includes('api.openai.com')).body).model,'gpt-4.1-mini');
    assert.ok(!t.sent[0].text.includes(t.env.TELEGRAM_BOT_TOKEN));
  } finally {t.restore();}
});

test('Telegram status describes settings without revealing secrets',()=>{
  const t=setup();
  try {
    const status=telegramIntegrationStatus(t.env);
    assert.equal(status.allowed_users,true);
    assert.equal(status.provider,'openai');
    assert.equal(JSON.stringify(status).includes(t.env.TELEGRAM_BOT_TOKEN),false);
  } finally {t.restore();}
});

test('Telegram reads an existing custom Cloudflare secret binding without copying the value',async()=>{
  const t=setup();
  try {
    delete t.env.TELEGRAM_BOT_TOKEN;
    t.env.telegram8842409933='test-alias-secret-value';
    const status=telegramIntegrationStatus(t.env);
    assert.equal(status.bot_token,true);
    assert.equal(JSON.stringify(status).includes(t.env.telegram8842409933),false);
    const work=t.context();
    const response=await handleTelegramWebhook(t.createRequest(t.message('/help')),t.env,work.ctx);
    assert.equal(response.status,200);
    await work.done();
    assert.equal(t.sent.length,1);
    assert.ok(t.requests.some(item=>item.url.endsWith('/bottest-alias-secret-value/sendMessage')));
  } finally {t.restore();}
});

test('Telegram setup endpoint is closed without a temporary secret',async()=>{
  const t=setup();
  try {
    const req=new Request('https://auru.space/api/telegram/setup',{method:'POST'});
    const r=await activateTelegramWebhook(req,{...t.env,TRINITY_ENV:'production'});
    assert.equal(r.status,401);
    assert.equal(t.requests.length,0);
  } finally {t.restore();}
});

test('Telegram setup refuses to overwrite a foreign existing webhook',async()=>{
  const t=setup();
  try {
    t.setExistingWebhook('https://another-service.example.org/telegram');
    const setupKey='a-test-bootstrap-key-with-more-than-32-chars';
    const req=new Request('https://auru.space/api/telegram/setup',{method:'POST',headers:{'X-Trinity-Telegram-Setup':setupKey}});
    const r=await activateTelegramWebhook(req,{...t.env,TRINITY_ENV:'production',TRINITY_TELEGRAM_SETUP_KEY:setupKey,TELEGRAM_WEBHOOK_SECRET:'webhook_secret_Aaaa1234567890123456789012'});
    assert.equal(r.status,409);
    assert.equal(t.requests.filter(item=>item.url.endsWith('/setWebhook')).length,0);
  } finally {t.restore();}
});

test('Telegram setup registers and verifies webhook only with the temporary secret',async()=>{
  const t=setup();
  try {
    const setupKey='a-test-bootstrap-key-with-more-than-32-chars';
    const req=new Request('https://auru.space/api/telegram/setup',{method:'POST',headers:{'X-Trinity-Telegram-Setup':setupKey}});
    const secret='webhook_secret_Aaaa1234567890123456789012';
    const r=await activateTelegramWebhook(req,{...t.env,TRINITY_ENV:'production',TRINITY_TELEGRAM_SETUP_KEY:setupKey,TELEGRAM_WEBHOOK_SECRET:secret});
    assert.equal(r.status,200);
    const activated=await r.json();
    assert.equal(activated.registered,true);
    assert.equal(activated.delivery_test,true);
    assert.equal(t.sent.length,1);
    assert.equal(t.sent[0].chat_id,'12345');
    assert.equal(t.requests.filter(item=>item.url.endsWith('/setWebhook')).length,1);
    const options=JSON.parse(t.requests.find(item=>item.url.endsWith('/setWebhook')).body);
    assert.equal(options.url,'https://auru.space/api/telegram/webhook');
    assert.equal(options.secret_token,secret);
    assert.deepEqual(options.allowed_updates,['message']);
  } finally {t.restore();}
});
