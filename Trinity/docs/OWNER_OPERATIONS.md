# Trinity: príručka majiteľa a prevádzky

Táto príručka rozlišuje implementáciu v zdroji, uloženú konfiguráciu, autorizovaný účet a skutočne overený výsledok. Žiadna položka katalógu sama osebe nepotvrdzuje funkčnú integráciu. Presný index každého zdrojového modulu, deklarovaných exportov a migrácií obsahuje [SOURCE_REFERENCE.md](SOURCE_REFERENCE.md).

<details>
<summary>1. Architektúra, domény a dáta</summary>

Podľa aktuálneho `src/architecture.js` a konfigurácie `wrangler.jsonc` obe domény `auru.space` a `auru.dev` obsluhuje jeden Worker `trinity`. Zdieľajú produkčné dáta; doména `.dev` už sama osebe neoznačuje izolované testovacie prostredie. Bezpečný lokálny vývoj preto používaj na localhost s lokálnymi dátami.

| Súčasť | Úloha | Čo je dôkaz fungovania |
| --- | --- | --- |
| Worker `trinity` | web, autentifikácia, API, chat, koordinácia | `/health`, `/ready` a konkrétna úspešná požiadavka |
| D1 `trinity-v03` | účty, úlohy, projekty, pamäť a prevádzkové záznamy | úspešný autorizovaný dotaz, stav migrácií |
| KV `Mastermind` | cache a pomocné indexy | čítanie/zápis konkrétnej položky |
| R2 `trinity-artifacts` | súbory a výstupy | existujúci objekt a funkčné oprávnené stiahnutie |
| Workflow `trinity-operations` | dlhšie úlohy | ID úlohy, stav a výsledok jednotlivých krokov |
| servisné Workers | delegované schopnosti | odpoveď konkrétnej služby; samotný binding nestačí |
| lokálny gateway a PC Bridge | prístup k povoleným akciám na PC | čerstvý heartbeat a potvrdenie konkrétnej akcie |

Aktuálnu verziu, tag, zdrojový repozitár a ID nasadenia získaj z `/health`. Porovnaj obe domény. Počet testov a stav providerov vždy preber z aktuálneho protokolu, nie zo starého opisu architektúry.

Tok: prehliadač → overenie relácie a práv → chat/router → model alebo priamy nástroj → overený výsledok → uložená úloha a odpoveď. Pri zápise musí výsledok pochádzať zo služby, ktorá zápis vykonala.

Zdroj: `src/index.js`, `src/architecture.js`, `src/jobs.js`, `src/workflow.js`, `src/orchestrator.js`, `src/infrastructure.js`, `src/security.js`.

</details>

<details>
<summary>2. Chat: rýchlosť, spracovanie a pravdivosť</summary>

Požiadavka majiteľa: odpoveď má prísť čo najskôr, s horným rozpočtom dvoch minút. Tento limit sa nesmie interpretovať ako povinné čakanie. Krátky výpočet alebo čas má obslúžiť priamy nástroj; náročnejšia úloha môže dostať model a nástroje.

Rozpočet musí zahŕňať všetky pokusy poskytovateľa, fallbacky, kroky nástrojov aj polling. Samotné prerušenie čakania v prehliadači nemusí zastaviť serverovú ani externú akciu. Pri časovom limite sa musí zachovať koncept správy a známe ID úlohy. Pred opakovaním zápisu treba zistiť výsledok pôvodného pokusu.

„Spracúvam“ alebo „Premýšľam“ označuje skutočne čakajúcu požiadavku. Stručné štádiá možno odvodiť z reálnych udalostí; nevymýšľať percentá, falošné kroky ani interné uvažovanie modelu. Pri chybe alebo ukončení sa indikátor vypne.

Odpoveď má jasne rozlišovať návrh, výpočet, údaj zo zdroja, chýbajúcu autorizáciu a dokončenú akciu. Pri tvrdení o vykonaní musí existovať potvrdenie nástroja s výsledkom, časom a identifikátorom. Zlyhanie treba oznámiť; odpoveď ho nesmie nahradiť vymysleným úspechom.

