# Jeden kanonický zdroj pre produkciu a staging

Kanonický zdroj aplikácie Trinity 11 je
https://github.com/uscolective-byte/Trinity-antigravity, vetva **main**,
aplikácia **Trinity/**. Repozitár trinity-morhfeus je historický/zrkadlený.
Nemaž ho ani z neho nezapínaj ďalší automatický deploy bez porovnania
unikátnych zmien a externých väzieb.

| Doména | Prostredie Wrangler | Worker | Zdroj |
|---|---|---|---|
| auru.space | produkcia (bez pomenovaného env) | trinity | kanonický main |
| auru.dev | staging | trinity-staging | kanonický main |

Zdrojom názvov a väzieb je súbor Trinity/wrangler.jsonc. Staršie návody
môžu používať development či trinity-development; nepoužívaj ich namiesto
staging bez overenia. Zdieľanie alebo oddelenie D1/KV/R2 určujú bindingy,
nie názvy domén. OAuth identity a secrets sa nikdy nemigrujú automaticky.

## Bezpečné overenie pred nasadením

1. Over čistý git status, HEAD main a rozdiel oproti poslednému vydaniu.
2. Spusti lokálne testy, kontrolu závislostí, CodeQL a integračné testy.
3. Ak GitHub Actions hlási failure (aj pri blokácii billing/runner), zastav
   automatický produkčný release. Lokálne testy nie sú náhradou za CI gate.
4. V koreňovom adresári spusti node scripts/audit-worker-secrets.mjs.
   Skript kontroluje produkciu aj staging, číta len zoznam názvov secrets
   a nečíta, nepresúva ani nevypisuje ich hodnoty.
5. Neprenášaj produkčné poverenia do stagingu len kvôli úspešnému testu.
   Kľúče musí vydať ich poskytovateľ a bezpečne nastaviť autorizovaný účet.
   Hodnoty uložených Wrangler Secrets nie je možné spätne stiahnuť.
6. Nasad staging a over /health, /ready a presný 40-znakový commit SHA.
7. Až po zelenom stagingu a release gate vykonaj potrebné produkčné migrácie
   a over produkčný deployment proti totožnému commit SHA.

## Príkazy (iba v autorizovanom prostredí)

Z koreňového adresára čistého checkoutu:

~~~powershell
npm.cmd ci
npm.cmd run check
node scripts/audit-worker-secrets.mjs
~~~

Zo zložky Trinity/:

~~~powershell
$releaseCommit = git rev-parse HEAD
npm.cmd ci
npm.cmd test
npm.cmd run build:staging
npx.cmd wrangler d1 migrations apply DB --remote --env staging
npm.cmd run deploy:staging -- --tag $releaseCommit
node scripts/verify-deployment.mjs https://auru.dev $releaseCommit

# Iba po schválenom a úspešnom stagingu:
npx.cmd wrangler d1 migrations apply DB --remote --env=""
npm.cmd run deploy -- --tag $releaseCommit
node scripts/verify-deployment.mjs https://auru.space $releaseCommit
~~~

Health a ready nepotvrdzujú funkčnosť všetkých externých integrácií.
Bankové účty, Google/Microsoft/Meta OAuth a Telegram webhook vyžadujú
samostatné živé overenie. Každé nasadenie eviduje celý SHA, Worker
version ID, prostredie, výsledky testov a čas overenia.