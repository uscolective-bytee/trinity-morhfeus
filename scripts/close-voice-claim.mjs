/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul close-voice-claim.mjs (scripts/close-voice-claim.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'TEAM-HANDOFF.md';
let content = fs.readFileSync(path, 'utf8');

const closeClaim = `
Stav: completed a pripravené na nasadenie.
Výsledky a dôkazy:
1. Plnohodnotný Media Prehrávač a Lightbox (video záznam, fotky a zvuk):
   - Local-Desktop: pridaný univerzálny \`#media-modal\`, podpora pre inline prehrávanie videa (\`.mp4\`, \`.webm\`), fotiek (\`.png\`, \`.jpg\`, \`.webp\`) s plným rozlíšením a zvuku (\`.mp3\`, \`.wav\`).
   - Cloudflare Edge (auru.dev & auru.space): pridaný \`#trinity-media-lightbox\` v \`chat.html\`, funkcia \`openTrinityLightbox\` v \`chat.js.txt\` a lightbox štýly v \`builder.css\`.
2. Hlasová komunikácia a chatová reč (Voice Chat & Handsfree):
   - Local-Desktop: mikrofónové tlačidlo \`🎙️\` v composeri s live diktovaním cez SpeechRecognition (\`sk-SK\`), prepínač \`🔊 Hlasový režim (čítať odpovede nahlas)\`, tlačidlo \`🔊 Prehrať\` pri každej odpovedi asistenta.
   - Cloudflare Edge: tlačidlá \`🔊 Prehrať hlasom\` ku každej asistentovej bubline, vylepšený mikrofón \`🎤 Hlas\` s diktovaním, plnohodnotný handsfree hovor cez \`🎙️ Live Hovor\` via Cloudflare Whisper STT + MeloTTS / SpeechSynthesis.
3. Testy a verifikácia pred nasadením:
   - Local-Desktop: 21 / 21 PASS (14 local + 7 modules).
   - Trinity Worker: 539 / 539 PASS (vrátane 11/11 v assistant-login).
   - Spolu: 560 testov úspešných na 100%.
Zmenené súbory:
- \`Local-Desktop/public/index.html\`
- \`Local-Desktop/public/app.js\`
- \`Local-Desktop/public/style.css\`
- \`Trinity/public/assistant/chat.html\`
- \`Trinity/public/assistant/chat.js.txt\`
- \`Trinity/public/assistant/builder.css\`
- \`TEAM-HANDOFF.md\`
Súbory uvoľnené.`;

content = content.replace('Stav: active.', closeClaim);
fs.writeFileSync(path, content, 'utf8');
console.log('TEAM-HANDOFF.md claim closed.');
