# Trinity 11 — Cloudflare diagnostika a bezpečná obnova (2026-10-31)

Kanonický zdroj: `uscolective-byte/Trinity-antigravity`.
- Produkčný Worker: `trinity` → `auru.space`.
- Staging Worker: `trinity-staging` (Wrangler environment: `staging`) → `auru.dev`.
- Koreňový Worker používa základnú konfiguráciu bez pomenovaného env.

## Potvrdené chyby v zdrojovom kóde

1. `external-integrations.js` predtým pri chýbajúcom Cloudflare tokene
   hlásil úspech pri nepodložených Workers/zones/cache akciách. V PR #22
   sú tieto stavy označené ako **neoverené** alebo **failed**.
2. Cloudflare rozlišuje user API token a account-owned token. V PR #22
   nový `cloudflare-token.js` overuje oba prípady, prijíma iba
   `success:true` a `result.status:active`, nevracia hodnotu tokenu.
   Ten istý postup používa runtime aj trezor.
3. `scripts/audit-worker-secrets.mjs` už používa `staging` namiesto
   zastaraného `development`, pokrýva bežné aliasy kľúčov a nikdy
   nečíta ani nevypisuje hodnoty.
4. Záznam v GitHub PR je zmena **zdroja**, nie automatický live deploy.
   Cloudflare Workers a GitHub Actions Secrets sú nezávislé poverenia.

## Read-only diagnostika na Windows

Po získaní opravenej vetvy alebo jej merge do `main`:

~~~powershell
Set-Location "C:\Users\saboi\Trinity-antigravity"
npm.cmd --prefix Trinity ci
npm.cmd run cloudflare:doctor
~~~

Diagnostika nevypíše hodnoty kľúčov ani nespraví deploy. Rozlíši:
- `api_token.verified`: API token viditeľný **aktuálnemu procesu**
  bol overený u Cloudflare; `missing` nie je automaticky porucha,
  keď sa Wrangler prihlasuje cez OAuth.
- `wrangler.authenticated`: lokálna relácia Wrangler CLI je funkčná.
- `production_secrets_list_access` a `staging_secrets_list_access`:
  bolo možné **načítať názvy**, nie obsah ani použiteľnosť secrets.
- `d1_environment_isolation`: konfigurácia produkcie/stagingu používa
  rôzne databázové ID. Zobrazený shared KV/R2 je varovanie o prípadnom
  zdieľaní, nie chyba v tokenoch.

Ak je `wrangler.installed=false`, nainštaluj projektové závislosti.
Ak je `wrangler.authenticated=false`, použi v `Trinity`
`npx.cmd wrangler login`, autorizuj cez Cloudflare prehliadač a
znovu spusti diagnostiku. Netreba token kopírovať do chatu.

**GitHub Actions CI:** workflow používa repository/environment Secret
`CF_API_TOKEN` a premennú `CF_ACCOUNT_ID`. Lokálne úspešné
`wrangler whoami` nepotvrdzuje existenciu toho istého poverenia v CI.
GitHub environment `development` si zachováva pôvodné
ochranné pravidlá, no Wrangler cieľom je `--env staging`.

## Kedy je potrebný nový Cloudflare token

Až po potvrdení, že existujúci token je `disabled`, `expired`,
neplatný alebo neumožňuje požadovanú operáciu. Nový token
sa vytvára **v Cloudflare Dashboardi** pre presne určený účet.
Poskytnúť iba potrebné práva (Workers Scripts write/deploy,
D1 edit pre migrácie, prípadne Workers read). DNS práva pridávať
iba ak ich vyžaduje konkrétny úkon. Produkčné a staging poverenia
oddeliť podľa možností poskytovateľa.

Nový token sa zadá priamo do autorizovaného Cloudflare/GitHub
Secret Store. Nikdy neposielať do chatu, issue, PR, logu alebo
`.env` commitovaného v Gite. Starý token sa zruší až po
zabezpečenej výmene a overení spotrebiteľov.

## Release gate

1. CI, CodeQL, dependencies a integračné testy musia prejsť.
2. Overiť staging `https://auru.dev/health` a `/ready` presným SHA.
3. Pred migráciami D1 overiť zálohy a správny binding.
4. Až potom spustiť produkčný release pre `auru.space`.
5. Uložiť skutočné Cloudflare Worker version ID a výsledok verifikácie.

**Neoverené:** reálny Cloudflare účet, platnosť aktuálnych tokenov,
aktívne Worker Secrets a live odpovede domén — vzdialené volania
v tejto relácii nie sú autorizované. Zlyhané GitHub Actions
nemajú dostupné logy; nie je dokázané, že ich zlyhanie spôsobuje Cloudflare.
