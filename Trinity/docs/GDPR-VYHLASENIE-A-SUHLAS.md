# 🛡️ Vyhlásenie o ochrane osobných údajov a Súhlas so spracovaním (GDPR)

> **Systém:** Trinity Sovereign OS 11.0 (`auru.space` & `auru.dev`)  
> **Prevádzkovateľ:** Ivan Sabo (vystupujúci ako Basterix) / Ekosystém Trinity & Auru Digital Studio  
> **Právny rámec:** Nariadenie Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a Zákon č. 18/2018 Z. z. o ochrane osobných údajov  
> **Dátum účinnosti:** 28. októbra 2026  
> **Verzia:** 1.0 (Oficiálny platný predpis)  
> **Kontaktný e-mail pre uplatnenie práv (DPO):** `gdpr@auru.space` / `sabo.ivan@auru.space`

---

## 1. Identifikácia prevádzkovateľa a zodpovednej osoby

Prevádzkovateľom informačných systémov, cloudových služieb a klientskych rozhraní platformy Trinity je:

- **Fyzická osoba / Iniciátor a vlastník:** Ivan Sabo, vystupujúci pod označením **Basterix**
- **Názov ekosystému:** Trinity Morhfeus Sovereign AI OS / Auru Digital Studio
- **Prevádzkové domény:**
  - Produkčné rozhranie a klientsky chat: [`https://auru.space`](https://auru.space)
  - Vývojové a laboratórne rozhranie: [`https://auru.dev`](https://auru.dev)
- **Kontakt pre ochranu osobných údajov:** `gdpr@auru.space`

Prevádzkovateľ vyhlasuje, že prijal primerané technické a organizačné opatrenia, aby zabezpečil a bol schopný preukázať, že spracúvanie osobných údajov sa vykonáva v súlade s Nariadením (EÚ) 2016/679 (ďalej len „GDPR“) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov v platnom znení.

---

## 2. Kategórie a rozsah spracúvaných osobných údajov

Trinity minimalizuje rozsah spracúvaných osobných údajov (zásada minimalizácie podľa Čl. 5 ods. 1 písm. c) GDPR) a spracúva výlučne údaje nevyhnutné na poskytovanie služieb:

1. **Registračné a identifikačné údaje:**
   - Používateľské meno (username), systémový identifikátor (`user_id`),
   - E-mailová adresa používateľa,
   - Systémová rola a oprávnenia (`owner`, `admin`, `user`).
2. **Autentifikačné a bezpečnostné údaje:**
   - Heslové hashe (hashované pomocou kryptografických jednosmerných funkcií, nikdy v otvorenom texte),
   - Verejné kľúče WebAuthn / Passkeys (privátne kľúče zostávajú bezpečne uložené výlučne v zariadení používateľa),
   - Šifrované relácie (Session tokens, HttpOnly Strict cookies).
3. **Technické a sieťové telemetrické údaje:**
   - IP adresa (pseudonymizovaná / spracúvaná na úrovni siete Cloudflare Edge pre ochranu pred DDoS),
   - Typ a verzia internetového prehliadača (User-Agent),
   - Dátum a čas prístupu, chybové stavy a záznamy o systémových akciách (`audit_logs`).
4. **Používateľský obsah a komunikácia s AI:**
   - Textové príkazy, systémové výzvy (prompty) a odpovede AI v konverzačnom rozhraní,
   - Hlasové záznamy pri použití funkcie Whisper Speech-to-Text (spracované v reálnom čase, neuchovávané ako trvalý surový audio záznam bez súhlasu),
   - Nahrané obrázky a dokumenty v rámci multimodálneho rozhrania,
   - Vytvorené projekty, záznamy v dlhodobej pamäti (`ops_memory`, `Graph RAG`) a doménové šablóny.
5. **Transakčné a finančné identifikátory (Revolut Pro, PayPal, SEPA EPC QR):**
   - Číslo bankového účtu vo formáte IBAN a kód BIC (výhradne ak ich používateľ dobrovoľne uloží za účelom generovania štandardizovaného SEPA EPC QR platobného predpisu),
   - Identifikátory klientskych transakcií, variabilné symboly a sumy platieb.
   - **DÔLEŽITÉ UPOZORNENIE:** Trinity **NIKDY** nevyžaduje, nezbiera ani neukladá prihlasovacie heslá do internetbankingu, autorizačné SMS kódy, PIN kódy ani kompletné čísla platobných kariet (CVV/CVC).

---

## 3. Účely spracúvania a právne základy

Spracúvanie osobných údajov v ekosystéme Trinity je založené na nasledujúcich právnych základoch:

| Účel spracúvania | Kategória údajov | Právny základ podľa GDPR |
|---|---|---|
| **Prevádzka platformy Trinity, autentifikácia a správa relácie** | E-mail, meno, hash hesla, session token | **Čl. 6 ods. 1 písm. b) GDPR** — Plnenie zmluvy / poskytovanie dohodnutej služby |
| **Vykonávanie AI asistencie, generovanie obsahu a webov** | Prompty, príkazy v chate, nahrané súbory | **Čl. 6 ods. 1 písm. b) GDPR** — Plnenie zmluvy a používateľských požiadaviek |
| **Bezpečnosť, prevencia kybernetických útokov, audit systémových zmien** | IP adresa, User-Agent, auditné záznamy | **Čl. 6 ods. 1 písm. f) GDPR** — Oprávnený záujem prevádzkovateľa a integrita systému |
| **Dlhodobá kontextová pamäť (Graph RAG, Ops Memory) & Ukladanie API kľúčov** | Znalostný graf, osobné preferencie, kľúče v AES-GCM trezore | **Čl. 6 ods. 1 písm. a) GDPR** — Výslovný súhlas dotknutej osoby |
| **Vedenie účtovnej a daňovej evidencie (doménové nákupy, licencie)** | Fakturačné údaje, čísla transakcií, sumy | **Čl. 6 ods. 1 písm. c) GDPR** — Plnenie zákonnej povinnosti (Zákon o účtovníctve SR) |

