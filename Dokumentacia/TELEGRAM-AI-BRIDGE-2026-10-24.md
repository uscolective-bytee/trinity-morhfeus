# Trinity 11.0 — Telegram Sovereign Bridge (28. 10. 2026)

## Aktuálny Stav & Schopnosti (Truth Policy 2.0 Hardcore)

Plne implementované a otestované v monorepe (`Trinity/src/telegram-bridge.js`, 13/13 testov PASS):
- `POST /api/telegram/webhook` — prijíma overené textové správy cez webhook s podpisom `X-Telegram-Bot-Api-Secret-Token`.
- `GET /api/telegram/status` — bezpečný stav konfigurácie pre monitoring (bez úniku tajomstiev).
- `POST /api/telegram/setup` — jednorazový bezpečný bootstrap s kľúčom `TRINITY_TELEGRAM_SETUP_KEY` a ochranou pred prepísaním iného webhooku.

### Podporované Príkazy
- `/start` a `/help` — Kompletný prehľad príkazov a možností asistenta.
- `/status` — Živý stav Trinity 11.0 ekosystému, databáz (D1, KV, R2), prepojenia na lokálne PC a predvoleného AI poskytovateľa.
- `/pc` — Priamy stav pripojenia lokálneho PC (Sabo Ivan / Windows) cez PC Bridge daemon (Port 8791 / 3333).
- `/crypto` a `/ttk` — Živé trhové ceny (BTC, ETH, SOL) z Jericho Engine a stav Tetrakis ($TTK) ERC-20 tokenu / Treasury.
- `/fleet` a `/workers` — Detailný prehľad 35 Cloudflare Workerov flotily (10× AURA, 8× Core, 8× RPC, 6× Rozšírené).
- `/research <téma>` — Hĺbkový výskum zadanej témy cez dedikovaný `RESEARCHER_SERVICE` (Llama 3.3 70B & Google Search) alebo Gemini.
- `/gemini <otázka>` — Priamy dopyt na model Gemini.
- `/openai <otázka>` — Priamy dopyt na model OpenAI (`gpt-4.1-mini`).
- `/groq <otázka>` — Priamy dopyt na model Groq Llama 3.3.
- Priamy text bez lomky — Konverzácia s Trinity AI asistentkou v slovenskom jazyku.

### Bezpečnosť a Izolácia
- Žiadne vykonávanie deštruktívnych shell príkazov, repozitárových zmien ani platieb z Telegramu.
- Strict Allowlist: Prijíma iba súkromné 1:1 správy od používateľov uvedených v tajomstve `TELEGRAM_ALLOWED_USER_IDS` alebo v autorizovanej D1 pamäti `ops_memory`.
- D1 Rate Limit: 12 správ za 60 sekúnd na používateľa.
- Deduplikácia správ: `update_id` je deduplikovaný cez D1 `ops_memory` (zamedzenie opakovanému spracovaniu pri re-try z Telegramu).
- Zero Secret Leakage: Žiadne tokeny, kľúče ani citlivé identitné údaje sa nevypisujú do správ, logov ani chatu.

## Cloudflare Secrets

Produkčný Cloudflare Worker `trinity` má nastavené tieto tajomstvá:
- `TELEGRAM_BOT_TOKEN` (alebo `TELEGRAM_BOT_TOKEN`) — bot token z @BotFather.
- `TELEGRAM_WEBHOOK_SECRET` — náhodná 32+ znaková hodnota overovaná na každom prichádzajúcom webhooku.
- `TELEGRAM_ALLOWED_USER_IDS` — numerické Telegram ID majiteľa (Sabo Ivan).

## Overenie a Testy

- Všetkých 13 testov `tests/telegram-bridge.test.mjs` prechádza (100 % úspešnosť).
- Integrované v monorepo CI teste `npm run check` (598 / 598 testov prešlo).
