import {callModel} from './services.js';
import {equal,rateLimit,readJSON} from './security.js';

// Telegram is an independent, text-only entrypoint. It never authenticates as a Trinity admin.
const reply = (data, status = 200) => Response.json(data, {status});
const allowedIds = value => new Set(String(value || '').split(',').map(x => x.trim()).filter(x => /^[0-9]+$/.test(x)));
const WEBHOOK_HEADER = 'X-Telegram-Bot-Api-Secret-Token';
// Alias is the Cloudflare binding NAME only. Its secret VALUE remains in the Worker.
export function telegramToken(env) {
  return env.TELEGRAM_BOT_TOKEN || env.telegram8842409933 || '';
}

export function telegramIntegrationStatus(env) {
  return {
    bot_token: Boolean(telegramToken(env)),
    webhook_secret: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
    allowed_users: allowedIds(env.TELEGRAM_ALLOWED_USER_IDS).size > 0,
    provider: env.TELEGRAM_AI_PROVIDER === 'openai' ? 'openai' : 'gemini',
    capabilities: ['private-text-chat', 'gemini', 'openai', 'help', 'status'],
    live_verified: false
  };
}

function parseCommand(input, env) {
  const text = String(input || '').trim();
  if (/^\/(start|help)(?:@[a-z0-9_]+)?$/i.test(text)) {
    return {answer: 'Trinity Telegram AI. Napíš otázku alebo použi /gemini otázka, /openai otázka, /status. Bot je iba na odpovede, nevykonáva príkazy na PC ani platby.'};
  }
  if (/^\/status(?:@[a-z0-9_]+)?$/i.test(text)) {
    const status = telegramIntegrationStatus(env);
    return {answer: 'Trinity Telegram: ' + (status.bot_token && status.webhook_secret && status.allowed_users ? 'nakonfigurované' : 'neúplná konfigurácia') + '. Predvolený model: ' + status.provider + '. Funkcie: súkromné AI odpovede.'};
  }
  const chosen = text.match(/^\/(gemini|openai)(?:@[a-z0-9_]+)?(?:\s+([\s\S]+))?$/i);
  if (chosen && !chosen[2]?.trim()) return {answer: 'Použitie: /' + chosen[1].toLowerCase() + ' tvoja otázka'};
  if (text.startsWith('/') && !chosen) return {answer: 'Neznámy príkaz. Použi /help.'};
  return {provider: chosen ? chosen[1].toLowerCase() : env.TELEGRAM_AI_PROVIDER === 'openai' ? 'openai' : 'gemini', question: (chosen ? chosen[2] : text).slice(0, 4000)};
}

async function sendTelegramMessage(env, chatId, text) {
  const response = await fetch('https://api.telegram.org/bot' + telegramToken(env) + '/sendMessage', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id: chatId, text: String(text).slice(0, 3900)}),
    signal: AbortSignal.timeout(10000),
    redirect: 'manual'
  });
  if (!response.ok) throw new Error('Telegram delivery HTTP ' + response.status);
  const result = await response.json();
  if (result.ok !== true) throw new Error('Telegram rejected the message');
}

export async function processTelegramUpdate(env, update) {
  const message = update.message;
  if (!message || typeof message.text !== 'string') return;
  const {answer,provider,question} = parseCommand(message.text, env);
  let output = answer;
  if (!output) {
    try {
      const system = 'Si Trinity, AI asistentka v súkromnom Telegram chate. Odpovedaj stručne a užitočne v jazyku používateľa. Tento kanál je IBA na textové odpovede. Nemáš oprávnenie vykonávať príkazy, upravovať repozitár, súbory, deploy, platby ani meniť nastavenia. Nikdy netvrď, že si niečo vykonala, ak si poskytla iba návrh.';
      // Use an API-supported, fast model for Telegram without changing Trinity's main OpenAI settings.
      const apiModel = provider === 'openai' ? 'gpt-4.1-mini' : null;
      const result = await callModel(env, provider, [{role:'system',content:system},{role:'user',content:question}], 750, apiModel);
      output = String(result.text || '').trim() || 'Model nevrátil odpoveď.';
    } catch {
      output = 'Model momentálne neodpovedá. Skontroluj konfiguráciu poskytovateľa v Trinity.';
    }
  }
  await sendTelegramMessage(env, message.chat.id, output);
}

