# AGENTS.md — Trinity-antigravity

Pokyny pre agentov (Codex, Antigravity). S majiteľom (Sabo Ivan / Basterix) komunikuj po slovensky.

1. Najprv prečítaj [CODEX-ANTIGRAVITY-PROTOCOL.md](CODEX-ANTIGRAVITY-PROTOCOL.md) a posledný HANDOFF (aktuálne `CODEX-HANDOFF-FROM-ANTIGRAVITY-CORE-TOOLS-20261027.md`).
2. **Kľúče a tajomstvá:** spoločný súbor je `C:\Users\saboi\.env` (mimo repa). Postup, zákazy a inventár sú v protokole, sekcia 7.
   - Prítomnosť over: `powershell -NoProfile -File scripts/shared-env.ps1 -Check` (hodnoty sa nevypisujú).
   - Hodnoty nikdy nevypisuj, nelogovaj ani necommituj. Chýbajúci kľúč pridá majiteľ, nežiadaj ho do chatu.
3. Pred deployom testy, deploy s `--tag <git-sha>`, overenie `node Trinity/scripts/verify-deployment.mjs`. Produkčný merge/deploy len po staging dôkaze a rozhodnutí majiteľa.
