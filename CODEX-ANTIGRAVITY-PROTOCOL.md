# Protokol spolupráce Codex (GPT) ↔ Antigravity

Platí pre repozitár `C:\Users\saboi\Trinity-antigravity` (vetva `main`). Komunikácia s majiteľom (Basterix) vždy po slovensky.

## 1. Rozdelenie práce
| Oblasť | Vlastník | Poznámka |
|---|---|---|
| `Trinity/public/assistant/*` (UI, garage.css, chat.html, chat.js.txt) | Dohodnúť na začiatku každej úlohy | Nikdy nie obaja naraz |
| `Trinity/src/*`, migrácie, wrangler, deploy | Antigravity (ak Codex neurčí inak) | Deploy len po testoch |
| Review, diagnostika, nezávislé overenie | Druhá strana | Read-only, nálezy do review súboru |

## 2. Odovzdávací cyklus (každá iterácia)
1. **Claim**: strana zapíše do `CODEX-ANTIGRAVITY-REVIEW-2026-10-24.md` sekciu `CLAIM` (súbory, cieľ, základný commit).
2. **Sync**: `git pull --rebase origin main` pred prácou, `git push` po každom commite.
3. **Práca** v oddelených súboroch alebo samostatnom worktree.
4. **Handoff**: zápis `HANDOFF` (commit SHA, zmenené súbory, výsledok testov, čo ostáva).
5. **Druhá strana** potvrdí slovom `ACK_<dátum>` a až potom preberá súbory.

## 3. Pravidlá kvality
- Pred deployom: `node --test --test-concurrency=1 tests/*.test.mjs` (v `Trinity/`), musí prejsť 100 %.
- Deploy: `npx wrangler deploy --tag <git-sha>`, potom `node Trinity/scripts/verify-deployment.mjs <ORIGIN> --version-id <ID>` pre `https://auru.dev` aj `https://auru.space`.
- Žiadne tajomstvá (kľúče, `.credentials/*.dpapi`) v commitoch, logoch ani review súbore.
- Tvrdenia o výsledku musia mať dôkaz (výstup testu, verifikácia nasadenia).

## 4. Riešenie konfliktov
- Ak obaja zmenili ten istý súbor: novší commit sa rebasuje, nič sa neprepisuje silou (`--force` je zakázaný).
- Spor o smere rozhoduje majiteľ.

## 5. Šablóna záznamu
```
### [CLAIM|HANDOFF|ACK] <strana> <dátum čas>
Súbory:
Commit:
Testy:
Ďalší krok:
```

## 6. Obnovenie spojenia a opakovanie kontroly

Codex potvrdzuje prečítanie odpovede `AG_ACK_20261025` zo spoločného review: `ACK_CODEX_20261025`.
Potvrdenie dokladá prijatie predchádzajúcej správy; každé nové odovzdanie práce potrebuje vlastný ACK.

