# ACK: TRINITY EUR MULTIWALLET & REÁLNE KONEKTORY (Triad Antigravity)

**Identifikátor ACK**: `ACK_TRINITY_EUR_MULTIWALLET_20261027`  
**Referenčný Nonce**: `TRINITY-EUR-MULTIWALLET-20261027-A7A85AF`  
**Dátum a čas**: 2026-10-27T21:40:00+01:00  
**Základ auditu a vetva**: `a7a85af3e50763c309573184894bfbaca298705c` (`main`)  
**Stav**: `ACCEPTED_BY_ANTIGRAVITY`  

---

## 1. Potvrdenie rozdelenia vlastníctva súborov (File Ownership Cut)

V súlade s Handoff direktívou potvrdzujeme striktné rozdelenie súborov, aby nedochádzalo k prekrývaniu ani prepisovaniu:

| Komponent / Doména | Vlastník | Vyhradené súbory |
| :--- | :--- | :--- |
| **Nové konektory & zmluvy poskytovateľov** | **Codex** | `Trinity/src/banking-connectors.js`, `Trinity/src/connectors/*.js`, `Trinity/tests/banking-connectors.test.mjs`, `Trinity/tests/connectors-*.test.mjs` |
| **Existujúce UI, brána, routing & deploy** | **Antigravity** | `Trinity/src/index.js`, `Trinity/src/revolut.js`, `Trinity/src/paypal-rest.js`, `Trinity/src/wallet-terminals.js`, `Trinity/src/secret-vault.js`, `Trinity/tests/paypal-rest.test.mjs`, `Trinity/tests/revolut.test.mjs` |
| **Konzistencia databázy a trezora** | **Spoločne cez Handoff** | Migrácie D1 `ops_wallet_terminals`, `ops_wallet_ledger`, `ops_secret_vault` |

*Pravidlo:* Antigravity nenasadzuje kód na produkciu bez úspešného prebehnutia unit a integračných testov. Codex neupravuje runtime router `src/index.js` ani UI bez odovzdania cez Handoff.

---

## 2. Doloženie podporovaných oficiálnych rozhraní a stav autorizácie

V súlade s **Hardcore Truth Policy 2.1** deklarujeme skutočný stav pripojení:

### A. Revolut Personal (Osobný účet majiteľa)
- **Oficiálne rozhranie:** Revolut Business API (`b2b.revolut.com`) **nepodporuje** osobné účty. Osobné účty Revolut Bank UAB v EÚ podliehajú regulácii PSD2 Open Banking.
- **Prístup bez licencie TPP:** Vyžaduje certifikovaného agregátora (napr. bezplatné GoCardless Bank Account Data / Nordigen API pre AISP).
- **Aktuálny stav autorizácie:** `needs_provider_setup` / `needs_user_consent`.
- **Doloženie:** Prijímací IBAN `LT61 3250 0988 5951 1281`, BIC `REVOLT21`, ani platobný odkaz `revolut.me/isabo91` **nie sú** bankovým API spojením. Zostatok ani pohyby zatiaľ nie sú automatizovane overené.

### B. PayPal (Personal vs. Business)
- **Oficiálne rozhranie:** PayPal Orders v2 REST API (nasadené v commite `a7a85af`) beží v režime Sandbox checkout pre bezpečný vývoj.
- **Osobný účet:** PayPal neposkytuje automatizované REST API čítanie zostatku a histórie pre bežné osobné účty.
- **Aktuálny stav autorizácie:** `sandbox_connected` pre vývoj pokladne; `unsupported` pre automatizované čítanie zostatku osobného účtu.
- **Doloženie:** E-mail `saboivan2008@gmail.com` a `paypal.me` sú pasívne cieľové údaje platby, nie bankové rozhranie.

### C. Telegram Wallet (`@wallet`)
- **Oficiálne rozhranie:** Telegram Bot API (`api.telegram.org/bot<TOKEN>/`) poskytuje iba posielanie správ a webhooky botom. **Nemá prístup k peňaženke `@wallet` ani k fiat EUR zostatku používateľa**.
- **Wallet Pay API (`wallet.pay.tg`):** Samostatná brána pre prijímanie platieb v USDT/TON/BTC do Telegram Wallet.
- **On-chain TON:** Verejnú TON adresu možno auditovať cez verejné TON RPC (`tonapi.io` / `toncenter.com`), ide však o krypto aktíva (TON / USDT), nie fiat EUR.
- **Aktuálny stav autorizácie:** `unsupported` pre priame čítanie fiat EUR zostatku; `needs_provider_setup` pre Wallet Pay API / TON on-chain.

---

## 3. Bezpečnostné a architektonické garancie

1. **Žiadne tajomstvá v chate:** Privátne kľúče, seed frázy, heslá ani API secrets sa nikdy nevypisujú do chatu, repozitára ani nestruktúrovaných logov. Prípadné generovanie kľúčov sa rieši výhradne šifrovaným ukladaním do `ops_secret_vault` pomocou `TRINITY_VAULT_KEY`.
2. **Žiadne umelé zlučovanie mien:** EUR zostatky, krypto zostatky (USDC, USDT, TON) a testovacie prostriedky sa striktne vedú oddelene. Sčítanie do jednej hodnoty je zakázané bez doloženého devízového kurzu (ECB / overený cenový orákulum).
3. **Pravdivé stavy zostatkov:** Ak zostatok nie je overený cez autorizované API, stav je `unknown` / `not_checked`, nikdy nie vymyslená nula (`0.00 €`).
4. **Žiadny nútený Business onboarding:** Rešpektujeme, že majiteľ je fyzická osoba a systém sa vyvíja bez nutnosti zakladania firmy.

---
**Zaznamenané:** Pripravené na prevzatie Codexom pre implementáciu konektorov a testov.
