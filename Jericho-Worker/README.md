# Jericho123 — Autonómny Crypto Super-Agent & Treasury Node

Tento worker predstavuje samostatný uzol suverénneho ekosystému **Trinity 11.0**, bežiaci na globálnej sieti Cloudflare Workers. Slúži ako špecializovaný autonómny agent pre dohľad nad kryptomenovým trhom, technické signály, DeFi výnosy a správu pokladnice Tetrakis ($TTK).

---

## 🌐 Domény a nasadenie

| Parameter | Hodnota |
|---|---|
| **Služba** | `jericho123` |
| **Produkčná doména** | [jericho123.auru.space](https://jericho123.auru.space) |
| **Vývojová doména** | [jericho123.auru.dev](https://jericho123.auru.dev) |
| **Cloudflare Account ID** | `b60342e5e52f5646fbd4e913bb409334` |
| **Kompatibilita** | Node.js kompatibilita (`nodejs_compat`), Cloudflare Edge workerd |
| **Plánovaný trigger (Cron)** | `0 * * * *` (Autonómny cyklus každú hodinu) |

---

## 🛡️ Truth Policy 2.0 & Zásady overiteľnosti

V súlade s Truth Policy 2.0 Jericho **nikdy nevymýšľa obchody, nezobrazuje fiktívne zostatky ani negeneruje syntetické ceny ako živé signály**:
1. **Živé trhové dáta**: Ceny BTC, ETH, SOL, BNB, XRP, AVAX, LINK, SUI a USDC sa čerpajú cez overený live ticker (Binance v3 API). Pri nedostupnosti feedu je stav explicitne označený ako `feed_unavailable` a automatizované signály sú bezpečne pozastavené (`DATA_UNAVAILABLE`).
2. **Peňaženky a kľúče**: EVM adresa pokladnice je deterministicky odvodená a overená (`0x4d308452a96D7dAbFd2f33d92677A3a2724f387e`). Bitcoin (Bech32) a Solana (Ed25519) reťazce sú označené pravdivo ako `AWAITING_BECH32_KEYPAIR` a `AWAITING_ED25519_KEYPAIR` bez generovania náhodných textových adries.
3. **Pracovné výkazy (`workReceipt`)**: Každý autonómny cyklus vystaví unikátny doklad `jericho:<uuid>`, ktorý obsahuje trhový sentiment, top odporúčania a explicitné flagy `transfers_executed: false` (žiadny prevod peňazí bez overeného kľúča a autorizácie).

---

## 📡 REST API a RPC rozhranie

### Verejné a interné REST endpointy:
- `GET /health` — Overenie stavu, verzie a domén workera (JSON).
- `GET /api/status` — Prevádzkové metriky uzla na Cloudflare Edge.
- `GET /api/prices` — Aktuálne živé kurzy sledovaných aktív.
- `GET /api/signals` — Technická analýza sentimentu (Fear/Greed index 0–100) a obchodné signály (DCA akumulácia, momentum, breakout).
- `GET /api/treasury` — Stav a adresy oficiálnej pokladnice Trinity Mastermind.
- `GET /api/yields` — Prehľad top DeFi protokolov (Aave v3, Lido, Uniswap v3, Raydium, Curve).
- `GET /api/tetrakis` — Špecifikácia a pripravenosť ERC-20 tokenu Tetrakis ($TTK).
- `POST /api/work` — Manuálne spustenie autonómneho pracovného cyklu s generovaním výkazu.
- `GET /` — Interaktívny vizuálny dashboard agenta Jericho 123.

### Servisná väzba (Service Binding) s Trinity:
Trinity pristupuje k Jerichu priamo cez privátny RPC binding `env.JERICHO_SERVICE`, ktorý obchádza Cloudflare Access vrstvu a poskytuje metódy:
* `status()`
* `ping()`
* `getPrices()`
* `getSignals()`
* `getTreasury()`
* `getTetrakisInfo()`
* `executeWorkCycle()`

---

## 🧪 Testovanie a verifikácia

Všetky funkcie sú podložené automatizovanými testami (`tests/jericho.test.mjs`):
```bash
npm test
```
* **12 / 12 testov PASS** (vrátane testu cron triggeru, live endpointov, RPC rozhrania a renderovania dashboardu).