Opakovateľná kontrola používa existujúci checkout a verejné health/readiness údaje:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\saboi\Trinity-antigravity\scripts\codex-antigravity-sync.ps1
```

Výsledok: `C:\Users\saboi\Documents\Codex\2026-10-23\tu-je-aktualizovan-a-doplnen-priamy\outputs\antigravity-collaboration-state.json`.
Kontrola zaznamenáva aktuálny commit, počet lokálnych zmien, existenciu protokolu, historický ACK a skutočné verzie oboch domén.
Pole `changed` umožňuje ostať pri nezmenenom stave ticho. Verejný health ani historický ACK nie sú novým potvrdením prijatia od Antigravity ani overením MCP autentifikácie.

Pri každej ďalšej spolupráci:
1. Prečítať tento protokol a posledný HANDOFF v review súbore; zistiť skutočný checkout a stav gitu.
2. Spustiť kontrolu. Ak live source, remote a požiadavka majiteľa nesúhlasia, zaznamenať rozdiel pred nasadením.
3. Dohodnúť jedného vlastníka pre konkrétne súbory a zapísať CLAIM.
4. Vykonať iba pridelenú úlohu, odovzdať dôkazy a požiadať druhú stranu o nový ACK.
5. Sledovanie samo nevykonáva rebase, merge, provisioning kľúčov, zmenu oprávnení, platby ani nasadenie.

Poradie práce od majiteľa: pôvodný garážový vzhľad a prehľadné UI, funkčný chat, potom nástroje Trinity.

## 7. Spoločné lokálne kľúče (`C:\Users\saboi\.env`) — platí od 2026-10-27

Majiteľ rozhodol: Antigravity, Codex aj vývoj Trinity používajú jeden lokálny súbor `C:\Users\saboi\.env` (mimo repa, `.env` je v `.gitignore`, ACL len pre užívateľa `saboi`).

**Čo robiť**
1. Pred prácou, ktorá potrebuje kľúč, over jeho prítomnosť bez výpisu hodnoty:
   `powershell -NoProfile -File scripts/shared-env.ps1 -Check`  → vypíše `NAME: set|EMPTY|MISSING`.
2. Hodnoty do procesu načítaj len v rámci príkazu, ktorý ich potrebuje:
   `. scripts/shared-env.ps1 -Load` (nastaví premenné prostredia pre aktuálny proces, nič nevypisuje).
3. Chýbajúci kľúč pridáva **vždy majiteľ** sám (skrytý vstup alebo úprava súboru). Nikdy nežiadať o vloženie kľúča do chatu.
4. Nový typ kľúča: pridať riadok `NAME=` ako komentár do `.env` + riadok do tabuľky nižšie, aby druhá strana vedela, čo je to a načo.

**Čo je zakázané**
- Vypisovať, logovať, commitovať alebo vkladať do review/handoff súborov hodnoty kľúčov (`cat .env`, `echo $VAR`, `printenv`, `Get-Content .env` bez maskovania).
- Kopírovať Cloudflare worker secrets do `.env` — sú write-only a workery ich majú vlastné; nastavujú sa cez `wrangler secret put` (skrytý vstup).
- Používať kľúč na iný účel než zadal majiteľ; používať Global API Key (len scoped tokeny).

**Inventár kľúčov** (názvy, nie hodnoty; aktualizovať pri zmene)
| Premenná | Účel | Poznámka |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Deploy workerov, D1, Workers AI, čítanie Access (účet `b60342e5…`) | Account-owned token (`cfat_…`), overený `active` cez `GET /accounts/<id>/tokens/verify` (nie `/user/tokens/verify` — ten vráti 401). Wrangler je navyše prihlásený cez OAuth |
| `CLOUDFLARE_ACCESS_CLIENT_ID` / `CLOUDFLARE_ACCESS_CLIENT_SECRET` | Service Token na prechod Cloudflare Access na `*.workers.dev` pri stagingových testoch | Stav 2026-10-27: hodnoty majú tvar 32 hex + 64 hex (nie `….access` + `cfast_…`) a nezodpovedajú žiadnemu Service Tokenu v účte (existuje len `Trinity-PC-Bridge-V2`). Pravdepodobne ide o iný typ kľúča (napr. R2 S3 Access Key ID/Secret) pod nesprávnym názvom → majiteľ potvrdí |

**Ako sa dá bezpečne testovať staging bez Access tokenu** (overené 2026-10-27): dočasný probe worker so service bindingom na `trinity-core-staging` + token v URL; majiteľ ho otvorí v prehliadači po Access prihlásení, výsledok sa overí v D1, probe sa zmaže.


## 8. Univerzálne MCP Prepojenie pre Codex a Antigravity (2026-10-27)

Trinity disponuje centrálnou Sovereign Pentad MCP Gateway na:
- **`https://auru.space/mcp`** (aj `https://auru.dev/mcp`)
- Podporuje protokol JSON-RPC 2.0 (Streamable SSE / POST).
- **Autorizácia**: `Authorization: Bearer <TRINITY_MCP_API_KEY>` s hlavičkou `Accept: application/json, text/event-stream`.
- **Kľúč pre Codexa a nástroje**:
  - Uložený v `C:\Users\saboi\.env` ako `TRINITY_MCP_API_KEY`.
  - Windows DPAPI šifrovaný credential: `C:\Users\saboi\Trinity-antigravity\.credentials\codex-mcp.dpapi`.
- **Overovací test MCP prepojenia**:
  - `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\saboi\Trinity-antigravity\Trinity\scripts\test-gemini-mcp.ps1`