Pri dlhom rozhovore sa posúvajú správy, písanie zostáva dostupné. Keď používateľ číta staršie správy, nové odpovede ho nemajú násilne presúvať. Overiť počítač, mobilnú klávesnicu, dlhý text, zväčšenie a ovládanie klávesnicou.

Zdroj: `src/engine.js`, `src/fast-chat.js`, `src/chat-routing.js`, `src/services.js`, `src/truth.js`, `services/chat-inference.js`, `public/assistant/chat.js.txt`.

Nezávislá kontrola: `node scripts/verify-chat-contract.mjs`. Ide o lokálny test riadenia toku s pevnými testovacími vstupmi; úspech nie je dôkazom živej odpovede na webe. Výsledok: `verification/chat-owner-contract.json`.

</details>

<details>
<summary>3. Modely a API kľúče</summary>

Kľúč dáva prístup k účtu; neurčuje inteligenciu modelu. Vybraný model musí byť dostupný danému účtu, kompatibilný s adaptérom a otestovaný na krátkej odpovedi, reálnom volaní nástroja a chybe. Meraj čas a výsledok. „Najlepší“ poskytovateľ sa nedá potvrdiť iba názvom alebo uložením tajomstva.

Kľúče patria do Worker Secrets alebo šifrovaného trezoru. Nikdy ich nevkladaj do chatu, Markdownu, screenshotu, repozitára alebo reportu. V rozhraní sa zobrazuje iba maskovanie, poskytovateľ, oprávnenia a výsledok poslednej skúšky.

Pri výmene najprv bezpečne ulož náhradný kľúč a over funkčný model; potom prepnúť. Starý prístup zruš až po potvrdení funkčnosti náhrady a rozsahu jeho používania. Nevykonávať nákup plateného plánu iba preto, že model vrátil chybu.

Implementácia: `src/ai-providers.js`, `src/services.js`, `src/secret-vault.js`, `src/api-keys.js`. Prehľad providerov používa `/api/assistant/ai-providers`; test providerov `/api/ops/providers/test`. Prístup vyžaduje príslušnú rolu. Prítomnosť kľúča je konfigurácia; úspešný test je samostatný dôkaz.

</details>

<details>
<summary>4. Nástroje, moduly a oprávnenia</summary>

Postup: nájsť konkrétny nástroj → skontrolovať presnú schému vstupu → overiť právo a pripojenie → vykonať → overiť výsledok. Nezamieňať počet pluginov s počtom reálne dostupných a oprávnených nástrojov.

Stavy rozlišovať: implementované, nakonfigurované, autorizované, overené, nedostupné a chybové. Bez dôkazu nepísať „aktívne“ alebo „hotovo“. Nainštalovaný modul môže vyžadovať samostatné prihlásenie alebo mať iba oprávnenie na čítanie.

V nastaveniach zobraziť kompaktné skupiny s rozbalením: AI, účty a integrácie, domény, platby, zariadenia, bezpečnosť a rozšírené nastavenia. Po rozbalení ukázať aktuálny stav, poslednú skúšku a konkrétny ďalší krok. Zachovať serverové kontroly práv aj vtedy, keď UI skrýva ovládací prvok.

Zdroj: `src/tools.js`, `src/plugins.js`, `src/mcp.js`, `src/capability-status.js`, `src/integration-readiness.js`, `src/external-integrations.js`, `src/registry.js`. Prehľad: `/api/assistant/capabilities`. Autorizovaný MCP katalóg určuje, ktoré nástroje sú dostupné aktuálnemu prístupu.

</details>

<details>
<summary>5. Banky, platby a obchod</summary>

