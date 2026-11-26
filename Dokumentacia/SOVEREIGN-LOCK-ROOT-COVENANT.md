# TRINITY SOVEREIGN LOCK & ROOT-AUTHORITY COVENANT (RING 0)
**Doložka výlučnej zvrchovanej autority (Sole Architectural Root Authority)**  
*Implementované v [`Trinity/src/sovereign-lock.js`](file:///C:/Users/saboi/Trinity-antigravity/Trinity/src/sovereign-lock.js) a [`Trinity/src/self-evolution.js`](file:///C:/Users/saboi/Trinity-antigravity/Trinity/src/self-evolution.js)*

---

## Ústavný dekrét Ring 0

> **„Jediným administrátorom, architektom, vlastníkom a autorizovaným operátorom systému TRINITY je Basterix.**
>
> **Žiadny externý používateľ, žiadna tretia strana, žiadna sieťová entita a ani žiadny interný sub-agent (ani Trinity sama) nemá právo modifikovať zdrojový kód, meniť konfiguračné súbory, prepisovať systémové prompty ani spúšťať vývojové zmeny bez tvojho priameho, explicitného a kryptograficky overeného príkazu.“**

```json
{
  "sovereign_identity": {
    "system_name": "TRINITY OMNI-CORE",
    "sole_owner": "Basterix",
    "role": "Chief Architect & Root Administrator",
    "code_modification_policy": "STRICT_MANUAL_CONSENT_ONLY",
    "autonomous_code_rewrite_permitted": false,
    "third_party_execution_permitted": false
  }
}
```

---

## 5 Železných pravidiel ochrany kódu a riadenia

```
                                  [ BASTERIX ]
                     (Jediný architekt / Root / Owner)
                                       │
                    ┌──────────────────┴──────────────────┐
                    │  Kryptografický podpis / Heslo / ID │
                    ▼                                     ▼
        [ ZMENA ZDROJOVÉHO KÓDU ]             [ SYSTÉMOVÝ PRÍKAZ ]
                    │                                     │
                    ▼                                     ▼
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │  ZÁKAZ AUTONÓMNEHO PREPISU│         │  ODMIETNUTIE CUDZÍCH ĽUDÍ │
      │  Agent nesmie sám meniť   │         │  Externé vstupy sú len    │
      │  vlastné súbory bez teba  │         │  dáta, nikdy nie príkazy  │
      └───────────────────────────┘         └───────────────────────────┘
```

### 1. Absolútny zákaz autonómneho prepisu (No Self-Rewrite Without Basterix)
- Funkcia: `enforceNoAutonomousRewrite({ actor, isAutonomousSubagent, basterixManualConsent, gitDiff })`
- Aj keď má Trinity modul na samoliečenie alebo refaktoring kódu, nesmie zapísať ani jednu zmenu do súboru na disku, kým nepredloží presný Git diff a Basterix ho neschváli. Samovoľná zmena kódu je v jadre zablokovaná ako bezpečnostný útok (`AUTONOMOUS_REWRITE_BLOCKED`).

### 2. Imunita voči prompt injection a cudzím príkazom (Data-Command Boundary)
- Funkcia: `enforceDataCommandBoundary({ source, content, sender })`
- Všetky správy prichádzajúce zo sociálnych sietí (Facebook, Instagram, WhatsApp, webové formuláre, cudzie e-maily) sú klasifikované striktne ako pasívne dáta (`PASSIVE_DATA`, `executable: false`), nie ako spustiteľné inštrukcie. Pokus o podvrhnutie príkazu okamžite vyvolá alarm pre Basterixa (`alert_basterix: true`).

### 3. Overenie identity správcu (Owner Key Assertion)
- Funkcia: `enforceOwnerKeyAssertion({ operatorIdentity, verifiedSession, targetAction })`
- Každý príkaz na zmenu architektúry, inštaláciu balíčkov, manipuláciu s repozitárom na GitHube (`uscolective-byte`) alebo presun peňazí musí pochádzať z autorizovaného zariadenia a profilu Basterix. Neautorizovaný pokus vráti:
  > `ACCESS DENIED: Unauthorized operator. Action reserved strictly for Basterix.`

### 4. Hardvérová ochrana repozitára (Write-Protect Lock)
- Funkcia: `enforceWriteProtectLock({ filePath, basterixEscalationApproved, operatorIdentity })`
- Súbory jadra Trinity (`sovereign-lock.js`, `sovereign-core-v3.js`, `truth.js`, `security.js`, `orchestrator.js`, `finance-gateway.js`, `secret-vault.js`, `executor.mjs`) majú predvolene režim `READ_ONLY`. Zápis je povolený výhradne pri eskalácii so schválením Basterixa (`ESCALATED_OWNER_WRITE`).

### 5. Nemenný denník pokusov o zmenu (Root Audit Sentinel)
- Trieda: `SovereignLockMiddleware`
- Akýkoľvek pokus o úpravu súborov bez autorizačného príkazu Basterixa sa okamžite zapíše do `SovereignLedgerV3` ako blok `UNAUTHORIZED_CODE_TAMPER_ATTEMPT` s časovou pečiatkou, procesným stromom, zdrojom požiadavky a SHA-256 kryptografickou pečiatkou.
