/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul apply-plus-menu-desktop.mjs (scripts/apply-plus-menu-desktop.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. Update Local-Desktop/public/index.html
{
  let raw = fs.readFileSync('Local-Desktop/public/index.html', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let html = normalize(raw);

  // Add attachment tray above composer
  const composerStartMarker = `<div class="composer">`;
  const trayAddition = `<div id="desktop-attachment-tray" class="composer-attachment-tray" hidden></div>\n<div class="composer">
  <div class="chat-plus-container">
    <button id="desktop-plus-btn" type="button" class="chat-plus-btn" aria-label="Pridať prílohu alebo nástroj" title="Pridať súbor, fotku, video, zvuk alebo nástroj">+</button>
    <div id="desktop-plus-menu" class="chat-plus-menu" hidden>
      <div class="plus-menu-header">
        <span class="plus-menu-title">Pridať do rozhovoru</span>
        <span class="plus-menu-subtitle">Nástroje & Prílohy Trinity</span>
      </div>
      <div class="plus-menu-items">
        <button type="button" class="plus-item" id="dplus-opt-file">
          <span class="plus-item-icon">📄</span>
          <div class="plus-item-text">
            <b>Pridať súbor / kód</b>
            <small>PDF, TXT, MD, JSON, CSV, Kód</small>
          </div>
        </button>
        <button type="button" class="plus-item" id="dplus-opt-photo">
          <span class="plus-item-icon">📸</span>
          <div class="plus-item-text">
            <b>Pridať fotku / obrázok</b>
            <small>PNG, JPG, WebP · Náhľad & Detail</small>
          </div>
        </button>
        <button type="button" class="plus-item" id="dplus-opt-video">
          <span class="plus-item-icon">🎬</span>
          <div class="plus-item-text">
            <b>Pridať video záznam</b>
            <small>MP4, WebM · Prehrávač médií</small>
          </div>
        </button>
        <button type="button" class="plus-item" id="dplus-opt-audio">
          <span class="plus-item-icon">🎵</span>
          <div class="plus-item-text">
            <b>Pridať zvuk / nahrávku</b>
            <small>MP3, WAV · Zvukový prehrávač</small>
          </div>
        </button>
        <div class="plus-menu-divider"></div>
        <div class="plus-menu-section-title">⚡ Nástroje & Pluginy</div>
        <button type="button" class="plus-item" id="dplus-opt-workspace">
          <span class="plus-item-icon">📂</span>
          <div class="plus-item-text">
            <b>Workspace Súbory</b>
            <small>Prezerať a upravovať lokálne súbory</small>
          </div>
        </button>
        <button type="button" class="plus-item" id="dplus-opt-notes">
          <span class="plus-item-icon">◇</span>
          <div class="plus-item-text">
            <b>Trvalá Pamäť</b>
            <small>Zobraziť a zapísať poznámku</small>
          </div>
        </button>
        <button type="button" class="plus-item" id="dplus-opt-gateway">
          <span class="plus-item-icon">💻</span>
          <div class="plus-item-text">
            <b>PC Bridge & Stav</b>
            <small>Hardvérová telemetria počítača</small>
          </div>
        </button>
      </div>
    </div>
  </div>`;

  if (!html.includes('id="desktop-plus-btn"')) {
    html = html.replace(composerStartMarker, trayAddition);
  }

  // Add hidden inputs before </form>
  const formEndMarker = `</form>`;
  const inputsHtml = `
<input id="desktop-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.md,.json,.js,.py,.csv,.zip,.html,.css" hidden>
<input id="desktop-photo-input" type="file" accept="image/*" hidden>
<input id="desktop-video-input" type="file" accept="video/*" hidden>
<input id="desktop-audio-input" type="file" accept="audio/*" hidden>
</form>`;

  if (!html.includes('id="desktop-file-input"')) {
    html = html.replace(formEndMarker, inputsHtml);
  }

  fs.writeFileSync('Local-Desktop/public/index.html', isCrlf ? html.replace(/\n/g, '\r\n') : html, 'utf8');
  console.log('[1/3] Local-Desktop index.html updated with desktop plus menu.');
}

// 2. Update Local-Desktop/public/style.css
{
  let raw = fs.readFileSync('Local-Desktop/public/style.css', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let css = normalize(raw);

  const desktopPlusStyles = `
/* Desktop ChatGPT-Style Plus Menu */
.chat-plus-container{position:relative;display:inline-flex;align-items:center}
.chat-plus-btn{width:34px;height:34px;min-width:34px;border-radius:50%!important;background:#182230!important;color:#80e5cb!important;border:1px solid #384655!important;padding:0!important;font-size:20px!important;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease;box-shadow:0 2px 5px rgba(0,0,0,.3)}
.chat-plus-btn:hover{background:#233246!important;border-color:#80e5cb!important;transform:scale(1.06)}
.chat-plus-btn.open{transform:rotate(45deg);background:#80e5cb!important;color:#0c1016!important;border-color:#80e5cb!important}

.chat-plus-menu{position:absolute;bottom:calc(100% + 10px);left:0;min-width:280px;max-width:320px;background:#131c28;border:1px solid #2a394a;border-radius:14px;padding:8px;z-index:99999;box-shadow:0 18px 40px rgba(0,0,0,.7);backdrop-filter:blur(10px);animation:desktopPlusFade .18s ease-out}
@keyframes desktopPlusFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.chat-plus-menu[hidden]{display:none!important}

.plus-menu-header{padding:6px 10px 8px;border-bottom:1px solid #1e2c3d;display:flex;flex-direction:column;gap:2px}
.plus-menu-title{font-size:12px;font-weight:700;color:#e8eef4}
.plus-menu-subtitle{font-size:10px;color:#8c9aa9}

.plus-menu-items{display:flex;flex-direction:column;gap:3px;margin-top:6px;max-height:340px;overflow-y:auto}
.plus-item{display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;border-radius:8px;border:none!important;background:transparent!important;color:#e8eef4!important;cursor:pointer;text-align:left;transition:all .15s ease}
.plus-item:hover{background:#1a2838!important;color:#80e5cb!important;transform:translateX(2px)}
.plus-item-icon{font-size:16px;min-width:22px;display:flex;align-items:center;justify-content:center}
.plus-item-text{display:flex;flex-direction:column;gap:1px}
.plus-item-text b{font-size:11.5px;color:#e8eef4;font-weight:600}
.plus-item-text small{font-size:9.5px;color:#8c9aa9}
.plus-item:hover .plus-item-text b{color:#80e5cb}

.plus-menu-divider{height:1px;background:#1e2c3d;margin:5px 6px}
.plus-menu-section-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#80e5cb;padding:4px 10px;font-weight:700}

.composer-attachment-tray{display:flex;gap:8px;flex-wrap:wrap;padding:6px 0;margin-bottom:6px}
.composer-attachment-tray[hidden]{display:none!important}
.attachment-chip{display:inline-flex;align-items:center;gap:6px;background:#182432;border:1px solid #2e4156;border-radius:8px;padding:4px 8px;font-size:11px;color:#e8eef4;max-width:280px}
.attachment-chip img{width:22px;height:22px;object-fit:cover;border-radius:4px}
.attachment-chip-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.attachment-chip-remove{background:transparent;border:none;color:#8c9aa9;font-size:12px;cursor:pointer;padding:0 2px;margin-left:4px}
.attachment-chip-remove:hover{color:#f43f5e}
`;

  if (!css.includes('.chat-plus-container')) {
    css += '\n' + desktopPlusStyles;
    fs.writeFileSync('Local-Desktop/public/style.css', isCrlf ? css.replace(/\n/g, '\r\n') : css, 'utf8');
    console.log('[2/3] Local-Desktop style.css updated with plus menu styles.');
  } else {
    console.log('[2/3] Local-Desktop style.css already has plus menu styles.');
  }
}

// 3. Update Local-Desktop/public/app.js
{
  let raw = fs.readFileSync('Local-Desktop/public/app.js', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let appJs = normalize(raw);

  const desktopPlusLogic = `
// Local-Desktop ChatGPT-Style Plus Menu & Attachments Controller
let desktopAttachments = [];

function renderDesktopAttachmentTray(){
  const tray = $('desktop-attachment-tray');
  if(!tray) return;
  if(!desktopAttachments.length){
    tray.hidden = true;
    tray.innerHTML = '';
    return;
  }
  tray.hidden = false;
  tray.innerHTML = '';
  desktopAttachments.forEach((att, idx) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';
    if(att.type === 'photo' && att.dataUrl){
      chip.innerHTML = \`<img src="\${att.dataUrl}" alt="Náhľad"><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    } else if(att.type === 'video'){
      chip.innerHTML = \`<span>🎬</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    } else if(att.type === 'audio'){
      chip.innerHTML = \`<span>🎵</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    } else {
      chip.innerHTML = \`<span>📄</span><span class="attachment-chip-name">\${att.name}</span><button type="button" class="attachment-chip-remove" title="Odstrániť">✕</button>\`;
    }
    chip.querySelector('.attachment-chip-remove').onclick = () => {
      desktopAttachments.splice(idx, 1);
      renderDesktopAttachmentTray();
    };
    tray.append(chip);
  });
}

function initDesktopPlusMenu(){
  const btn = $('desktop-plus-btn');
  const menu = $('desktop-plus-menu');
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

  // 1. Súbor
  $('dplus-opt-file')?.addEventListener('click', () => {
    toggleMenu(false);
    const fi = $('desktop-file-input');
    if(fi){ fi.value = ''; fi.click(); }
  });

  $('desktop-file-input')?.addEventListener('change', async () => {
    const file = $('desktop-file-input').files[0];
    if(!file) return;
    notice(\`Načítavam súbor \${file.name}…\`);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        desktopAttachments.push({
          type: 'file',
          name: file.name,
          size: file.size,
          content: typeof reader.result === 'string' ? reader.result : ''
        });
        renderDesktopAttachmentTray();
        notice(\`Súbor \${file.name} pripojený do kontextu.\`, true);
      };
      reader.readAsText(file);
    } catch(err){
      notice('Chyba pri čítaní súboru: ' + err.message);
    }
  });

  // 2. Fotka
  $('dplus-opt-photo')?.addEventListener('click', () => {
    toggleMenu(false);
    const pi = $('desktop-photo-input');
    if(pi){ pi.value = ''; pi.click(); }
  });

  $('desktop-photo-input')?.addEventListener('change', async () => {
    const file = $('desktop-photo-input').files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      desktopAttachments.push({
        type: 'photo',
        name: file.name,
        size: file.size,
        dataUrl: reader.result
      });
      renderDesktopAttachmentTray();
      notice(\`Fotka \${file.name} pripravená.\`, true);
    };
    reader.readAsDataURL(file);
  });

  // 3. Video
  $('dplus-opt-video')?.addEventListener('click', () => {
    toggleMenu(false);
    const vi = $('desktop-video-input');
    if(vi){ vi.value = ''; vi.click(); }
  });

  $('desktop-video-input')?.addEventListener('change', async () => {
    const file = $('desktop-video-input').files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    desktopAttachments.push({
      type: 'video',
      name: file.name,
      size: file.size,
      src: url
    });
    renderDesktopAttachmentTray();
    notice(\`Video záznam \${file.name} pripojený.\`, true);
  });

  // 4. Audio
  $('dplus-opt-audio')?.addEventListener('click', () => {
    toggleMenu(false);
    const ai = $('desktop-audio-input');
    if(ai){ ai.value = ''; ai.click(); }
  });

  $('desktop-audio-input')?.addEventListener('change', async () => {
    const file = $('desktop-audio-input').files[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    desktopAttachments.push({
      type: 'audio',
      name: file.name,
      size: file.size,
      src: url
    });
    renderDesktopAttachmentTray();
    notice(\`Zvukový záznam \${file.name} pripravený.\`, true);
  });

  // 5. Nástroje
  $('dplus-opt-workspace')?.addEventListener('click', () => {
    toggleMenu(false);
    switchView('files');
  });

  $('dplus-opt-notes')?.addEventListener('click', () => {
    toggleMenu(false);
    switchView('notes');
  });

  $('dplus-opt-gateway')?.addEventListener('click', () => {
    toggleMenu(false);
    switchView('connections');
  });
}
initDesktopPlusMenu();
`;

  // Intercept chat-form submit in Local-Desktop to prepend attachments
  const chatFormSubmitMarker = `$('chat-form').addEventListener('submit',protect(async event=>{event.preventDefault();if(pending)return;`;
  const chatFormSubmitAddition = `$('chat-form').addEventListener('submit',protect(async event=>{event.preventDefault();if(pending)return;
  if(desktopAttachments.length){
    let attText = '';
    for(const att of desktopAttachments){
      if(att.type === 'file' && att.content){
        attText += \`\\n[Priložený súbor: \${att.name}]\\nObsah:\\n\${att.content.slice(0, 8000)}\\n\\n\`;
      } else if(att.type === 'photo' && att.dataUrl){
        attText += \`\\n[Priložená fotka: \${att.name}] \${att.dataUrl}\\n\`;
      } else if(att.type === 'video' && att.src){
        attText += \`\\n[Priložené video: \${att.name}] \${att.src}\\n\`;
      } else if(att.type === 'audio' && att.src){
        attText += \`\\n[Priložený zvuk: \${att.name}] \${att.src}\\n\`;
      }
    }
    if(attText){
      $('message').value = attText + $('message').value;
      desktopAttachments = [];
      renderDesktopAttachmentTray();
    }
  }`;

  if (!appJs.includes('initDesktopPlusMenu')) {
    appJs += '\n' + desktopPlusLogic;
    if (appJs.includes(chatFormSubmitMarker)) {
      appJs = appJs.replace(chatFormSubmitMarker, chatFormSubmitAddition);
    }
    fs.writeFileSync('Local-Desktop/public/app.js', isCrlf ? appJs.replace(/\n/g, '\r\n') : appJs, 'utf8');
    console.log('[3/3] Local-Desktop app.js updated with desktop plus menu logic.');
  } else {
    console.log('[3/3] Local-Desktop app.js already contains initDesktopPlusMenu.');
  }
}
