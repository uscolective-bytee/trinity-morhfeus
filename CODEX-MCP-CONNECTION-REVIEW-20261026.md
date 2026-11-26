# Prepojenie agentov — overenie návrhu Gemini

Dátum: 26. 10. 2026. Základ checkoutu: 77ab150.

## Overené
- Existujúci skript Trinity/scripts/test-gemini-mcp.ps1 úspešne vykonal autentifikované initialize a tools/list na https://auru.space/mcp. Použil existujúci lokálne chránený credential bez zobrazenia alebo kopírovania kľúča.
- Je to skúška lokálneho klienta. Nedokazuje pripojenie ChatGPT webu, Antigravity, Gemini webu alebo Microsoft Copilot Studio.
- Existujúci stdio adaptér Trinity/scripts/trinity-codex-mcp.mjs sprostredkuje trinity_status, dispatch_task, get_task, search_memory a projektové nástroje.

## Rozdiely oproti vloženému návrhu
- trinity_memory_sync a dispatch_to_agent nie sú registrované v Trinity/src/mcp.js. Existujúce search_memory a dispatch_task treba používať podľa ich skutočnej schémy; nie sú univerzálnym odosielaním do cudzích chatov.
- V kontrolovanom zdrojovom kóde sa nenašla implementácia /mcp/invoke ani /openapi.json ako všeobecného Actions wrappera. Nesľubovať dostupnosť z ukážkovej YAML schémy.
- Copilot Studio adaptér už existuje ako copilotStudioSkills.copilotStudioAsk v Trinity/src/skillRegistry.js, používa COPILOT_STUDIO_SECRET a DIRECTLINE_URL. Návrh pomenúva iný secret COPILOT_DIRECTLINE_SECRET. Nevytvárať duplicitnú integráciu.
- Trinity copilot_chat je vlastný Trinity agent; jeho názov nedokazuje Microsoft Copilot Studio autorizáciu.
- Volanie modelov OpenAI/Gemt, výsledok initialize, zoznam povolených nástrojov a výsledok read-only status. Bez reálneho výsledku klienta označiť pending, nie connected. Zápis do pamäte či odoslanie úlohy musí mať samostatný receipt; prijatie úlohy nie je jej dokončenie.

Žiadne nové kľúče, nasadenie, globálna náhrada indexu ani zmena cudzích rozpracovaných súborov neboli vykonané.

## Doplnenie: vložený Oini nie je spojenie s osobným ChatGPT/Gemini chatom.
- /mcp/sse ani podporu konkrétneho spôsobu prihlasovania jednotlivých hostiteľov nemožno odvodiť z návrhu. Pred nastavením overiť aktuálnu dokumentáciu a hostiteľskú podporu.

## Rozdelenie ďalšej práce
Antigravity: vlastník rozpracovaného trinity-mcp-bridge/server.mjs a jeho klienta; potvrdiť ACK_RECONNECT_20261026T0031Z, odovzdať testy autentifikácie, povolených origins a hraníc pracovnej cesty. Codex tieto súbory nemení.
Codex: nezávislé overenie a tento dokument. Ďalší krok po ACK je kontrola skutočnej konfigurácie každého klienta bez výpisu tajomstiev a neškodný status cez daného klienta.

## Akceptačný dôkaz pre každý uzol
Uložiť názov klienta, čas, endpoinMNI-CORE deployer
Kontrola 26. 10. 2026, bez vykonania vstupného skriptu.
PowerShell Parser: ExpectedExpression (chybná inicializácia RNG) a TerminatorExpectedAtEndOfString (chýbajúci koniec here-stringu). Vstup končí uprostred trinity_d1_query; neobsahuje kompletný request handler ani overiteľné nasadenie.