---

## 4. Technické a organizačné bezpečnostné opatrenia (Čl. 32 GDPR)

1. **Kryptografický trezor (`AES-GCM 256-bit`):** Všetky externé API kľúče, bankové tokeny a citlivé poverenia sú pred zápisom do databázy Cloudflare D1 šifrované symetrickou šifrou AES-GCM s unikátnym 96-bitovým inicializačným vektorom (IV).
2. **Kanonická izolácia a RBAC:** Systém dôsledne rozlišuje roly (`owner`, `admin`, `user`). Priestor každého používateľa je logicky a kryptograficky oddelený; žiadny používateľ nemá prístup k údajom alebo pamäti iného používateľa ani k systémovému jadru.
3. **Transportné zabezpečenie (HTTPS / TLS 1.3):** Všetka komunikácia medzi prehliadačom a servermi Trinity prebieha cez šifrovaný kanál s prísnymi bezpečnostnými hlavičkami (Content Security Policy, HSTS, X-Content-Type-Options: nosniff).
4. **Pravdivostná politika Truth Policy 2.0:** Auditné protokoly striktne zakazujú zaznamenávať heslá, súkromné kľúče alebo tokeny v čitateľnom stave.

---

## 5. Doba uchovávania osobných údajov

Osobné údaje sú uchovávané výhradne po dobu nevyhnutnú na naplnenie účelov, na ktoré boli získané:
- **Aktívne používateľské účty a profily:** Po dobu trvania registrácie a používania služby alebo do doručenia žiadosti o výmaz.
- **Konverzačná história a dočasná pamäť relácie:** Uchovávaná v pamäti relácie; používateľ ju môže kedykoľvek manuálne vymazať tlačidlom v rozhraní.
- **Auditné záznamy o bezpečnosti a prístupoch:** Uchovávané po dobu 90 až 365 dní z dôvodu ochrany pred kybernetickými incidentmi a následne automaticky rotované alebo anonymizované.
- **Účtovné a daňové záznamy:** 10 rokov v súlade so zákonom č. 431/2002 Z. z. o účtovníctve.

