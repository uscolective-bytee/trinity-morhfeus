# TRINITY_MASTER — Secrets Store integration

**Stav (31.10.2026):** PR #22 už bol **zlúčený do main**, ale aktuálne nasadenie a živé scope/credential overenie nebolo v tomto audite nezávisle potvrdené.
**Interný názov:** `TRINITY_MASTER`. Nie je to premenovanie Cloudflare
Secrets Store a nie je to nový Cloudflare API token.

Cloudflare account-level Secrets Store uchováva hodnoty oddelene od Gitu.
Trinity pozná iba ID existujúceho store z už pripojeného `OLLAMA_SECRET`
a názvy tajomstiev deklarované používateľom. Prístup k účtu
ani skutočný stav scopes pri tomto commite nebol live overený.

## Povolené väzby (len staging: `auru.dev`)

| Cloudflare Secrets Store položka | Runtime binding | Použitie |
| --- | --- | --- |
| `ollama` | `OLLAMA_SECRET` | pôvodný funkčný **binding v konfigurácii**, connection status nie je overený |
| `apigoogle` | `TRINITY_MASTER_GOOGLE` | interné rozlíšenie `gemini` credential po `await get()` |
| `copilot` | `TRINITY_MASTER_COPILOT` | interný `copilot` credential; bez predpokladu, že účet/OAuth sú prepojené |

**Produkcia (`auru.space`) ostáva nezmenená:** má iba
`OLLAMA_SECRET`. Nové bindingy sa nesmú automaticky preniesť do produkcie
pred kontrolou scopes, účtu, testov a schváleným staging nasadením.

## Zámerne NEPRIPOJENÉ

- `GITHUBE_FINE_TOKEN`: podľa popisu používateľa má široký prístup k
  GitHubu. Nemá byť dostupný všeobecnému chat Workeru. Použi radšej
  samostatný GitHub App alebo fine-grained token len pre určený repozitár
  a operácie. Na GitHub Actions synchronizáciu Morpheus sa používa
  `GITHUB_TOKEN` vytváraný GitHubom; Cloudflare token to neopraví.
- `BASTERIX`: PC bridge credential, nie Gemini token. Potrebuje samostatný
  autorizovaný PC Bridge Worker, nie všeobecný chat Worker.
- `R2`: R2 už má natívny `ARTIFACTS` R2 binding; názov tajomstva nemusí
  byť API credential a pridanie by neposkytovalo nové R2 práva.
- `Secret`, `snowy-wave-03db`: obsah a účel neboli identifikované.
- `default_grok_default`: uvedený je iba rozsah AI Gateway, bez scope
  `workers`; nie je možné ho pripojiť ako Workers Secrets Store binding,
  kým sa rozsah explicitne nezmení.
- `ollama-Duplicate`: duplicitné poverenie bez jasného účelu.

## Bezpečnostné pravidlá

1. `TRINITY_MASTER` nesprístupňuje endpoint na čítanie tajomstiev.
   `trinityMasterBindingStatus(env)` nevolá `.get()`, vráti len
   `configured` a `verified:false`.
2. `readTrinityMasterSecret` povoľuje iba známe serverové adaptéry
   `gemini` a `copilot`; neakceptuje ľubovoľné názvy bindingov.
3. V skutočnom behu potrebuje Secrets Store položka scope `workers`
   a deploy credential oprávnenie Secrets Store Edit/Secrets Store Deployer.
   `Active` znamená existenciu/aktivitu v store, **nie živú autorizáciu
   Gemini alebo Copilot poskytovateľa**.
4. Hodnoty nikdy nekopíruj do `wrangler.jsonc`, dokumentácie, GitHub
   komentárov alebo výstupov CI.
5. Staging po deploy overiť na `auru.dev`, s kontrolou očakávaných
   dostupných bindingov a skutočného serverového volania poskytovateľovi.
   Bez úspechu sa `verified` nezmení na true.

## Kontrola a nasadenie (po obnovení CI)

```bash
cd Trinity
npm ci
node --test tests/trinity-master-secrets.test.mjs tests/trinity-master-wrangler.test.mjs tests/trinity-master-provider-resolution.test.mjs
npx wrangler deploy --env staging --dry-run --outdir dist-master-check
```

Až po úspešnej kontrole môže vlastník s potrebným oprávnením spustiť:

```bash
cd Trinity
npx wrangler deploy --env staging
```

Tento deploy príkaz **nebol vykonaný v tomto chate**. Najskôr overiť
skutočné scopes položiek `apigoogle` a `copilot`, správne store ID
a dostupnosť existujúceho `ollama` bindingu. Cloudflare secrets z
Dashboardu nie sú priamo prístupné v lokálnom `wrangler dev`.

## Technické zdroje

- https://developers.cloudflare.com/secrets-store/integrations/workers/
- https://developers.cloudflare.com/secrets-store/access-control/

**Ďalší krok:** overiť GitHub CI runner, staging dry-run a cloudové
bindingy; následne zvážiť oddelený privileged `TRINITY_MASTER` Worker pre
GitHub/PC admin akcie, nie pridávať široké tokeny k verejnému chatu.

## Cloudflare AI diagnostický agent a ovládací prehľad

Kanonický repozitár po zlúčení PR #22 obsahuje interné rozhrania:

