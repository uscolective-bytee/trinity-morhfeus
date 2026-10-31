# Trinity 11 — Telegram + Gemini + OpenAI bridge (24. 10. 2026)

## Stav

Implementované v pracovnej vetve (nie nasadené):
- `POST /api/telegram/webhook` — prijíma textové Telegram správy
- `/help`, `/start`, `/status`, `/gemini otázka`, `/openai otázka`
- odpovede cez existujúce `callModel` v Trinity; neprepája súkromný ChatGPT účet
- podpis webhooku, allowlist konkrétnych Telegram user IDs, iba súkromný 1:1 chat
- D1 rate limit 12 správ za 60 sekúnd a deduplikácia `update_id` cez `ops_memory`
- žiadne vykonávanie administratívnych nástrojov, shell príkazov, platieb ani deployov z Telegramu
- asynchrónna odpoveď cez `ctx.waitUntil`; nie je garantované doručenie pri neočakávanom páde Workeru

## Bezpečnostné upozornenie

V staršom verejne viditeľnom zdrojovom kóde bol natvrdo vložený Telegram bot token. Tento token sa MUSÍ zneplatniť cez @BotFather a nahradiť novým, aj keď bol odstránený zo súčasného zdrojového súboru. Odstránenie kódu z Gitu nevymaže históriu. Token nikdy nevkladať do commitov, dokumentácie, issue ani chatu.

Staršie nastavenie Telegram monitoringu v aplikácii ukladá konfiguračný objekt do D1. Pre nové nasadenie použiť iba Cloudflare Secrets a prehodnotiť prípadné staršie uložené tokeny.

## Cloudflare Secrets — nastaviť zvlášť pre development a production

V adresári `Trinity/` použite príkazy uvedené nižšie; Wrangler si hodnotu bezpečne vyžiada. Nezadávať hodnoty priamo do argumentov príkazu.

```powershell
cd C:\Users\saboi\Trinity-antigravity\Trinity
wrangler secret put TELEGRAM_BOT_TOKEN --env development
wrangler secret put TELEGRAM_WEBHOOK_SECRET --env development
wrangler secret put TELEGRAM_ALLOWED_USER_IDS --env development
wrangler secret put GEMINI_API_KEY --env development
wrangler secret put OPENAI_API_KEY --env development
```

- `TELEGRAM_BOT_TOKEN`: nový token z @BotFather. Produkčný Cloudflare Worker `trinity` už obsahuje tajomstvo pod vlastným názvom **`telegram8842409933`**. Telegram AI bridge aj odosielanie notifikácií rozpoznáva tento alias bez kopírovania alebo zobrazenia hodnoty tokenu. Nie je preto potrebné vkladať nový token ešte raz.
- `TELEGRAM_WEBHOOK_SECRET`: samostatná náhodná hodnota (A-Z, a-z, 0-9, _ alebo -, minimálne 32 znakov)
- `TELEGRAM_ALLOWED_USER_IDS`: Telegram numerické ID majiteľa, voliteľne zoznam oddelený čiarkami. Nie názov bota ani telefón.
- `TELEGRAM_AI_PROVIDER`: voliteľná NETAJNÁ premenná `gemini` (predvolená) alebo `openai`. Bezpečne ju možno nastaviť vo Wrangler `vars` danej environment sekcii.
- `GEMINI_API_KEY`: vlastný API kľúč Google AI Studio, ak ešte nie je v prostredí
- `OPENAI_API_KEY`: vlastný OpenAI Platform API kľúč, ak ešte nie je v prostredí

Pre produkciu nahradiť `--env development` za `--env=""` podľa Wrangler konfigurácie projektu. Najprv nasadiť a overiť dev. Nepreberať automaticky produkčné kľúče do vývoja.

## Registrácia webhooku

Po bezpečnom uložení a nasadení Workeru sa nastaví webhook cez oficiálny Telegram `setWebhook` s:
- URL: `https://auru.dev/api/telegram/webhook` (development)
- `secret_token`: presná hodnota `TELEGRAM_WEBHOOK_SECRET`
- `allowed_updates`: `["message"]`
- `drop_pending_updates`: `false` (nezahadzovať správy bez rozhodnutia)

POZOR: jeden Telegram bot token môže mať iba jeden aktívny webhook. Pre development a production použiť **dvoch oddelených botov/tokenov**, alebo vedome presunúť webhook pri prepínaní prostredí.

Kontrola: `getWebhookInfo` a súkromná správa `/help` z allowlistovaného ID, následne `/gemini ahoj` a `/openai ahoj`. Za úspech považovať až reálne prijatie a odpoveď v Telegrame, vrátane potvrdeného doručenia a modelovej odpovede.

## Plán rozšírenia

V ďalšej etape previesť asynchrónne správy na Cloudflare Queue s opakovaním doručenia a zaviesť časovo ohraničenú per-chat pamäť. Použiť oddelenú identitu Telegramu a explicitne autorizované nástroje, nie admin kľúč Trinity.

## One-time production registration (security)

The owner has supplied their private Telegram account numeric ID separately; store it only as the Worker secret `TELEGRAM_ALLOWED_USER_IDS`, never as a commit, log or public env var.

The production Worker may already have bot-token secret `telegram8842409933`. The integration reads it as an explicit alias; no token extraction or duplicate secret is needed.

Before registration, store two separate Worker secrets:
- `TELEGRAM_WEBHOOK_SECRET` — randomly generated 32+ safe characters, supplied to Telegram's `setWebhook`, validated on every inbound request.
- `TRINITY_TELEGRAM_SETUP_KEY` — independently generated temporary 32+ character bearer value, used only once to call `POST https://auru.space/api/telegram/setup` using request header `X-Trinity-Telegram-Setup`.

The setup route requires HTTPS on `auru.space`, `TRINITY_ENV=production`, a matching temporary key, valid webhook secret and allowlist. It first checks `getWebhookInfo` and **refuses to replace any existing webhook at a different URL**. It registers `allowed_updates=["message"]` and does not drop pending messages; it verifies registration with another `getWebhookInfo` call.

After successful registration, immediately delete `TRINITY_TELEGRAM_SETUP_KEY` from the Worker and verify that the setup route returns HTTP 401. No secret values should be logged or printed. If the existing webhook belongs to a different service, do not override it automatically.

A new production deployment should happen only after tests and latest-main integration checks succeed. Live Telegram delivery and AI model responses are separate checks from tests and webhook registration.
