# Pokračovanie bez straty kontextu

Tento súbor je prvý kontrolný bod pre nový chat alebo model. Pred pokračovaním treba prečítať:

1. `Dokumentacia/AKTUALNY-STAV.md`
2. `Dokumentacia/HISTORIA-ZMIEN.md`
3. `stav-projektu.json`
4. `Trinity/README.md`

## Pravidlá pokračovania

- Kanonickou vetvou je `main`, pracovný strom je `c:\Users\saboi\OneDrive\trinity`.
- Používaj slovenčinu pri komunikácii s vlastníkom (Sabo Ivan / Basterix).
- Produkčné tvrdenie musí mať test, Cloudflare Version ID alebo živý výsledok.
- Tajomstvá (`.env`, `.credentials`, `.dev.vars`, DPAPI) sa nikdy nečítajú, nevypisujú ani necommitujú.
- Jedna Trinity používa modely, 45 špecializácií a 7 modulov ako nástroje; nevytvárajú sa oddelené identity.
- Pred nasadením produkcie vždy najprv overiť vývojové prostredie (`npm run build:development`, deploy development).

## Aktuálny stav (Trinity 10.2.0)

Trinity beží v plne zosynchronizovanej verzii **10.2.0** naprieč UI, Cloudflare Workermi aj lokálnou bránou.

- **Produkcia**: Worker `trinity` na doméne <https://auru.space>
  - Cloudflare Version ID: `ef0c9f7e-fe9a-4637-a619-bac847bbb433`
  - Git Commit Tag: `ecad46f84a214baa76c99fab208cd052c7999e9b`
  - Stav: `serving`, 45 špecialistov, evidence-required truth mode
- **Vývoj**: Worker `trinity-development` na doméne <https://auru.dev>
  - Cloudflare Version ID: `97db3586-a982-42b0-8ff7-10770b667a28`
  - Git Commit Tag: `ecad46f84a214baa76c99fab208cd052c7999e9b`
- **Automatizované testy**: 213 / 213 úspešných testov v `Trinity/` (`npm test`).
- **Moduly ekosystému (všetkých 7 zostavených)**:
  1. `Trinity` – hlavný operačný Worker (v10.2.0, Durable Objects, Workflow, D1, KV, R2)
  2. `PC-Bridge-Worker` – cloudový relay Worker pre bezpečný most s PC
  3. `Local-Gateway` – privátna lokálna brána (v1.3.0, port 8791, spúšťa sa cez `SPUSTIT-LOCAL.cmd`)
  4. `Capacity-Worker` – monitorovanie kvót, tokenov a nákladov
  5. `Audit-Worker` – centrálna evidencia udalostí a audit logy
  6. `Integrations-Worker` – správa konektorov a externých API
  7. `Knowledge-Worker` – znalostná služba a sémantické vyhľadávanie
- **Používateľské rozhranie (UI)**:
  - Zjednotené na `TRINITY 10.2` (chat asistent aj operačné centrum `/ops`).
  - Živý indikátor stavu PC Bridge v pravom hornom rohu (`PC: Online` / `PC: Offline`).
  - Rýchle návrhy pre spustenie desktopových aplikácií (Kalkulačka `calc.exe`, Poznámkový blok `notepad.exe`, Chrome).
  - Výber poskytovateľa obsahuje `Môj počítač · PC Bridge` pre lokálny model a priame ovládanie.
  - Striktné HTTP hlavičky `Cache-Control: no-cache, no-store, must-revalidate` eliminujú starú cache prehliadača.
- **Rýchla cesta pre desktopové aplikácie**:
  - `engine.js` a `tools.js` obsahujú deterministické spracovanie príkazov na otvorenie programov (`isOpenAppRequest` a `pc_open_app`).
  - `Local-Gateway` má registrované schopnosti `open_app`, `screenshot`, `notify`, `system_info` s priamym spustením cez `desktop.mjs` a `local-action-dispatcher.mjs`.

## Aktuálny ďalší krok

1. Spustiť lokálnu bránu na počítači cez `Local-Gateway\SPUSTIT-LOCAL.cmd` a overiť zelený odznak `PC: Online` v UI.
2. Otestovať cez webový chat priame otvorenie kalkulačky a poznámkového bloku.
3. V prípade potreby automatického štartu PC brány so systémom Windows spustiť `Local-Gateway\install-autostart.ps1`.
