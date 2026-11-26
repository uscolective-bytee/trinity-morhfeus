/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul apply-multimedia-voice-desktop.mjs (scripts/apply-multimedia-voice-desktop.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

// 1. Update Local-Desktop/public/index.html
{
  let html = fs.readFileSync('Local-Desktop/public/index.html', 'utf8');

  // Add voice button to composer
  const composerTarget = `<textarea id="message" rows="2" maxlength="12000" placeholder="Napíš Trinity…" aria-label="Správa pre Trinity" required></textarea><button id="send" type="submit">Odoslať ↑</button>`;
  const composerReplacement = `<textarea id="message" rows="2" maxlength="12000" placeholder="Napíš Trinity…" aria-label="Správa pre Trinity" required></textarea><button id="voice-btn" type="button" title="Hlasový vstup / Diktovanie reči (klikni a hovor)" class="voice-btn">🎙️</button><button id="send" type="submit">Odoslať ↑</button>`;

  if (!html.includes('id="voice-btn"')) {
    html = html.replace(composerTarget, composerReplacement);
  }

  // Add auto-speak checkbox to composer-footer
  const footerTarget = `<label><input id="allow-writes" type="checkbox" checked> Povoliť zápis do Workspace a pamäte</label>`;
  const footerReplacement = `<label><input id="allow-writes" type="checkbox" checked> Povoliť zápis do Workspace a pamäte</label><label style="display:inline-flex;align-items:center;gap:5px;cursor:pointer;"><input id="auto-speak" type="checkbox"> 🔊 Hlasový rozhovor (čítať odpovede nahlas)</label>`;

  if (!html.includes('id="auto-speak"')) {
    html = html.replace(footerTarget, footerReplacement);
  }

  // Add media modal before </body>
  const modalHtml = `
<div id="media-modal" class="media-modal" hidden>
  <div class="media-modal-backdrop" id="media-modal-backdrop"></div>
  <div class="media-modal-box">
    <div class="media-modal-header">
      <b id="media-modal-title">Prehrávač médií Trinity</b>
      <div style="display:flex;gap:8px;align-items:center;">
        <a id="media-modal-download" href="#" download class="subtle" style="text-decoration:none;">⬇ Stiahnuť</a>
        <button id="media-modal-close" type="button" class="subtle" style="font-size:16px;">✕ Zavrieť</button>
      </div>
    </div>
    <div id="media-modal-body" class="media-modal-body"></div>
  </div>
</div>
`;

  if (!html.includes('id="media-modal"')) {
    html = html.replace('</body>', modalHtml + '</body>');
    fs.writeFileSync('Local-Desktop/public/index.html', html, 'utf8');
    console.log('[1/3] Local-Desktop index.html updated with voice controls & media modal.');
  } else {
    console.log('[1/3] Local-Desktop index.html already has media modal.');
  }
}

// 2. Update Local-Desktop/public/style.css
{
  let css = fs.readFileSync('Local-Desktop/public/style.css', 'utf8');

  const voiceMediaStyles = `
/* Voice & Media Styles for Local-Desktop */
.voice-btn{background:#182823;border:1px solid #386b5c;color:#80e5cb;border-radius:10px;padding:10px 14px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s ease}
.voice-btn:hover{background:#233f36;border-color:#48907b}
.voice-btn.recording{background:#881337;border-color:#f43f5e;color:#fff;animation:desktop-pulse-red 1.2s infinite}
@keyframes desktop-pulse-red{0%{box-shadow:0 0 0 0 rgba(244,63,94,.6)}70%{box-shadow:0 0 0 10px rgba(244,63,94,0)}100%{box-shadow:0 0 0 0 rgba(244,63,94,0)}}

.speak-btn{background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;margin-top:6px;display:inline-flex;align-items:center;gap:4px}
.speak-btn:hover{color:var(--accent);border-color:var(--accent);background:rgba(128,229,203,.08)}
.speak-btn.speaking{color:#f59e0b;border-color:#f59e0b;background:rgba(245,158,11,.1);animation:desktop-pulse-yellow 1.5s infinite}
@keyframes desktop-pulse-yellow{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}

.media-container{margin-top:10px;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:#070b10;max-width:100%}
.media-container img{display:block;max-width:100%;max-height:360px;object-fit:contain;cursor:pointer;border-radius:8px;transition:transform .2s}
.media-container img:hover{transform:scale(1.01);filter:brightness(1.05)}
.media-container video{display:block;width:100%;max-height:380px;border-radius:8px;background:#000}
.media-container audio{display:block;width:100%;margin-top:4px}
.media-action-bar{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;font-size:11px;background:#0d131b;border-top:1px solid var(--border);color:var(--muted)}
.media-action-bar button{background:transparent;border:none;color:var(--accent);cursor:pointer;font-size:11px;padding:2px 6px}
.media-action-bar button:hover{text-decoration:underline}

.media-modal{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center}
.media-modal[hidden]{display:none!important}
.media-modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(6px)}
.media-modal-box{position:relative;background:#0f1722;border:1px solid #334155;border-radius:14px;max-width:90vw;max-height:90vh;width:850px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.7)}
.media-modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--border);background:#131c28}
.media-modal-body{padding:16px;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#060a0f;min-height:280px}
.media-modal-body img{max-width:100%;max-height:75vh;object-fit:contain;border-radius:8px}
.media-modal-body video{max-width:100%;max-height:75vh;border-radius:8px;background:#000}
.media-modal-body audio{width:100%;margin-top:20px}
`;

  if (!css.includes('.voice-btn')) {
    css += '\n' + voiceMediaStyles;
    fs.writeFileSync('Local-Desktop/public/style.css', css, 'utf8');
    console.log('[2/3] Local-Desktop style.css updated with voice & media styles.');
  } else {
    console.log('[2/3] Local-Desktop style.css already contains voice & media styles.');
  }
}

// 3. Update Local-Desktop/public/app.js
{
  let appJs = fs.readFileSync('Local-Desktop/public/app.js', 'utf8');

  // Replace append function with enhanced media and speech support
  const origAppend = `function append(role,text,receipts=[]){const welcome=document.querySelector('.welcome');if(welcome)welcome.remove();const wrapper=document.createElement('article');wrapper.className='message '+role;const who=document.createElement('div');who.className='who';who.textContent=role==='user'?'Basterix':'Trinity';const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;wrapper.append(who,bubble);if(receipts.length){const details=document.createElement('div');details.className='receipts';details.textContent=receipts.map(r=>(r.success?'✓ ':'✕ ')+r.tool+(r.path?' · '+r.path:'')+(r.error?' · '+r.error:'')).join(' | ');wrapper.append(details);}$('messages').append(wrapper);$('messages').scrollTop=$('messages').scrollHeight;return bubble;}`;

  const enhancedAppend = `function openMediaModal({type,src,title='Médiá Trinity'}){
  const modal=$('media-modal'),body=$('media-modal-body'),titleEl=$('media-modal-title'),dl=$('media-modal-download');
  if(!modal||!body)return;
  body.innerHTML='';
  titleEl.textContent=title;
  dl.href=src;
  dl.download=title.replace(/[^a-z0-9_-]/gi,'_');
  if(type==='image'){
    const img=document.createElement('img');img.src=src;img.alt=title;body.append(img);
  }else if(type==='video'){
    const vid=document.createElement('video');vid.src=src;vid.controls=true;vid.autoplay=true;body.append(vid);
  }else if(type==='audio'){
    const aud=document.createElement('audio');aud.src=src;aud.controls=true;aud.autoplay=true;body.append(aud);
  }
  modal.hidden=false;
}

function speakText(text,btn=null){
  if(!('speechSynthesis' in window))return;
  if(window.speechSynthesis.speaking){
    window.speechSynthesis.cancel();
    if(btn){btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');}
    return;
  }
  const clean=text.replace(/\\x1b\\[[0-9;]*m/g,'').replace(/\\[[^\\]]+\\]\\([^)]+\\)/g,'').slice(0,1000);
  const utter=new SpeechSynthesisUtterance(clean);
  utter.lang='sk-SK';
  utter.rate=1.0;
  if(btn){
    btn.textContent='⏹️ Zastaviť';
    btn.classList.add('speaking');
    utter.onend=()=>{btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');};
    utter.onerror=()=>{btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');};
  }
  window.speechSynthesis.speak(utter);
}

function renderMediaInBubble(bubble,text){
  // Video detection (.mp4, .webm, data:video)
  const videoMatches=Array.from(text.matchAll(/https?:\\/\\/[^\\s"'>]+\\.(mp4|webm|mov)|data:video\\/[^;]+;base64,[^\\s"'>]+/gi));
  for(const vm of videoMatches){
    const vUrl=vm[0];
    const box=document.createElement('div');box.className='media-container';
    box.innerHTML=\`<video controls preload="metadata" src="\${vUrl}"></video><div class="media-action-bar"><span>🎬 Video záznam</span><button type="button">🔍 Otvoriť vo veľkom prehrávači</button></div>\`;
    box.querySelector('button').onclick=()=>openMediaModal({type:'video',src:vUrl,title:'Video záznam'});
    bubble.append(box);
  }

  // Image detection (.png, .jpg, .webp, data:image)
  const imgMatches=Array.from(text.matchAll(/https?:\\/\\/[^\\s"'>]+\\.(png|jpe?g|webp|svg|gif)|data:image\\/[^;]+;base64,[^\\s"'>]+/gi));
  for(const im of imgMatches){
    const iUrl=im[0];
    const box=document.createElement('div');box.className='media-container';
    box.innerHTML=\`<img src="\${iUrl}" alt="Fotka Trinity" loading="lazy"><div class="media-action-bar"><span>📸 Fotka / Obrázok</span><button type="button">🔍 Otvoriť detail</button></div>\`;
    box.querySelector('img').onclick=()=>openMediaModal({type:'image',src:iUrl,title:'Fotka / Obrázok'});
    box.querySelector('button').onclick=()=>openMediaModal({type:'image',src:iUrl,title:'Fotka / Obrázok'});
    bubble.append(box);
  }

  // Audio detection (.mp3, .wav, .ogg, data:audio)
  const audMatches=Array.from(text.matchAll(/https?:\\/\\/[^\\s"'>]+\\.(mp3|wav|ogg|m4a)|data:audio\\/[^;]+;base64,[^\\s"'>]+/gi));
  for(const am of audMatches){
    const aUrl=am[0];
    const box=document.createElement('div');box.className='media-container';
    box.innerHTML=\`<audio controls preload="metadata" src="\${aUrl}"></audio><div class="media-action-bar"><span>🎵 Zvukový záznam / Hudba</span><button type="button">🔍 Prehrávač</button></div>\`;
    box.querySelector('button').onclick=()=>openMediaModal({type:'audio',src:aUrl,title:'Zvukový záznam'});
    bubble.append(box);
  }
}

function append(role,text,receipts=[]){
  const welcome=document.querySelector('.welcome');if(welcome)welcome.remove();
  const wrapper=document.createElement('article');wrapper.className='message '+role;
  const who=document.createElement('div');who.className='who';who.textContent=role==='user'?'Basterix':'Trinity';
  const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;
  
  // Render media attachments
  renderMediaInBubble(bubble,text);

  wrapper.append(who,bubble);

  if(role==='assistant'){
    const footer=document.createElement('div');
    footer.style.cssText='display:flex;gap:8px;align-items:center;margin-top:6px;';
    const spBtn=document.createElement('button');
    spBtn.type='button';
    spBtn.className='speak-btn';
    spBtn.textContent='🔊 Prehrať';
    spBtn.onclick=()=>speakText(text,spBtn);
    footer.append(spBtn);
    wrapper.append(footer);

    if($('auto-speak')?.checked){
      speakText(text,spBtn);
    }
  }

  if(receipts.length){
    const details=document.createElement('div');details.className='receipts';
    details.textContent=receipts.map(r=>(r.success?'✓ ':'✕ ')+r.tool+(r.path?' · '+r.path:'')+(r.error?' · '+r.error:'')).join(' | ');
    wrapper.append(details);
  }
  $('messages').append(wrapper);
  $('messages').scrollTop=$('messages').scrollHeight;
  return bubble;
}`;

  if (appJs.includes(origAppend)) {
    appJs = appJs.replace(origAppend, enhancedAppend);
  }

  // Add Voice Recognition & Modal Event Listeners
  const voiceLogic = `
// Voice Input & Media Modal Listeners
let desktopSpeechRec = null;
let desktopIsRecording = false;

function setupDesktopVoice(){
  const voiceBtn = $('voice-btn');
  const msgInput = $('message');
  if(!voiceBtn || !msgInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(SpeechRecognition){
    desktopSpeechRec = new SpeechRecognition();
    desktopSpeechRec.continuous = false;
    desktopSpeechRec.interimResults = true;
    desktopSpeechRec.lang = 'sk-SK';

    desktopSpeechRec.onstart = () => {
      desktopIsRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.title = 'Nahrávam... Klikni pre zastavenie';
      notice('Hlasový vstup aktívny. Hovor po slovensky...');
    };

    desktopSpeechRec.onresult = (e) => {
      let interim = '', final = '';
      for(let i = e.resultIndex; i < e.results.length; ++i){
        if(e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      const captured = (final || interim).trim();
      if(captured){
        msgInput.value = captured;
      }
    };

    desktopSpeechRec.onerror = (e) => {
      console.warn('Speech error:', e.error);
      desktopIsRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.title = 'Hovoriť do mikrofónu';
      notice('Hlasový vstup: ' + (e.error === 'not-allowed' ? 'Prístup k mikrofónu bol zamietnutý.' : e.error));
    };

    desktopSpeechRec.onend = () => {
      desktopIsRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.title = 'Hovoriť do mikrofónu';
      if($('auto-speak')?.checked && msgInput.value.trim()){
        notice('Odosielam hlasovú správu...', true);
        $('chat-form').requestSubmit();
      }
    };

    voiceBtn.onclick = () => {
      if(desktopIsRecording){
        desktopSpeechRec.stop();
      } else {
        msgInput.focus();
        desktopSpeechRec.start();
      }
    };
  } else {
    voiceBtn.onclick = () => {
      notice('Váš prehliadač nepodporuje Web Speech API. Odporúčame Chrome/Edge pre hlasový diktát.');
    };
  }

  // Media Modal close events
  $('media-modal-close')?.addEventListener('click', () => { if($('media-modal')) $('media-modal').hidden = true; });
  $('media-modal-backdrop')?.addEventListener('click', () => { if($('media-modal')) $('media-modal').hidden = true; });
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && $('media-modal') && !$('media-modal').hidden){
      $('media-modal').hidden = true;
    }
  });
}
setupDesktopVoice();
`;

  if (!appJs.includes('setupDesktopVoice')) {
    appJs += '\n' + voiceLogic;
    fs.writeFileSync('Local-Desktop/public/app.js', appJs, 'utf8');
    console.log('[3/3] Local-Desktop app.js updated with voice recognition & media player.');
  } else {
    console.log('[3/3] Local-Desktop app.js already contains setupDesktopVoice.');
  }
}