---

## 6. Práva dotknutej osoby podľa GDPR

Podľa nariadenia GDPR má každá dotknutá osoba nasledujúce práva:

1. **Právo na prístup k údajom (Čl. 15 GDPR):** Právo získať od prevádzkovateľa potvrdenie, či sa spracúvajú jej osobné údaje, a získať prístup k týmto údajom a informáciám o ich spracúvaní.
2. **Právo na opravu (Čl. 16 GDPR):** Právo na bezodkladnú opravu nesprávnych alebo doplnenie neúplných osobných údajov priamo v nastaveniach účtu.
3. **Právo na výmaz / Právo na zabudnutie (Čl. 17 GDPR):** Právo na vymazanie osobných údajov, ak už nie sú potrebné na dané účely, alebo ak dotknutá osoba odvolala svoj súhlas a neexistuje iný právny základ.
4. **Právo na obmedzenie spracúvania (Čl. 18 GDPR):** V prípadoch napadnutia správnosti údajov alebo nezákonného spracúvania.
5. **Právo na prenosnosť údajov (Čl. 20 GDPR):** Právo získať svoje osobné údaje v štruktúrovanom, bežne používanom a strojovo čitateľnom formáte (JSON / Markdown) a preniesť ich k inému prevádzkovateľovi.
6. **Právo namietať (Čl. 21 GDPR):** Právo kedykoľvek namietať proti spracúvaniu vykonávanému na základe oprávneného záujmu.
7. **Právo odvolať súhlas:** Dotknutá osoba má právo kedykoľvek odvolať udelený súhlas so spracovaním údajov bez toho, aby to malo vplyv na zákonnosť spracúvania založeného na súhlase pred jeho odvolaním.
8. **Právo podať sťažnosť dozornému orgánu:**
   Ak sa dotknutá osoba domnieva, že pri spracúvaní jej údajov došlo k porušeniu GDPR, má právo podať sťažnosť dozornému orgánu:
   - **Úrad na ochranu osobných údajov Slovenskej republiky**
   - Adresa: Hraničná 12, 820 07 Bratislava 27, Slovenská republika
   - Web: [https://dataprotection.gov.sk](https://dataprotection.gov.sk)
   - E-mail: `statny.dozor@pdp.gov.sk`

---

## 7. Formulácia výslovného súhlasu so spracovaním osobných údajov (GDPR Consent)

Tento text tvorí štandardizované znenie súhlasu pre používateľov pri registrácii, prihlásení alebo aktivácii voliteľných funkcií v rozhraní Trinity:

```text
„Týmto udeľujem prevádzkovateľovi Ivanovi Sabovi (Basterix / Trinity AI Ekosystém) 
dobrovoľný, výslovný a informovaný súhlas so spracúvaním mojich osobných údajov 
(e-mailová adresa, používateľský identifikátor, textové a hlasové príkazy, 
konfigurácie projektov a voliteľné technické preferencie) na účely poskytovania 
inteligentných asistenčných služieb, personalizácie odpovedí a správy projektov 
v systéme Trinity na doménach auru.space a auru.dev.

Potvrdzujem, že som bol/a vopred poučený/á o svojich právach podľa Nariadenia (EÚ) 2016/679 (GDPR), 
najmä o práve na prístup k údajom, ich opravu, vymazanie (právo na zabudnutie), 
obmedzenie spracúvania, prenosnosť údajov a o práve tento súhlas kedykoľvek bezplatne odvolať 
v nastaveniach svojho profilu alebo zaslaním požiadavky na e-mail: gdpr@auru.space.“
```

---

## 8. Záverečné ustanovenia

1. Tieto zásady a vyhlásenie o ochrane osobných údajov nadobúdajú platnosť a účinnosť dňom **28. októbra 2026**.
2. Prevádzkovateľ si vyhradzuje právo tieto podmienky aktualizovať pri zmenách právnych predpisov alebo zavedení nových funkcionalít systému. Každá nová verzia bude zverejnená na portáloch `auru.space` a `auru.dev`.
