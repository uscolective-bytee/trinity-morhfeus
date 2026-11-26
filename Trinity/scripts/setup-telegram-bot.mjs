import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const WEBHOOK_URL = 'https://auru.space/api/telegram/webhook';
const WEBHOOK_SECRET = 'trinity_tg_sec_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4';
const OWNER_CHAT_ID = '8358735041';

async function main() {
  console.log('🤖 Trinity 11.0 — Secure Telegram Bot Setup');
  console.log('---------------------------------------------');

  let token = process.argv[2]?.trim();
  const credPath = path.resolve(process.cwd(), '.credentials/telegram_token.txt');

  if (!token && fs.existsSync(credPath)) {
    token = fs.readFileSync(credPath, 'utf8').trim();
  }

  if (!token) {
    console.error('❌ Chýba Telegram Bot Token.');
    console.error('Použitie:');
    console.error('  1. Vytvor súbor: .credentials/telegram_token.txt s novým tokenom a spusti: node scripts/setup-telegram-bot.mjs');
    console.error('  2. Alebo priamo: node scripts/setup-telegram-bot.mjs <TVOJ_NOVY_TOKEN>');
    process.exit(1);
  }

  // 1. Verify token with Telegram API
  console.log('1. Overujem nový token s Telegram API (getMe)...');
  const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = await meRes.json();
  if (!me.ok) {
    console.error('❌ Telegram odmietol token:', me.description);
    process.exit(1);
  }
  console.log(`✅ Token je platný pre bota: ${me.result.first_name} (@${me.result.username})`);

  // 2. Upload secret to Cloudflare Worker
  console.log('2. Ukladám TELEGRAM_BOT_TOKEN do produkčných Cloudflare Secrets...');
  const proc = spawnSync('npx', ['wrangler', 'secret', 'put', 'TELEGRAM_BOT_TOKEN', '--env=""'], {
    input: token,
    encoding: 'utf8',
    shell: true
  });
  if (proc.status !== 0) {
    console.error('❌ Zlyhalo uloženie tajomstva do Wrangleru:', proc.stderr || proc.stdout);
    process.exit(1);
  }
  console.log('✅ Tajomstvo TELEGRAM_BOT_TOKEN úspešne nahraté do Cloudflare Worker "trinity".');

  // 3. Register Webhook
  console.log('3. Registrujem webhook na https://auru.space/api/telegram/webhook...');
  const whRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ['message'],
      drop_pending_updates: false
    })
  });
  const wh = await whRes.json();
  if (!wh.ok) {
    console.error('❌ Registrácia webhooku zlyhala:', wh.description);
    process.exit(1);
  }
  console.log('✅ Webhook úspešne nastavený s kryptografickým secret tokenom.');

  // 4. Send test message to owner
  console.log(`4. Posielam overovaciu správu majiteľovi (Chat ID: ${OWNER_CHAT_ID})...`);
  const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      text: `🤖 Trinity_Telegram je pripravený!\n\nAhoj Sabo, nový suverénny bot bol úspešne nakonfigurovaný v režime Truth Policy 2.0.\n\nOverovacie príkazy:\n/help\n/status\n/pc\n/crypto\n/fleet`
    })
  });
  const send = await sendRes.json();
  if (send.ok) {
    console.log(`✅ Správa doručená! (message_id: ${send.result.message_id})`);
  } else {
    console.warn('⚠️ Nepodarilo sa odoslať uvítaciu správu (možno bot ešte nebol spustený používateľom cez /start v Telegrame).');
  }

  // 5. Clean up local token file if present
  if (fs.existsSync(credPath)) {
    fs.unlinkSync(credPath);
    console.log('🧹 Lokálny súbor .credentials/telegram_token.txt bol bezpečne vymazaný.');
  }

  console.log('---------------------------------------------');
  console.log('🎉 Hotovo! Nový bot je 100 % funkčný a zabezpečený.');
}

main().catch(err => {
  console.error('Kritická chyba:', err);
  process.exit(1);
});
