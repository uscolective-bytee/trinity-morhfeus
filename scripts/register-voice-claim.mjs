/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul register-voice-claim.mjs (scripts/register-voice-claim.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'TEAM-HANDOFF.md';
let content = fs.readFileSync(path, 'utf8');

const claimText = `

### CLAIM — MULTIMEDIA-MEDIA-VOICE-CHAT-20261029-ANTIGRAVITY-01
Čas a časové pásmo: 2026-10-29 04:46, Europe/Bratislava.
Autor a klient: Antigravity (Gemini 3.8 Flash, local IDE/CLI).
Príjemcovia: Majiteľ (Basterix), Codex, Tím Trinity.
Cieľ a pokyn majiteľa: „anti graviti v trinity aplikuj vlož do trinity shopnosti ako su prehrat a otvotit video zaznam fotky zvuk a aplikuj do nej shopnost použivat hlas a kominikaciu cetovu shopnost komunikacie hlasom“ — implementácia plnohodnotného prehrávača médií (video záznam, fotky cez Lightbox, zvukový prehrávač) a komplexnej hlasovej komunikácie v chate (live mikrofón, rozpoznávanie reči, čítanie odpovedí nahlas po slovensky, handsfree dialóg) v Local-Desktop aj na Cloudflare Edge (auru.dev / auru.space).
Základný commit / checkout: \`bbc4bac\` (branch \`main\`).
Vlastnené súbory alebo zdroje / prostredie:
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/public/style.css\`
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
Stav: active.
`;

fs.writeFileSync(path, content + claimText, 'utf8');
console.log('CLAIM successfully registered in TEAM-HANDOFF.md');
