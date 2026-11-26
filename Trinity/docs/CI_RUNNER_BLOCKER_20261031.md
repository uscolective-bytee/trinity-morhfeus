# Trinity 11 — CI runner diagnostika k 31. októbru 2026

Kanonický repozitár: https://github.com/uscolective-byte/Trinity-antigravity
Pracovný PR: https://github.com/uscolective-byte/Trinity-antigravity/pull/22

## Overené z GitHub API

Trinity CI na PR #22 zlyhá pred vykonaním prvého kroku. Pre CI workflow
run `41219016766`, pokus 2 (manuálne obnovené failed jobs), GitHub vrátil:
- `status: completed`, `conclusion: failure`;
- job `124589570877`, `runner_id: 0`, `runner_name: ""`;
- `steps: []`, bez kroku checkout, npm ci, build alebo test;
- API na získanie job logu vrátilo 404 `BlobNotFound`.

To nie je dôkaz úspechu/poruchy zdrojového kódu; testovacie príkazy
pravdepodobne vôbec nebežali. Rovnaký vzorec majú CodeQL, integračné
kontroly a dependency audit. **Preto neskrývať/nevypínať tieto kontroly**.

GitHub Status evidoval problém Actions dňa 30.10.2026, označený ako
resolved. Stav služby na status stránke nedokazuje, že súkromný GitHub
runner alebo rozpočet konkrétneho účtu sú v poriadku.

## Diagnostika správcu GitHub účtu

1. Otvoriť Actions → Trinity CI run uvedený vyššie a skontrolovať
   GitHub UI hlásenie nad jobom (napr. runner allocation alebo billing).
2. Skontrolovať GitHub Settings → Billing / Actions spending limits a
   prípadné blokovanie účtu alebo používanej organizácie.
3. Skontrolovať repository Settings → Actions → General a prístup
   GitHub-hosted runnerov. Branch protection/ruleset informácie sú pre
   pripojený GitHub App nedostupné (HTTP 403).
4. Po oprave účtu spustiť existujúci workflow `runner-smoke.yml`
   ručne cez GitHub Actions. Následne spustiť build CI, CodeQL,
   dependencies a integration checks pre presný PR head SHA.
5. Až po zelených výsledkoch skontrolovať celý diff, potom merge do
   `main`. Produkčný deploy vyžaduje osobitný staging verify.

## Zmeny pripravené v PR #22

- Fail-closed Cloudflare, Firebase, OpenAI-compatible, Anthropic a
  Telegram credential verifiers.
- Serverom overený admin kontext pre mutujúce Cloudflare, GitHub
  a Firebase tools.
- Pending PC/gateway a GitHub Actions dispatch nehlási completed.
- GitHub repo writes smerujú iba do kanonického repozitára.
- Doplnené regresné testy a dokumentácia.
- Koreňový npm balík a package-lock zosúladené na
  `trinity-antigravity-workspace` (aplikácia zostáva 11.0.0).

**Ohraničenie dôkazu:** zmeny sú commitnuté a staticky kontrolované
cez GitHub obsah, ale Node testy, Cloudflare live health ani deploy
neboli v tejto relácii úspešne spustené. Desktop Commander BASTERIX
zostáva offline. Nepresúvali sa ani nerotovali žiadne secrets.