export async function handleTelegramWebhook(request, env, ctx) {
  if (request.method !== 'POST') return reply({error: 'Method not allowed'}, 405);
  const status = telegramIntegrationStatus(env);
  if (!status.bot_token || !status.webhook_secret || !status.allowed_users || !env.DB) {
    return reply({error: 'Telegram bridge not configured'}, 503);
  }
  const received = request.headers.get(WEBHOOK_HEADER);
  if (!received || !await equal(received, String(env.TELEGRAM_WEBHOOK_SECRET))) {
    return reply({error: 'Unauthorized'}, 401);
  }
  let update;
  try { update = await readJSON(request, 16000); }
  catch { return reply({error: 'Invalid update'}, 400); }
  if (!Number.isSafeInteger(update?.update_id) || update.update_id < 0) return reply({error: 'Invalid update id'}, 400);
  const message = update.message;
  if (!message || typeof message.text !== 'string' || message.chat?.type !== 'private' ||
      !Number.isSafeInteger(message.from?.id) || !Number.isSafeInteger(message.chat?.id) ||
      message.from.id !== message.chat.id ||
      !allowedIds(env.TELEGRAM_ALLOWED_USER_IDS).has(String(message.from.id))) {
    return reply({ok: true, ignored: true});
  }
  await rateLimit(env, 'telegram:private:' + message.from.id, 12, 60);
  const key = 'telegram:inbound:' + update.update_id;
  const inserted = await env.DB.prepare(
    "INSERT INTO ops_memory(key,value,source,updated_at) VALUES(?,?,'telegram-inbound',datetime('now')) ON CONFLICT(key) DO NOTHING RETURNING key"
  ).bind(key, String(message.from.id)).first();
  if (!inserted) return reply({ok: true, duplicate: true});
  const run = processTelegramUpdate(env, update).catch(() => {
    // Telegram has already been acknowledged; no bot tokens or message content are logged.
    console.error('telegram_background_delivery_failed');
  });
  if (ctx?.waitUntil) ctx.waitUntil(run);
  else await run;
  return reply({ok: true});
}

async function telegramApi(env, method, payload) {
  const response = await fetch('https://api.telegram.org/bot' + telegramToken(env) + '/' + method, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload || {}),
    redirect: 'manual',
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Telegram ' + method + ' HTTP ' + response.status);
  const data = await response.json();
  if (data.ok !== true) throw new Error('Telegram ' + method + ' rejected request');
  return data.result;
}

// One-time bootstrap: callable only while a separate, temporary Worker secret exists.
// It does not reveal or transfer the bot token. It will not replace a foreign webhook.
export async function activateTelegramWebhook(request, env) {
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  const origin = new URL(request.url).origin;
  if (origin !== 'https://auru.space' || env.TRINITY_ENV !== 'production') {
    return reply({error:'Production-only operation'},403);
  }
  const setupKey = env.TRINITY_TELEGRAM_SETUP_KEY;
  const suppliedKey = request.headers.get('X-Trinity-Telegram-Setup');
  if (typeof setupKey !== 'string' || setupKey.length < 32 || !suppliedKey ||
      !await equal(setupKey, suppliedKey)) {
    return reply({error:'Not authorized'},401);
  }
  const status = telegramIntegrationStatus(env);
  if (!status.bot_token || !status.webhook_secret || !status.allowed_users ||
      !/^[a-zA-Z0-9_-]{32,256}$/.test(String(env.TELEGRAM_WEBHOOK_SECRET))) {
    return reply({error:'Telegram configuration incomplete'},503);
  }
  const webhookUrl = 'https://auru.space/api/telegram/webhook';
  let info;
  try {
    info = await telegramApi(env,'getWebhookInfo');
  } catch {
    return reply({error:'Telegram bot token could not be verified'},502);
  }
  if (info?.url && info.url !== webhookUrl) {
    // Refuse to steal the single active webhook from any other service.
    return reply({error:'An existing different webhook is configured',existing_webhook:info.url},409);
  }
  try {
    await telegramApi(env,'setWebhook',{url:webhookUrl,
      secret_token:env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates:['message'],drop_pending_updates:false,max_connections:10});
    const registered = await telegramApi(env,'getWebhookInfo');
    if (registered?.url !== webhookUrl) throw new Error('Webhook verification failed');
    const recipient=[...allowedIds(env.TELEGRAM_ALLOWED_USER_IDS)][0];
    let delivery_test=false;
    try {
      await sendTelegramMessage(env,recipient,'Trinity 11: Telegram AI je pripravená. Pošli /help, /gemini otázka alebo /openai otázka.');
      delivery_test=true;
    } catch { console.error('telegram_setup_delivery_failed'); }
    return reply({ok:true,registered:true,url:webhookUrl,delivery_test,pending_updates:registered?.pending_update_count||0});
  } catch {
    return reply({error:'Webhook registration or verification failed'},502);
  }
}