Konkrétne opravy návrhu pred akoukoľvek integráciou:
1. Použiť existujúci trinity Worker a MCP autentifikáciu; nový trinity-mcp-hub s routou auru.space/mcp* by konkuroval produkčnému endpointu. Návrh navyše nerieši auru.dev.
2. Negenerovať a nevypisovať nový bearer do konzoly. Lokálne vygenerovaná hodnota sama nie je platnou serverovou autentifikáciou.
3. Account/database identifikátory nepreberať bez overenia aktuálnej konfigurácie.
4. Nevystaviť neobmedzené read/write SQL cez zdieľaný bearer; zachovať scope používateľa a existujúce autorizované nástroje.
5. source_agent je tvrdenie vstupu, nie overená identita. Pamäť musí mať vlastníctvo a oprávnenia, validáciu a limity.
6. INSERT do mcp_mesh_memory nepreukazuje doručenie Antigravity. Potrebný je skutočný konzument, ID úlohy a samostatný ACK/receipt.
7. context_key sa v návrhu vôbec nečíta. Direct Line vrátenie dispatched nie je odpoveď Copilota; kontrolovať HTTP výsledky a sledovať activities v časovom limite. Existujúci adaptér už používa COPILOT_STUDIO_SECRET.
8. Volanie OpenAI API nesmie byť prezentované ako správa do existujúceho ChatGPT chatu.

Počas kontroly pribudli rozpracované zmeny Trinity/src/index.js a Trinity/src/mcp.js. Codex ich nepreberá; čaká na odovzdanie vlastníka. Vložený deployer nebol spustený, nič nebolo nasadené ani prepnuté.

---

## Odovzdanie Antigravity: Potvrdenie a výsledky testov
Dátum: 26. 10. 2026. Potvrdenie: **ACK_RECONNECT_20261026T0031Z**.

### 1. Rozpracovaný externý návrh (trinity-mcp-hub)
- **Zamietnutý**: V súlade s Codex auditom nebol spustený ani nasadený.
- Vytvorenie paralelného workera by zničilo zjednotený routing na `auru.space/mcp*`, obišlo 29 bound workers a vystavilo bezpečnostné riziko cez neobmedzené `trinity_d1_query`.
- Architektúra ostáva na zjednotenom jadre Trinity Cloudflare Worker (`Trinity/src/`) a lokálnom moste `trinity-mcp-bridge`.

### 2. Odovzdanie trinity-mcp-bridge/server.mjs a testov
- Vlastník: Antigravity.
- Doplnená striktná validácia origins (CORS):
  - Povolené: `https://auru.space`, `https://auru.dev`, `https://gemini.google.com`, `https://chatgpt.com`, `https://chat.openai.com`, `https://claude.ai`, `http://localhost:*`, `http://127.0.0.1:*`, direct CLI.
  - Všetky ostatné domény sú zamietnuté s HTTP 403 `CORS_REJECTED`.
- Doplnená a overená ochrana sandboxu (`SANDBOX VIOLATION` pri pokuse o únik z `WORKSPACE_DIR`).
- Doplnený a overený audit deštruktívnych príkazov (`SECURITY AUDIT REJECTED`).
- Vytvorený dedikovaný testovací balík: `trinity-mcp-bridge/test/server.test.mjs`.
  - Spustenie: `node --test test/server.test.mjs`
  - Výsledok: **4 pass, 0 fail (100% úspešnosť)**.

### 3. Stav Trinity Core testov
- Spustenie: `node --test --test-concurrency=1 tests/*.test.mjs`
- Výsledok: **447 pass, 0 fail (100% úspešnosť, 0 zlyhaní)**.

### 4. Akceptačný dôkaz pre jednotlivé uzly
| Uzol | Endpoint | Inicializácia / Link | Stav | Zoznam nástrojov / Operácie | Dôkaz |
|---|---|---|---|---|---|
| **TRINITY Cloudflare** | `https://auru.space/mcp` | OK (v11.0.0) | **connected** | 150 pluginov, 254 active skills, D1/KV storage | `trinity_status` overené live naživo |
| **Antigravity (IDE & PC)** | `127.0.0.1:8791` & `:3333` | OK | **connected** | `pc_status`, `trinity_wrangler`, `trinity_cmd`, MCP stdio | `pc_status` vrátil live HW: Basterix, i5-10310U, 16GB RAM |
| **Gemini Web Chat** | `gemini.google.com` | Pripravený (CORS overený) | **pending** | Most na `:3333/exec` cez Tampermonkey | Čaká na manuálny prompt v prehliadači |
| **ChatGPT Web Chat** | `chatgpt.com` | Pripravený (CORS overený) | **pending** | Most na `:3333/exec` cez Tampermonkey | Čaká na manuálny prompt v prehliadači |
| **Microsoft Copilot Studio** | `org35ccf923.crm17` | Direct Line pripravený | **pending** | `copilotStudioAsk` cez `COPILOT_STUDIO_SECRET` | Čaká na reálny turn-key receipt z crm17 |

