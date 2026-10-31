# Kontrola, synchronizácia a zostavenie Trinity — 21. októbra 2026

## Rozsah a zdroj pravdy

Kontrola zahŕňa zdrojový repozitár, npm projekty, deklarované nasadzovacie ciele,
lokálne runtime testy a verejný stav nasadených služieb. Zdroj pravdy je
Trinity/src/index.js a Trinity/wrangler.jsonc. Inventár obsahoval 410 súborov;
archív SQL a duplicitný desktopový návod sú úmyselné podklady, nie ďalší runtime.
Tento dokument nie je dôkaz auditu každého riadku ani prístupu k živým tajomstvám.

## Zistenia a vykonané opravy

| Zistenie | Výsledok |
| --- | --- |
| Koreňové build/sync/deploy vyžadovali PowerShell, ktorý v cloudovom shelli nie je | Nový Node vstup scripts/project-pipeline.mjs pre setup, build, test/check a synchronizáciu; deploy používa existujúci Bash postup so zálohou D1 |
| Záložný Windows postup mohol spustiť dlhobežiaci start ako build, napr. Local-Desktop | Odstránený fallback na start; existujúce zastavenie pri zlyhaní testov/deploy zostáva zachované |
| Overenie nasadenia vyžadovalo iba commit tag, ktorý Cloudflare Workers Builds nevyplnil | Overovač podporuje presné --version-id; naďalej podporuje plný commit SHA |
| Samotné HTTP 200 nestačilo na dôkaz správnej pripravenosti a prostredia | Overovač vyžaduje ready=true, zhodnú verziu balíka, cieľové prostredie a konkrétny deployment |
| Pripravený Merchant sandbox nezodpovedal potvrdenému účtu Revolut Pro | Návrh nahradený reálnymi Pro platobnými odkazmi; bez Merchant kľúča, sandboxu a novej migrácie |
| Verejný checkout nesmie prijímať cieľ z query parametrov | Cieľ pochádza iba z owner katalógu, má presný allowlist HTTPS hostov a normalizovanú URL |
| Otvorenie platobného odkazu nedokazuje úhradu | Stav zostáva not_checked; žiadne automatické pripísanie zisku alebo sprístupnenie služby |

Žiadne tajomstvá neboli kopírované z Workera do repozitára. Nevypínali sa
prihlasovanie, WAF, kontrola pôvodu, kontrola rolí ani finančné oprávnenia.

## Zostavenia a testy

Spustený koreňový npm run check pokrýva všetky uvedené moduly. Následné npm run
build zostavilo päť Worker projektov, vývojovú Trinity a integračnú konfiguráciu.
Ide o dry-run, nie o dôkaz nasadenia. Po poslednej oprave overovača sa samostatne
opakovala sada Trinity vrátane troch nových testov overovania deploymentu.

| Sada | Úspešné testy | Preskočené |
| --- | ---: | ---: |
| Trinity, vrátane Pro a nového overovača | 295 | 0 |
| Knowledge-Worker | 5 | 0 |
| Capacity-Worker | 10 | 0 |
| PC-Bridge-Worker | 2 | 0 |
| Local-Gateway | 22 | 1 |
| Local-Desktop | 16 | 0 |
| Audit-Worker | 6 | 0 |
| Integračný runtime | 3 | 0 |
| Koreňové kompatibilné vstupy | 34 | 0 |

Koreňové kompatibilné vstupy opakujú vybrané kanonické testy; nejde o ďalšie
unikátne funkcie. Jeden CMD test vyžaduje Windows a na Linuxe bol preskočený.
Windows PowerShell postup sa tu nevykonal. JSON manifest AI zmien prešiel Ajv
validáciou. npm audit pre Trinity našiel 0 zraniteľností.

Úspešné mock testy modelov, Revolutu a konektorov nedokazujú živé účty ani platby.
Lokálny Gateway test nedokazuje spustený proces na používateľovom počítači.

## Živé pozorovanie pred týmto vydaním

| Cieľ | Pozorovanie |
| --- | --- |
| https://auru.space | health=200, ready=200, version=10.3.0, production, deployment 863ecc84-3985-4aea-9114-fdc18b723555 |
| https://auru.dev | health=200, ready=200, version=10.3.0, development, deployment 81c184f5-3721-4d75-9ec5-6798d8292ce1, starší commit dbff243 |
| trinity.saboivan2008.workers.dev | health=200, rovnaký produkčný deployment ako auru.space |
| Firebase Hosting trinity-morhfeus-20261001.web.app | HTTP 200; samostatný stavový web, nie runtime Trinity |

Firebase stavový klient v zdroji číta auru.dev. Túto rolu sme nemenili; rozdelenie
používateľského a vývojového prostredia používateľ odložil. Jeho cieľ a aktuálne
bankové oprávnenia nemožno odvodiť zo samotného označenia domény.

Pre Node požiadavky v proxy prostredí použi NODE_USE_ENV_PROXY=1 na podporovanej
verzii Node. Nastavenia proxy ani TLS sa neobchádzajú. Automatické overenie
používa rovnaký verejný JSON kontrakt health/ready ako ručná kontrola.

## Nasadenie a hranice synchronizácie

Overená alternatíva k zablokovaným GitHub Actions je existujúci Cloudflare Workers
Build pre main. Konkrétny výsledok aktuálneho vydania a jeho ID sa musí overiť po
zlúčení PR; predchádzajúci úspešný deployment nedokazuje nasadenie nového kódu.

GitHub Actions stále hlási zablokovaný účet pre fakturáciu, ešte pred spustením
krokov. Toto prostredie nemá pripravený Cloudflare token ani OAuth prihlásenie.
Preto nemožno z neho tvrdiť priame nasadenie všetkých pomocných Workerov,
aktualizáciu development, aplikovanie produkčných migrácií alebo Firebase deploy.
Nemajú sa vytvárať náhradné účty ani prenášať produkčné tajomstvá do verejných logov.

Pro platobný katalóg zostáva prázdny až do dodania skutočného odkazu, služby a
ceny. Verejný handle nie je dôkaz Pro checkoutu. Kód je pripravený na reálne
platobné odkazy, ale nezaručuje príjem zákazníkov ani zisk. Copilot Studio,
Gemini, OpenAI a bankové účty vyžadujú vlastné živé overenie; toto vydanie ho
nepredstiera a nemení ich prihlasovacie údaje.

## Opakovanie kontrol

Z koreňa projektu:

```bash
npm run setup
npm run check
npm run build
```

Na čistom checkout-e s nastavenou upstream vetvou npm run sync vykoná fetch,
iba fast-forward zlúčenie a kontroly. Nevynucuje reset ani neprepisuje konflikty.
Na priame nasadenie npm run deploy vyžaduje Bash a existujúci Cloudflare prístup;
ponecháva kontrolu prístupu a súkromný export D1 pred migráciami.

Po Cloudflare Workers Builde:

```bash
node Trinity/scripts/verify-deployment.mjs https://auru.space --version-id VERSION_UUID
```

Rollback: vrátiť konkrétne vydanie bežným PR/Cloudflare verziou. Nevykonávať obnovu
D1 alebo vymazanie údajov na základe tejto kontroly.