Uložený e-mail, RevTag, IBAN, QR alebo platobný odkaz nepotvrdzuje prihlásenie k účtu, vlastníctvo, zostatok ani prijatú platbu. Názov „banking“ v UI nie je dôkazom bankového spojenia.

| Oblasť | Potrebný skutočný výsledok |
| --- | --- |
| PayPal Checkout | platná konfigurácia poskytovateľa, úspešná autorizácia, konkrétna objednávka; prijatie platby až po potvrdenom stave poskytovateľa |
| Revolut | príslušná podporovaná integrácia a autorizácia účtu; odkaz je iba platobná inštrukcia |
| SEPA QR | validované platobné údaje; QR samo nepotvrdzuje prevod |
| Zostatok a transakcie | autorizované čítanie poskytovateľa s časom získania |
| Predaj domény | potvrdenie platby a oddelene výsledok prevodu/registrátora |
| Investovanie a komodity | jasné označenie režimu, zdroja ceny a oprávnenia vykonať obchod; testovacie portfólio nevydávať za reálne aktíva |

Označenie testovacieho prostredia musí byť viditeľné. Duplicitu platby alebo výberu neriešiť automatickým opakovaním po chybe. Najskôr overiť pôvodnú objednávku alebo transakciu. Oprávnenia, dostupnosť produktu a podmienky poskytovateľa sa overujú pri skutočnom pripájaní účtu.

Zdroj: `src/paypal-rest.js`, `src/revolut.js`, `src/wallet.js`, `src/wallet-terminals.js`, `src/banking-commodity-advanced.js`, `src/commodities-engine.js`, `src/market-data.js`, `src/trading.js`. Stavové endpointy: `/api/assistant/paypal/status`, `/api/assistant/paypal/rest-status`, `/api/assistant/revolut/status`; vyžadujú oprávnenie vlastníka.

</details>

<details>
<summary>6. Google, komunikácia a lokálny počítač</summary>

Google účet vyžaduje skutočný OAuth súhlas s konkrétnymi rozsahmi. Uložený e-mail nie je oprávnenie čítať Workspace. Telefónne číslo samo neaktivuje SMS, WhatsApp ani Telegram. Každý kanál potrebuje podporovanú integráciu, overenie a skúšku doručenia.

Lokálny PC gateway má povolené pracovné cesty a akcie. Dostupný cloudový Worker neznamená pripojený počítač. Over heartbeat, allowlist a doklad konkrétnej akcie. Neobchádzať prihlasovanie ani fyzické potvrdenie.

Zdroj: `src/google-auth.js`, `src/connection-guidance.js`, `src/telegram-bridge.js`, `src/voice-agent.js`, `src/system-actions.js` a súvisiace moduly PC Bridge v úplnom indexe.

</details>

<details>
<summary>7. Passkey, Windows Hello a hardvérový kľúč</summary>

V prihlásenej relácii otvor Nastavenia → bezpečnostné kľúče, zadaj rozpoznateľný názov zariadenia a spusti registráciu. Potvrdenie PIN/biometrie/dotyk kľúča dokončí majiteľ osobne v systémovom dialógu. Až úspešná serverová verifikácia a záznam v zozname znamenajú dokončenú registráciu.

Zachovať alternatívny funkčný spôsob prihlásenia. Pred odstránením kľúča over dostupnosť iného prístupu. Zoznam má ukázať názov a čas registrácie/použitia bez tajných údajov.

`auru.space` a `auru.dev` majú podľa `src/webauthn.js` rozdielne RP ID. Spoločná databáza ani Worker negarantujú, že kľúč zaregistrovaný na jednej doméne bude fungovať na druhej. Registráciu a prihlásenie treba overiť na každej používanej doméne.

Tok používa `/api/auth/passkey/register-options`, `/register-verify`, `/auth-options`, `/auth-verify` pod rovnakým prefixom `/api/auth/passkey`; zoznam `/api/auth/passkey/list`. Implementácia musí overiť výzvu, origin, RP ID, podpis a príslušnosť účtu, nestačí existencia tlačidla.

