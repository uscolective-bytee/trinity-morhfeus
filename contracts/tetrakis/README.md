# TetrakisToken ($TTK) — Oficiálny ERC-20 Smart Contract

Smart kontrakt **Tetrakis ($TTK)** je jadrom krypto-ekonomiky suverénneho systému **Trinity 11.0**. Bol navrhnutý s maximálnym dôrazom na bezpečnosť, nemennosť (immutability) a nulovú cenzúru.

---

## 💎 Tokenomika a parametre kontraktu

| Parameter | Hodnota |
|---|---|
| **Názov tokenu** | `Tetrakis` |
| **Symbol** | `TTK` |
| **Štandard** | ERC-20 (OpenZeppelin Contracts v5.1.0) |
| **Solidity verzia** | `0.8.24` (Shanghai EVM target) |
| **Celková zásoba (Fixed Cap)** | **1,000,000,000 TTK** (1 miliarda TTK) |
| **Počet desatinných miest** | `18` |
| **Počiatočná pokladnica (Treasury)** | `0x4d308452a96D7dAbFd2f33d92677A3a2724f387e` |
| **Cieľové siete** | Base (Coinbase L2), Arbitrum, Polygon, Ethereum |

---

## 🔒 Bezpečnostné invarianty kontraktu

1. **Jednorazová emisia (Single Mint)**: 100 % zásoby (presne $10^9 \times 10^{18}$ wei) je vygenerovaných pri konštrukcii kontraktu priamo na adresu oficiálnej pokladnice.
2. **Žiadne dodatočné mintovanie**: Kontrakt neobsahuje žiadnu funkciu `mint()` po deployi.
3. **Nulové poplatky (Zero Tax)**: Žiadne transakčné dane, redistribúcie ani skryté poplatky.
4. **Nulová cenzúra (No Blacklist / No Pausable)**: Žiadny blacklist, pozastavenie (pausable) ani honeypot mechanizmy.
5. **Nemennosť (Immutable)**: Žiadne upgradovateľné proxy vzory. Kód je po nasadení trvalý.

---

## 📁 Štruktúra modulu

```
contracts/tetrakis/
├── TetrakisToken.sol           # Solidity zdrojový kód (OpenZeppelin v5.1.0)
├── build/
│   └── TetrakisToken.json      # Skompilovaný ABI, Bytecode a Runtime Keccak256
├── scripts/
│   ├── compile.mjs             # Kompilátor cez solc 0.8.24
│   └── deploy-base-sepolia.mjs # Bezpečný skript na verifikáciu a deploy (Base Sepolia)
├── tests/
│   ├── local-evm.mjs           # Izolovaný in-memory testovací EVM uzol (Anvil)
│   └── tetrakis.test.mjs       # Komplexná sada 15 invariantných a edge-case testov
└── package.json
```

---

## 🧪 Automatizované testy (15/15 PASS)

Spustenie testov:
```bash
npm test
```

Testovacia sada overuje:
* Zhoda runtime bytecode voči nasadeniu
* Názov, symbol a 18 desatinných miest
* 100 % alokácia pokladnici pri vzniku
* Nemennosť ABI (žiadne post-mint funkcie)
* Štandardné prevody, self-transfer a nulové prevody
* Schválenia (approvals), transferFrom a nekonečná allowance optimalizácia
* Negatívne testy (prečerpanie zostatku, prevod na zero-address, neplatná allowance)
* **Zákon zachovania zásoby**: celková suma zostatkov ostáva po každej operácii presne invariantná.

---

## 🚀 Postup nasadenia (Base Sepolia & Base Mainnet)

1. **Kompilácia**:
   ```bash
   node scripts/compile.mjs
   ```
2. **Overovací Dry-Run**:
   ```bash
   node scripts/deploy-base-sepolia.mjs --dry-run
   ```
3. **Ostré nasadenie (vyžaduje zostatok na gas)**:
   ```bash
   node scripts/deploy-base-sepolia.mjs --broadcast
   ```
