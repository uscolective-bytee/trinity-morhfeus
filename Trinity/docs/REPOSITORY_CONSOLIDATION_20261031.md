# Konsolidácia repozitárov Trinity — 31.10.2026

## Potvrdená história

Kanonický repozitár: https://github.com/uscolective-byte/Trinity-antigravity
Historický: https://github.com/uscolective-byte/trinity-morhfeus

Historické porovnanie GitHub commitov pred aktualizáciou starého repozitára:
- Starý `trinity-morhfeus/main` HEAD: `c0a808b174109f9a1b55250705d23e982c44019d`.
- Kanonický `Trinity-antigravity/main` HEAD: `910204984d9e82945811bd3142850f2fab11be2e`.
- GitHub compare v kanonickom repozitári: status `ahead`,
  40 commitov ahead, 0 behind, merge base = starý HEAD.
- Vtedajší hlavný commit starého repozitára je predkom kanonickej hlavnej vetvy.
  **Pozor:** starý repozitár po tomto meraní dostal nové commity, takže
  pôvodné čísla nie sú aktuálnym údajom o vzájomnej synchronizácii.
  Nepoužívať force push ani hromadný merge.

## Rozpracované funkcie — individuálne posúdenie

- Starý repo PR #68: read-only WordPress connector; preveriť oddelený
  `Trinity/services/wordpress-connector.js`, testy a integračný dispatcher.
- Starý repo PR #51: ChatGPT ↔ Copilot Studio shared-notes bridge;
  porovnať s novým Trinity-antigravity PR #15 a nezduplikovať OAuth.
- Starý repo PR #64: Streetline UI; konfliktné so súčasným Omni-Dev chat
  a neoverenou browser QA.
- Starý repo PR #53: wallet/domain truth + UI; vybrať iba otestované
  nekonfliktné opravy.
- Starý repo PR #46: starý UI/runtime restore; neprenášať wholesale.
- Kanonický repo PR #14: Marketplace; PR #15: Microsoft/Graph;
  PR #13: Telegram; PR #22: secrets/release/konfigurácia. Nie sú zlúčené.

## Nasadzovanie a autorizácia

Po prechode testami sa produkčný release vydáva **iba** z kanonického
`main`, staging cez `--env staging`. Starý repo musí prestať byť
produkčným deploy zdrojom; pred archiváciou overiť všetky webhooky,
GitHub Actions, Vercel project mappings a Cloudflare Workers Builds.
Pri tejto kontrole nebol starý repozitár archivovaný ani zmazaný.
Nenahrádzať chýbajúce secrets tokenmi z iného prostredia.

## Kritériá úspechu

1. Kanonické GitHub CI a CodeQL fungujú a majú použiteľné logy.
2. `npm run docs:check` existuje; release docs opisujú obe domény.
3. `scripts/source-policy.mjs` nepripustí legacy origin pre sync/deploy.
4. Evolution Engine defaultne mieri na kanonický repozitár.
5. Všetky prenášané PR majú vlastné testy a presné commity.
6. Cloudflare /health a /ready potvrdia deployed SHA, prostredie a version ID.

## Aktualizácia konsolidácie — 31.10.2026

Zdrojový `trinity-morhfeus/main` je teraz na commit
`3f99d95ecefb7a56c66683983dcff6d58d0af1d7`.
Kanonický `Trinity-antigravity/main` zostáva `910204984d9e82945811bd3142850f2fab11be2e`.
Read-only porovnanie stromov: 667 súborov starého main, 719 v
kanonickom main, **žiadna chýbajúca cesta**, 53 ciest s rozdielnym
blob SHA. Rozdielne SHA nemusia znamenať chýbajúcu opravu — treba
prihliadať na novšie zmeny a testy.

### Skutočne prenesené (iba pracovný PR #22, nič nie je live)

- WordPress PR #68: tri súbory (read-only klient, regresné testy,
  dokumentácia). **Nekonfigurovaný a neaktivovaný**.
- ChatGPT ↔ Copilot Studio PR #51: izolovaný modul shared notes,
  test, D1 SQL migrácia, OpenAPI schema a upravený staging návod.
  Bez aktivovaného endpointu, OAuth účtov a produkčného deploy.
- Merge starého PR #76: Wrangler 4.154.0 synchronizovaný v
  `Trinity/package.json` a `Trinity/package-lock.json`.
  Build/CI po update ešte nebol zelený.

Presný inventár a proveniencia:
`Trinity/docs/MORPHEUS_MIGRATION_MANIFEST_20261031.json`.
Ten je iba **index**, NIE plná archivácia Git dát, PR diskusií
alebo externých tajomstiev.

### Prečo starý repozitár NESMIE byť ešte zmazaný

- Má 25 vetiev, 73 pull requestov (z nich 11 otvorených),
  tri samostatné GitHub issues a dva release tagy.
- Kandidáti na prenesenie: #64 Streetline, #53 wallet/domain,
  #46 platform restore a šesť otvorených Dependabot PR. Celú
  starú implementáciu neslobodno slepo prepisovať do nového runtime.
- GitHub PR reviews/komentáre, source-only commity, 25 vetiev,
  tagy a webhook konfigurácie nie sú týmto PR zálohované.
- GitHub Secret hodnoty nie je možné získať z repo API; Cloudflare
  API tokeny, D1/R2/KV a externé dáta sa týmto kopírovaním
  vôbec neprenášajú.
- GitHub Actions v PR #22 stále zlyháva ešte pred spustením
  runnera. Bez úspešného restore testu zálohy, kontroly závislostí
  a stagingu sa zdroj nemá nenávratne odstrániť.
- Pripojený GitHub nástroj v tejto relácii nepodporuje mazanie
  celého repozitára.

**Stav požiadavky:** selektívna migrácia pokračuje v jednom PR;
úplné presunutie všetkej rozpracovanej histórie a následné zmazanie
zdroja zatiaľ nebolo vykonané. Nie je pravda, že každý git objekt,
GitHub issue, PR diskusia alebo cloudová integrácia už bola migrovaná.
