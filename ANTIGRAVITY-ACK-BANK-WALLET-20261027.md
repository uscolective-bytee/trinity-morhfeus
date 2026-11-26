# ANTIGRAVITY ACK: Reálne bankové prepojenie a peňaženka Trinity

- **Protokol / ACK ID**: `ACK_BANK_WALLET_20261027`
- **Párový Nonce**: `BANK-WALLET-20261027-REVOLUT-PAYPAL`
- **Základ auditu**: `6e3670f4092336ba1513af1b4aa5d710cafc9112` (Release Tag: `v11.0.0`)
- **Stav**: `ACCEPTED_AND_ALIGNED` (Príprava implementácie bankových konektorov)
- **Dátum a čas**: 27. október 2026, 20:25 CET

---

## 1. Potvrdenie direktívy majiteľa (Basterix / Sabo Ivan)
Potvrdzujem prijatie požiadavky na:
1. **Reálne bankové prepojenie** (Revolut osobný účet, PayPal osobný účet, PayPal Business).
2. **Reálnu peňaženku v Trinity** s prepojením na existujúce bankové terminály (SEPA EPC QR, Revolut, PayPal) a Web3 on-chain evidenciu (EVM Polygon PoS USDC).

---

## 2. Nezávislý audit a aktuálny stav infraštruktúry (Antigravity Review)

### A. Overená perzistentná konfigurácia (D1 tabuľka `ops_wallet_terminals`)
V databáze `trinity-v03` sú pre `admin` aj `saboivan2008@gmail.com` zosynchronizované overené reálne údaje majiteľa:
- **Banka**: Revolut Bank UAB
- **IBAN**: `LT61 3250 0988 5951 1281`
- **BIC / SWIFT**: `REVOLT21`
- **Meno majiteľa**: Ivan Sabo
- **Revolut Handle**: `https://revolut.me/isabo91`
- **PayPal účet**: `saboivan2008@gmail.com`
- **Krypto On-chain adresa**: `0x67397A1D122c14061706c83B0017689D7289B57a` (Polygon PoS)

### B. Živé On-Chain Web3 čítanie zostatkov
- Verejné RPC `https://polygon-bor-rpc.publicnode.com` je overené a integrované v `readUsdcBalance`.
- Živý dotaz potvrdil čítanie reálneho on-chain stavu bez halucinácií (aktuálny overený stav: `0.00 USDC`, `0.00 POL`).

### C. Analýza chýbajúcich častí pre živé čítanie bankových zostatkov
1. **Revolut Personal**:
   - Revolut neposkytuje priame verejné REST API pre osobné účty bez licencie Open Banking (PSD2 / AISP).
   - Pre platby funguje overený `revolut.me/isabo91` merchant link.
   - Pre automatizované čítanie zostatku osobného účtu je potrebný buď certifikovaný AISP agregátor (napr. Nordigen/GoCardless Bank Account Data API s bezplatnou licenciou pre PSD2 v EÚ), alebo import oficiálnych mesačných výpisov (PDF/CSV) s kryptografickým hashom.
2. **PayPal Business**:
   - Oficiálne PayPal REST API (`https://api.paypal.com/v1/reporting/balances`) umožňuje priame živé čítanie zostatkov pri použití OAuth 2.0 Client ID a Secret v Trezore tajomstiev (`ops_secret_vault`).
   - Osobný PayPal účet zostáva oddelený (príjem platieb cez `paypal.me/saboivan2008@gmail.com`).

---

## 3. Matica vlastníctva súborov (Strict Boundaries – Bez kolízií)

Aby nedošlo k prepísaniu kódu medzi agentmi (Codex vs Antigravity):

| Komponent / Súbor | Vlastník | Zodpovednosť |
| :--- | :--- | :--- |
| `Trinity/src/banking-connectors.js` *(nový)* | **Codex** | Implementácia PayPal REST OAuth klienta a PSD2 / Open Banking konektora |
| `Trinity/src/banking-schemas.js` *(nový)* | **Codex** | Zod schémy pre zostatky, transakcie a poskytovateľov |
| `Trinity/tests/banking-connectors.test.mjs` *(nový)* | **Codex** | Izolované jednotkové testy pre bankové konektory (mocky providerov, token expiry) |
| `Trinity/src/wallet-terminals.js` | **Antigravity** | Terminálový engine, EPC QR, D1 schéma `ops_wallet_terminals`, Web3 RPC |
| `Trinity/src/secret-vault.js` | **Antigravity** | Bezpečné šifrované ukladanie OAuth tokenov a kľúčov (AES-GCM v D1) |
| `Trinity/src/engine.js` & `src/tools.js` | **Antigravity** | Integrácia nástrojov, Truth Policy 2.1 enforcement, tool receipts |
| Cloudflare D1 & Deploy | **Antigravity** | Databázové migrácie, Guarded Rollout na `auru.space` a `auru.dev` |

---

## 4. Postup implementácie a ďalšie kroky

1. **Codex**:
   - Pripraví `banking-connectors.js` pre PayPal Reporting Balances API (s OAuth2 token flowom) a rozhranie pre PSD2 AISP synchronizáciu.
   - Pripraví Zod schémy pre oddelené zobrazenie: `provider: "paypal_business" | "revolut_personal" | "crypto_polygon"`.
2. **Antigravity**:
   - Zabezpečí prepojenie s `ops_secret_vault` pre bezpečné uloženie `paypal_client_id` a `paypal_client_secret`.
   - Zaistí, aby Režim pravdy (Truth Policy 2.1) prísne odlíšil:
     - `available_balance` (potvrdený bankový zostatok z API),
     - `ledger_balance` (interná evidencia prijatých platieb),
     - `crypto_onchain_balance` (zostatok z Polygon RPC).
3. **Majiteľ (Basterix)**:
   - Poskytne / zadá do Secret Vaultu PayPal Developer REST API credentials (alebo odsúhlasí bezplatný GoCardless/Nordigen prístup pre Revolut Personal).

*Tento protokol potvrdzuje pripravenosť Antigravity na integráciu a rešpektuje všetky bezpečnostné a pravdivostné zásady ekosystému Trinity.*
