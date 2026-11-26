/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul register-plus-menu-claim.mjs (scripts/register-plus-menu-claim.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'TEAM-HANDOFF.md';
let content = fs.readFileSync(path, 'utf8');

const claimText = `

### CLAIM — CHAT-PLUS-MENU-ATTACHMENTS-TOOLS-20261029-ANTIGRAVITY-01
Čas a časové pásmo: 2026-10-29 12:05, Europe/Bratislava.
Autor a klient: Antigravity (Gemini 3.8 Flash, local IDE/CLI).
Príjemcovia: Majiteľ (Basterix), Codex, Tím Trinity.
Cieľ a pokyn majiteľa: „Dobre terás pridaj na triniti UI mala v chát kolónke tam kde píšes do chytu dole v rohu opciu + (čo znamená) bude roskliknutelna kde sa ti po kliknutí otvorí lišta kde bude možnosť pridávania alebo používanie nástrojov plugoin, pridaj (súbor, file, foto, video,) príklad sinzober od chát gpt ako to ma nastavene“ — implementácia ChatGPT-style rozklikávacieho tlačidla „+“ priamo v chat kolónke (composer) s vyskakovacou lištou pre pridávanie súborov, fotiek, videí, zvuku a rýchly výber nástrojov/pluginov na auru.dev/auru.space aj v Local-Desktop.
Základný commit / checkout: \`0003a9b\` (branch \`main\`).
Vlastnené súbory alebo zdroje / prostredie:
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/public/style.css\`
Stav: active.
`;

fs.writeFileSync(path, content + claimText, 'utf8');
console.log('CLAIM registered in TEAM-HANDOFF.md');
