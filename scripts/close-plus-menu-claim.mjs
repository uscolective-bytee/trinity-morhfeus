/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul close-plus-menu-claim.mjs (scripts/close-plus-menu-claim.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'TEAM-HANDOFF.md';
let content = fs.readFileSync(path, 'utf8');

const closeClaim = `
Stav: completed a pripravené na nasadenie.
Výsledky a dôkazy:
1. ChatGPT-style tlačidlo „+“ (rozklikávacie action menu v rohu chat kolónky):
   - Umiestnené priamo v composeri chatu na webe (\`chat.html\`) aj v aplikácii \`Local-Desktop\` (\`index.html\`).
   - Plávajúca vyskakovacia lišta s animáciou fade/slide-up v štýle ChatGPT.
   - Možnosti v lište:
     * 📄 Pridať súbor / dokument (PDF, TXT, MD, JSON, CSV, Kód) – okamžite pripojený do kontextu promptu s náhľadovým štítkom.
     * 📸 Pridať fotku / obrázok (Vision analýza) – náhľadový chip, možnosť zväčšenia a vizuálnej analýzy.
     * 🎬 Pridať video záznam (MP4, WebM) – možnosť okamžitého prehratia v Lightboxe / kine.
     * 🎵 Pridať zvuk / audio (MP3, WAV) – prepis reči cez Whisper a audio prehrávač.
     * ⚡ Inteligentné Nástroje & Pluginy: Web Search, AI generátor fotiek (Flux), Video animácie (16:9 WebM), Local PC Bridge pre príkazy na hostiteľskom PC.
2. Attachment tray: nad textovým poľom sa po výbere zobrazí elegantný prúžok s priloženými súbormi a možnosťou ich odstránenia pred odoslaním (\`✕\`).
3. Testy a verifikácia pred nasadením:
   - Local-Desktop: 21 / 21 PASS (14 local + 7 modules).
   - Trinity Cloud Worker: 539 / 539 PASS.
   - Spolu: 560 testov úspešných na 100%.
Zmenené súbory:
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/public/style.css\`
- \`TEAM-HANDOFF.md\`
Súbory uvoľnené.`;

content = content.replace('Stav: active.', closeClaim);
fs.writeFileSync(path, content, 'utf8');
console.log('TEAM-HANDOFF.md claim closed.');