</details>

<details>
<summary>8. Domény, DNS a publikovanie</summary>

Vyhľadanie domény, cenová ponuka, vytvorenie záznamu a nákup sú odlišné kroky. Dostupnosť a cena vyžadujú aktuálny výsledok poskytovateľa. Nákup musí mať potvrdenie registrátora; vytvorenie landing page nepotvrdzuje vlastníctvo domény.

Pred zmenou DNS zaznamenať pôvodné hodnoty a rozsah zmeny. Po zápise overiť API poskytovateľa a následne verejné rozlíšenie/HTTPS. Upozorniť na reálny čakajúci stav šírenia bez vymysleného času úspechu. Produkčná cesta webu a ID nasadenia musia byť overené samostatne.

Zdroj: `src/domains.js`, `src/domain-desk-advanced.js`, `src/domain-environments.js`, `src/infrastructure.js`, `src/studio.js`, `src/developer-hub.js`.

</details>

<details>
<summary>9. Dokumentácia, audit a história</summary>

Dokumentácia má samostatné rozbaľovacie časti: použitie, architektúra, každý modul, účty a oprávnenia, banky, passkey, údržba a riešenie chýb. Podrobnosti sa otvárajú na požiadanie a nezaberajú celý hlavný chat.

Audit, systém a história zmien patria do vlastnej kompaktnej záložky. Zachovať vyhľadávanie, kategóriu, závažnosť a export. Nenačítavať celý archív pri každom otvorení chatu. Prázdny výsledok odlíšiť od chyby načítania.

Audit má obsahovať čas, aktéra, typ akcie, cieľ, stav, ID úlohy/potvrdenia a chybu. Bez tajomstiev. Export používateľovi sprístupniť iba podľa jeho oprávnení. Historický záznam nedokazuje aktuálnu dostupnosť služby.

Dokumenty: `src/trinity-documents.js`, [TRINITY_DOCUMENTS.md](TRINITY_DOCUMENTS.md). Audit: `src/audit-log.js`, `/api/assistant/audit/events`, `/api/assistant/audit/export`. Prístup vyžaduje právo `view_audit`.

</details>

<details>
<summary>10. Overenie vydania a riešenie poruchy</summary>

1. Zisti aktuálny commit a lokálne zmeny. Pri spolupráci rešpektuj CLAIM/HANDOFF a jedného vlastníka súboru.
2. Spusti build a príslušné testy; pre produkčné vydanie všetky povinné kontroly. Úspešný test s testovacími vstupmi neoznačuj za živé overenie.
3. Po nasadení over presné ID verzie/tag a readiness oboch domén. Zaznamenaj zdroj, čas a výsledok.
4. V skutočnom prihlásenom prehliadači over odpoveď, nástroj s potvrdením, chybu, timeout a scroll/composer. Na mobilnom rozmere aj klávesnicu a dlhý chat.
5. Ak chýba oprávnenie, priprav konkrétny prihlasovací krok. Ak je chyba u poskytovateľa, zobraz ju a stav úlohy. Žiadna simulovaná náhrada výsledku.

Kontroly: `node scripts/verify-chat-contract.mjs`, `node --test --test-concurrency=1 tests/*.test.mjs`, build podľa `package.json`, `scripts/verify-deployment.mjs` s aktuálnym ID nasadenia. Živá skúška dvoch diagnostických úloh cez existujúci autorizovaný most: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/verify-chat-live.ps1`. Vytvorí iba vlastné testovacie úlohy a report `verification/chat-owner-live.json`; neoveruje rozloženie prehliadača. Obnovenie spolupráce: [spoločný protokol](../../CODEX-ANTIGRAVITY-PROTOCOL.md).

Táto príručka zaznamenáva aj požadované správanie. Implementáciu časového limitu, rozloženia a živé prepojenia treba potvrdiť aktuálnym release protokolom; text príručky ich neaktivuje.

</details>
