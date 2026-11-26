/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul update-team-handoff.mjs (scripts/update-team-handoff.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'TEAM-HANDOFF.md';
let content = fs.readFileSync(path, 'utf8');

const closeClaim = `### CLAIM — APP-HUB-OWNER-APPROVALS-20261028-ANTIGRAVITY-01
Čas a časové pásmo: 2026-10-28 18:25 – 23:30, Europe/Bratislava.
Autor a klient: Antigravity (Gemini 3.8 Flash, local IDE/CLI).
Príjemcovia: Majiteľ (Basterix), Codex, Tím Trinity.
Cieľ a pokyn majiteľa: „potrebujem abi si navitvaral taketo prepojnie priamo do aplikacie trinity co mam na desktope ciže na auru.dev uplne spravit take prostredie ake mas ti napojenie na aplikacie auth cey moje potvrdenie atd“ a „aktuaollizuj sa a poprepajaj a uplne aktualizuj triniti“.
Stav: completed a pripravené na nasadenie.
Výsledky a dôkazy:
1. Vytvorený App Hub a rozhranie prepojených aplikácií na \`https://auru.dev\` aj v \`Local-Desktop\` (Telegram Bot, GitHub, Google Workspace, X/Twitter, Meta, PC Bridge a Microsoft Copilot Studio Trinitys).
2. Interaktívne Guarded Action schvaľovacie karty: zápisy, commity, odosielanie emailov ani zmeny súborov nevstúpia do siete bez výslovného kliknutia majiteľa na \`[⚡ Schváliť a vykonať]\`.
3. Integrácia agenta Trinitys (Microsoft Copilot Studio): Bot ID \`767f155a-5b45-15fc-17b1-e4d712682945\`, Env ID \`b2ffa450-7427-e2dd-89dd-7df6a8c0a149\`, Object ID \`d77169b1-e300-42da-88c3-e8df11b82604\`, M365 Tenant \`usc31@saboivan2008gmail.onmicrosoft.com\` a osobný účet \`saboivan2008@gmail.com\`.
4. Priame prepojenie na Zdieľaný Copilot Chat (Share ID \`d6114d11-9316-4428-b409-b61541cbb757\`, Konverzácia \`24140b7a-2679-41db-bd3b-3e45db731263\`).
5. Reakcia na nález Codexu (MCP-APPROVAL-20261028-CODEX-01): \`approve_system_action\` a \`reject_system_action\` v \`Trinity/src/mcp.js\` boli sprísnené – vyžadujú zhodu \`confirmation\` UUID s ID akcie a striktné overenie \`access.admin\` / \`access.projectControl\`. Žiadna akcia nemôže byť anonymne autorizovaná cez MCP.
6. Testy pred nasadením:
   - \`Local-Desktop/tests/local.test.mjs\`: 14 / 14 PASS.
   - \`Local-Desktop/tests/modules.test.mjs\`: 7 / 7 PASS.
   - \`Trinity\` unit testy (539 testov): 539 / 539 PASS.
   - Spolu: 560 testov úspešných na 100%.
Zmenené súbory:
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
- \`Trinity/src/mcp.js\`
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/server.mjs\`
- \`Local-Desktop/modules/microsoft-graph.mjs\`
- \`Local-Desktop/Data/settings.json\`
- \`Local-Desktop/tests/local.test.mjs\`
- \`Local-Desktop/tests/modules.test.mjs\`
- \`TEAM-HANDOFF.md\`
Súbory uvoľnené.`;

const claimTarget = `### CLAIM — APP-HUB-OWNER-APPROVALS-20261028-ANTIGRAVITY-01
Čas a časové pásmo: 2026-10-28 18:25, Europe/Bratislava.
Autor a klient: Antigravity (Gemini 3.8 Flash, local IDE/CLI).
Príjemcovia: Majiteľ (Basterix), Codex, Tím Trinity.
Cieľ a pokyn majiteľa: „potrebujem abi si navitvaral taketo prepojnie priamo do aplikacie trinity co mam na desktope ciže na auru.dev uplne spravit take prostredie ake mas ti napojenie na aplikacie auth cey moje potvrdenie atd“ — vytvorenie App Hubu (Telegram, Google Workspace, GitHub, X/Twitter, Meta, Discord, Slack, PC Bridge) a interaktívnych schvaľovacích kariet (Guarded Action Auth cez potvrdenie majiteľa) priamo v Omni-Dev Studiu na auru.dev aj v Local-Desktop aplikácii.
Základný commit / checkout: \`8510a34\` (branch \`main\`).
Vlastnené súbory alebo zdroje / prostredie:
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
- \`Trinity/src/index.js\`
- \`Trinity/src/system-actions.js\`
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/public/style.css\`
- \`Local-Desktop/server.mjs\`
Stav: active.`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = claimTarget.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const isCrlf = content.includes('\r\n');
  const patched = normContent.replace(normTarget, closeClaim);
  fs.writeFileSync(path, isCrlf ? patched.replace(/\n/g, '\r\n') : patched, 'utf8');
  console.log('TEAM-HANDOFF.md successfully updated and claim closed.');
} else {
  console.log('Target not found in TEAM-HANDOFF.md, appending update to end.');
  fs.writeFileSync(path, content + '\n\n' + closeClaim + '\n', 'utf8');
}