- `GET /api/assistant/master/status` — **vyžaduje autorizovaného admina**, vracia iba pravdivý stav konfigurácie (Workers AI / D1 / R2, ChatGPT API, Claude API, Gemini, Copilot, Codex workflow, GitHub, PC bridge). Vždy rozlišuje `configured`, `provider_verified`, `oauth_linked` a `execution_verified`; nečíta nijaké hodnoty Secrets Store.
- `POST /api/assistant/master/advise` s JSON `{"task":"Skontroluj prepojenia Trinity"}` — **admin-only**, rate limit, max. 2000 znakov; Cloudflare Workers AI dostane iba neprivilegované metadata a vráti odporúčania s `status:advice_only`, `execution_performed:false`. Nemá nástroje na reálny deploy, GitHub push, shell, PC ani čítanie secretov.

Ak chýba Workers AI binding, endpoint odpovie `not_configured`; ak model zlyhá alebo nevráti odpoveď, nehlási úspech. Výstup modelu nie je doklad o tom, že akcia bola vykonaná.

Serverová cesta Gemini teraz rozlišuje uložené Worker Secret a Secrets Store binding `TRINITY_MASTER_GOOGLE`. Pri nedostupnom alebo neplatnom kľúči skončí s chybou, nie s falošným pripojením. Záložný Gemini model sa zisťuje z dostupných modelov Google API a autentifikácia používa `x-goog-api-key` HTTP header — nie URL query parameter.

**Nezamieňať API prístup za prepojenie spotrebiteľského účtu:** ChatGPT API kľúč neprepojí históriu ChatGPT účtu; Copilot Studio vyžaduje samostatné nakonfigurovanie agenta a vlastný prístup; Codex potrebuje oprávnené GitHub workflow alebo iné schválené rozhranie; Claude používa vlastnú Anthropic API autorizáciu; miestny Windows PC ostáva nepripojený bez bežiacej brány.

Regresné testy:
```bash
cd Trinity
node --test tests/trinity-master-secrets.test.mjs tests/trinity-master-wrangler.test.mjs tests/trinity-master-provider-resolution.test.mjs tests/trinity-master-status.test.mjs tests/trinity-master-agent.test.mjs tests/trinity-master-gemini-runtime.test.mjs
```

**Dôkazový stav:** vykonaná izolovaná syntaktická kontrola modulov, test výstupu pomocou syntetického Cloudflare AI bindingu a kontrola, že nebol prečítaný žiaden secret. Kompletné `npm test`, živé Cloudflare AI, Google API a staging deploy sa ešte nepodarilo overiť. Neaktivovať novú funkcionalitu v produkcii pred zeleným CI, kontrolou oprávnení a staging testom.

## Nový Cloudflare staging isolation audit

`Trinity/scripts/cloudflare-env-audit.mjs` porovnáva priamo
`wrangler.jsonc` D1, KV a R2 identifikátory produkcie/stagingu.
Kontrola 31.10.2026 detegovala zdieľané **D1 `rea`,
D1 `trinity_basterix`, KV `Mastermind` a R2 `ARTIFACTS`**.
Hlavná D1 `DB` má samostatné identifikátory, ale celé staging
prostredie ešte nie je izolované.

```bash
cd Trinity
node scripts/cloudflare-env-audit.mjs
# exit code 2, ak sa vyžaduje striktne oddelené staging úložisko:
node scripts/cloudflare-env-audit.mjs --strict
```

Nástroj je **iba read-only** a nemá Cloudflare API oprávnenia,
nevytvára ani nemaže zdroje a nezapisuje tajomstvá.
Pred staging mutačnými testami treba vytvoriť samostatné D1, KV,
R2 zdroje, migrovať výlučne povolené testovacie dáta a
aktualizovať identifikátory konfigurácie. Nevsúvať náhodné
falošné ID: do produkcie by to mohlo smerovať na neexistujúci
resource a prerušiť služby.

Bez samostatných úložísk sa môžu staging testy dotknúť
produkčných dát; staging deploy preto vyžaduje osobitnú
kontrolu očakávaných zápisov. Tvrdenie, že staging je
úplne izolovaný, **nie je aktuálne pravdivé**.

## Akčný skill pre Trinity, Codex a Google Antigravity

Nový zdroj pravdy pre agentov:
`.agents/skills/cloudflare-secrets-store/SKILL.md`. Tento skill bol
pridaný do repozitára a prepojený z koreňového `AGENTS.md`;
**nebol nainštalovaný na offline Windows PC** ani vykonaný v živom
Cloudflare účte.

Kontrola bez čítania hodnoty secretu:

```bash
cd Trinity
npm run secrets:doctor
npm run secrets:test
node scripts/cloudflare-env-audit.mjs --strict
```

Príkaz `secrets:doctor` kontroluje metadáta `wrangler.jsonc`:
povolené názvy a store ID, duplicity, staging-only Gemini/Copilot,
nezamieňanie store za provider a nedovolený administrátorský/PC key
v široko dostupnom Workeru. Nečíta ani neloguje hodnoty tajomstiev;
neoveruje vzdialený Cloudflare status, existenciu ani scopes.

Po prihlásení majiteľa môže Antigravity lokálne použiť iba
metadátové Wrangler príkazy `secrets-store store list --remote`
a `secrets-store secret list STORE_ID --remote` na overenie
scope `workers`. Netreba sťahovať žiadne hodnoty kľúčov ani používať
`secret get`. Pri nedostupnom PC alebo Cloudflare relácii treba
označiť overenie `blocked`, nie `verified`.

Cloudflare vyžaduje `Account Secrets Store Edit` pre CI token,
ktorým sa nasadzuje nový binding. Samotný `Read` nestačí.
Ide o iné oprávnenie než API token pre bežné GitHub Actions.
