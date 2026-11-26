/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul apply-plus-menu-trinity.mjs (scripts/apply-plus-menu-trinity.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. Update Trinity/public/assistant/chat.html
{
  let raw = fs.readFileSync('Trinity/public/assistant/chat.html', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let html = normalize(raw);

  // Add attachment tray above textarea
  const textareaMarker = `<textarea id="message" rows="2" maxlength="12000" required data-placeholder="placeholder" placeholder="Zadaj úlohu pre Trinity (napr. Vytvor web, Spravuj domény, Priprav platbu, PC akcia)…"></textarea>`;
  const attachmentTrayHtml = `<div id="composer-attachment-tray" class="composer-attachment-tray" hidden></div>\n${textareaMarker}`;

  if (!html.includes('id="composer-attachment-tray"')) {
    html = html.replace(textareaMarker, attachmentTrayHtml);
  }

  // Add plus menu container before engine select in compose-settings
  const composeSettingsMarker = `<div class="compose-settings"><select id="engine" aria-label="AI engine">`;
  const plusMenuHtml = `<div class="compose-settings">
<div class="chat-plus-container">
  <button id="chat-plus-btn" type="button" class="chat-plus-btn" aria-label="Pridať prílohu alebo nástroj" title="Pridať súbor, fotku, video, zvuk alebo nástroj">+</button>
  <div id="chat-plus-menu" class="chat-plus-menu" hidden>
    <div class="plus-menu-header">
      <span class="plus-menu-title">Pridať do rozhovoru</span>
      <span class="plus-menu-subtitle">Nástroje & Prílohy Trinity</span>
    </div>
    <div class="plus-menu-items">
      <button type="button" class="plus-item" id="plus-opt-file">
        <span class="plus-item-icon">📄</span>
        <div class="plus-item-text">
          <b>Pridať súbor / dokument</b>
          <small>PDF, TXT, MD, JSON, CSV, Kód</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-photo">
        <span class="plus-item-icon">📸</span>
        <div class="plus-item-text">
          <b>Pridať fotku / obrázok</b>
          <small>PNG, JPG, WebP · Vision analýza</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-video">
        <span class="plus-item-icon">🎬</span>
        <div class="plus-item-text">
          <b>Pridať video záznam</b>
          <small>MP4, WebM · Prehratie a rozbor</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-audio">
        <span class="plus-item-icon">🎵</span>
        <div class="plus-item-text">
          <b>Pridať zvuk / nahrávku</b>
          <small>MP3, WAV · Prepis reči Whisper</small>
        </div>
      </button>
      <div class="plus-menu-divider"></div>
      <div class="plus-menu-section-title">⚡ Inteligentné Nástroje & Pluginy</div>
      <button type="button" class="plus-item" id="plus-opt-tool-web">
        <span class="plus-item-icon">🌐</span>
        <div class="plus-item-text">
          <b>Web Search & Prieskum</b>
          <small>Živé internetové hľadanie zdrojov</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-tool-imagegen">
        <span class="plus-item-icon">🎨</span>
        <div class="plus-item-text">
          <b>Generovať AI fotku / obrázok</b>
          <small>Black Forest Flux 1 Schnell</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-tool-videogen">
        <span class="plus-item-icon">🎥</span>
        <div class="plus-item-text">
          <b>Generovať AI video (16:9 WebM)</b>
          <small>Multimediálne filmové štúdio</small>
        </div>
      </button>
      <button type="button" class="plus-item" id="plus-opt-tool-pc">
        <span class="plus-item-icon">💻</span>
        <div class="plus-item-text">
          <b>Local PC Bridge (Hostiteľ)</b>
          <small>Príkazy, skripty a súbory na PC</small>
        </div>
      </button>
    </div>
  </div>
</div>
<select id="engine" aria-label="AI engine">`;

  if (!html.includes('id="chat-plus-btn"')) {
    html = html.replace(composeSettingsMarker, plusMenuHtml);
  }

  // Add file and video inputs
  const inputsMarker = `<input id="image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden><input id="audio-input" type="file" accept="audio/*" hidden>`;
  const inputsReplacement = `<input id="image-input" type="file" accept="image/png,image/jpeg,image/webp" hidden><input id="audio-input" type="file" accept="audio/*" hidden><input id="file-doc-input" type="file" accept=".pdf,.doc,.docx,.txt,.md,.json,.js,.py,.csv,.zip,.html,.css" hidden><input id="file-video-input" type="file" accept="video/mp4,video/webm,video/quicktime" hidden>`;

  if (!html.includes('id="file-doc-input"')) {
    html = html.replace(inputsMarker, inputsReplacement);
  }

  fs.writeFileSync('Trinity/public/assistant/chat.html', isCrlf ? html.replace(/\n/g, '\r\n') : html, 'utf8');
  console.log('[1/3] Trinity chat.html updated with ChatGPT-style plus menu and inputs.');
}

// 2. Update Trinity/public/assistant/builder.css
{
  let raw = fs.readFileSync('Trinity/public/assistant/builder.css', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let css = normalize(raw);

  const plusMenuStyles = `
/* ChatGPT-Style Plus Menu & Attachments */
.chat-plus-container{position:relative;display:inline-flex;align-items:center}
.chat-plus-btn{width:34px;height:34px;min-width:34px;border-radius:50%!important;background:#1e293b!important;color:#f8fafc!important;border:1px solid #475569!important;padding:0!important;font-size:22px!important;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.chat-plus-btn:hover{background:#334155!important;border-color:#38bdf8!important;color:#38bdf8!important;transform:scale(1.06)}
.chat-plus-btn.open{transform:rotate(45deg);background:#38bdf8!important;color:#020617!important;border-color:#38bdf8!important}

.chat-plus-menu{position:absolute;bottom:calc(100% + 10px);left:0;min-width:285px;max-width:320px;background:#0f172a;border:1px solid #334155;border-radius:16px;padding:8px;z-index:99999;box-shadow:0 20px 45px rgba(0,0,0,.75),0 0 1px 1px rgba(255,255,255,.08);backdrop-filter:blur(14px);animation:plusMenuSlideUp .18s cubic-bezier(.16,1,.3,1)}
@keyframes plusMenuSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.chat-plus-menu[hidden]{display:none!important}

.plus-menu-header{padding:6px 10px 8px;border-bottom:1px solid #1e293b;display:flex;flex-direction:column;gap:2px}
.plus-menu-title{font-size:12px;font-weight:700;color:#f8fafc;letter-spacing:.3px}
.plus-menu-subtitle{font-size:10px;color:#94a3b8}

.plus-menu-items{display:flex;flex-direction:column;gap:3px;margin-top:6px;max-height:360px;overflow-y:auto}
.plus-item{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border-radius:10px;border:none!important;background:transparent!important;color:#f8fafc!important;cursor:pointer;text-align:left;transition:all .15s ease}
.plus-item:hover{background:#1e293b!important;color:#38bdf8!important;transform:translateX(2px)}
.plus-item-icon{font-size:16px;min-width:22px;display:flex;align-items:center;justify-content:center}
.plus-item-text{display:flex;flex-direction:column;gap:1px}
.plus-item-text b{font-size:11.5px;color:#f8fafc;font-weight:600}
.plus-item-text small{font-size:9.5px;color:#94a3b8}
.plus-item:hover .plus-item-text b{color:#38bdf8}

.plus-menu-divider{height:1px;background:#1e293b;margin:5px 6px}
.plus-menu-section-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#38bdf8;padding:4px 10px;font-weight:700}

.composer-attachment-tray{display:flex;gap:8px;flex-wrap:wrap;padding:6px 0;margin-bottom:4px}
.composer-attachment-tray[hidden]{display:none!important}
.attachment-chip{display:inline-flex;align-items:center;gap:6px;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:4px 8px;font-size:11px;color:#f8fafc;max-width:280px}
.attachment-chip img{width:22px;height:22px;object-fit:cover;border-radius:4px}
.attachment-chip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.attachment-chip-remove{background:transparent;border:none;color:#94a3b8;font-size:12px;cursor:pointer;padding:0 2px;margin-left:4px}
.attachment-chip-remove:hover{color:#ef4444}
`;

  if (!css.includes('.chat-plus-btn')) {
    css += '\n' + plusMenuStyles;
    fs.writeFileSync('Trinity/public/assistant/builder.css', isCrlf ? css.replace(/\n/g, '\r\n') : css, 'utf8');
    console.log('[2/3] Trinity builder.css updated with plus menu styles.');
  } else {
    console.log('[2/3] Trinity builder.css already contains plus menu styles.');
  }
}

// 3. Update Trinity/public/assistant/chat.js.txt
{
  let raw = fs.readFileSync('Trinity/public/assistant/chat.js.txt', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let js = normalize(raw);

  const plusMenuLogic = `
// ChatGPT-Style Plus Menu & Attachments Controller
let activeAttachments = [];

function renderAttachmentTray(){
  const tray = $('composer-attachment-tray');
  if(!tray) return;
  if(!activeAttachments.length){
    tray.hidden = true;
    tray.innerHTML = '';
    return;
  }
  tray.hidden = false;
  tray.innerHTML = '';
  activeAttachments.forEach((att, idx) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    if(att.type === 'photo' && att.dataUrl){
      chip.innerHTML = \`<img src="\${att.dataUrl}" alt="Náhľad"><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť prílohu">✕</button>\`;
    } else if(att.type === 'video'){
      chip.innerHTML = \`<span>🎬</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    } else if(att.type === 'audio'){
      chip.innerHTML = \`<span>🎵</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    } else {
      chip.innerHTML = \`<span>📄</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    }
    chip.querySelector('.attachment-chip-remove').onclick = () => {
      activeAttachments.splice(idx, 1);
      renderAttachmentTray();
    };
    tray.append(chip);
  });
}

function initChatPlusMenu(){
  const btn = $('chat-plus-btn');
  const menu = $('chat-plus-menu');
  if(!btn || !menu) return;

  function toggleMenu(force){
    const show = typeof force === 'boolean' ? force : menu.hidden;
    menu.hidden = !show;
    btn.classList.toggle('open', show);
  }

  btn.onclick = (e) => {
    e.stopPropagation();
    toggleMenu();
  };

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if(!menu.hidden && !menu.contains(e.target) && e.target !== btn){
      toggleMenu(false);
    }
  });

  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !menu.hidden){
      toggleMenu(false);
    }
  });

  // 1. Pridať súbor / dokument
  $('plus-opt-file')?.addEventListener('click', () => {
    toggleMenu(false);
    const fi = $('file-doc-input');
    if(fi){ fi.value = ''; fi.click(); }
  });

  $('file-doc-input')?.addEventListener('change', async () => {
    const file = $('file-doc-input').files[0];
    if(!file) return;
    if(file.size > 10_000_000){
      notice('Súbor je príliš veľký (max 10 MB).');
      return;
    }
    notice(\`Načítavam súbor \${file.name}…\`);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        activeAttachments.push({
          type: 'file',
          name: file.name,
          size: file.size,
          content: typeof reader.result === 'string' ? reader.result : ''
        });
        renderAttachmentTray();
        notice(\`Súbor \${file.name} bol pripojený do kontextu.\`, true);
      };
      if(file.type.includes('text') || /\\.(txt|md|json|js|mjs|py|csv|html|css|yaml|yml|xml|sql)$/i.test(file.name)){
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    } catch(err){
      notice('Chyba pri čítaní súboru: ' + err.message);
    }
  });

  // 2. Pridať fotku / obrázok
  $('plus-opt-photo')?.addEventListener('click', () => {
    toggleMenu(false);
    const ii = $('image-input');
    if(ii){ ii.value = ''; ii.click(); }
  });

  // 3. Pridať video
  $('plus-opt-video')?.addEventListener('click', () => {
    toggleMenu(false);
    const vi = $('file-video-input');
    if(vi){ vi.value = ''; vi.click(); }
  });

  $('file-video-input')?.addEventListener('change', async () => {
    const file = $('file-video-input').files[0];
    if(!file) return;
    if(file.size > 30_000_000){
      notice('Video môže mať najviac 30 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    activeAttachments.push({
      type: 'video',
      name: file.name,
      size: file.size,
      src: url
    });
    renderAttachmentTray();
    notice(\`Video záznam \${file.name} priložený.\`, true);
  });

  // 4. Pridať zvuk / audio
  $('plus-opt-audio')?.addEventListener('click', () => {
    toggleMenu(false);
    const ai = $('audio-input');
    if(ai){ ai.value = ''; ai.click(); }
  });

  // 5. Nástroje & Pluginy
  $('plus-opt-tool-web')?.addEventListener('click', () => {
    toggleMenu(false);
    const msg = $('message');
    if(msg){
      msg.value = 'Vyhľadaj na internete najnovšie overené informácie a fakty o: ' + (msg.value || '');
      msg.focus();
    }
    notice('Nástroj Web Search aktivovaný.');
  });

  $('plus-opt-tool-imagegen')?.addEventListener('click', () => {
    toggleMenu(false);
    const msg = $('message');
    if(msg){
      msg.value = 'Vytvor fotku / obrázok vo vysokej kvalite: ' + (msg.value || '');
      msg.focus();
    }
    notice('Generátor obrázkov (Flux) aktivovaný.');
  });

  $('plus-opt-tool-videogen')?.addEventListener('click', () => {
    toggleMenu(false);
    const msg = $('message');
    if(msg){
      msg.value = 'Vytvor 16:9 animované video s titulkami na tému: ' + (msg.value || '');
      msg.focus();
    }
    notice('Filmové video štúdio pripravené.');
  });

  $('plus-opt-tool-pc')?.addEventListener('click', () => {
    toggleMenu(false);
    const eng = $('engine');
    if(eng) eng.value = 'local';
    const msg = $('message');
    if(msg){
      msg.value = 'Spusti na hostiteľskom PC príkaz: ' + (msg.value || '');
      msg.focus();
    }
    notice('Režim PC Bridge aktivovaný.');
  });
}
`;

  // Attach submit interceptor to prepend attachments to message
  const submitTarget = `$('chat-form').onsubmit=safe(async event=>{`;
  const submitAddition = `$('chat-form').onsubmit=safe(async event=>{
  // Prepend active attachments to message text
  if(activeAttachments.length){
    let attachmentText = '';
    for(const att of activeAttachments){
      if(att.type === 'file' && att.content){
        attachmentText += \`\\n[Priložený súbor: \${att.name}]\\nObsah:\\n\${att.content.slice(0, 8000)}\\n\\n\`;
      } else if(att.type === 'video'){
        attachmentText += \`\\n[Priložený video záznam: \${att.name}]\\n\`;
      }
    }
    if(attachmentText){
      $('message').value = attachmentText + $('message').value;
      activeAttachments = [];
      renderAttachmentTray();
    }
  }`;

  if (!js.includes('initChatPlusMenu')) {
    js = js + '\n' + plusMenuLogic;
    js += '\ninitChatPlusMenu();\n';
    if(js.includes(submitTarget)){
      js = js.replace(submitTarget, submitAddition);
    }
    fs.writeFileSync('Trinity/public/assistant/chat.js.txt', isCrlf ? js.replace(/\n/g, '\r\n') : js, 'utf8');
    console.log('[3/3] Trinity chat.js.txt updated with plus menu logic and attachment handling.');
  } else {
    console.log('[3/3] Trinity chat.js.txt already contains initChatPlusMenu.');
  }
}
