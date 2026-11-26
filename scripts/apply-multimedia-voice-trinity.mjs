/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul apply-multimedia-voice-trinity.mjs (scripts/apply-multimedia-voice-trinity.mjs) v ekosystéme TRINITY OMNI-CORE.
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

  const lightboxHtml = `
<div id="trinity-media-lightbox" class="trinity-lightbox" hidden>
  <div class="lightbox-overlay" id="lightbox-backdrop"></div>
  <div class="lightbox-container">
    <div class="lightbox-header">
      <b id="lightbox-caption">Multimediálny Prehrávač Trinity</b>
      <div style="display:flex;gap:8px;align-items:center;">
        <a id="lightbox-dl-btn" href="#" download class="primary" style="font-size:11px;padding:3px 10px;text-decoration:none;">⬇ Stiahnuť</a>
        <button id="lightbox-close-btn" type="button" class="subtle" style="font-size:16px;padding:2px 8px;cursor:pointer;border:none;background:transparent;color:#94a3b8;">✕</button>
      </div>
    </div>
    <div id="lightbox-content" class="lightbox-body"></div>
  </div>
</div>
`;

  if (!html.includes('id="trinity-media-lightbox"')) {
    html = html.replace('</body>', lightboxHtml + '</body>');
    fs.writeFileSync('Trinity/public/assistant/chat.html', isCrlf ? html.replace(/\n/g, '\r\n') : html, 'utf8');
    console.log('[1/3] Trinity chat.html updated with media lightbox.');
  } else {
    console.log('[1/3] Trinity chat.html already has media lightbox.');
  }
}

// 2. Update Trinity/public/assistant/builder.css
{
  let raw = fs.readFileSync('Trinity/public/assistant/builder.css', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let css = normalize(raw);

  const lightboxStyles = `
/* Trinity Universal Media Lightbox & Voice Styles */
.trinity-lightbox{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center}
.trinity-lightbox[hidden]{display:none!important}
.lightbox-overlay{position:absolute;inset:0;background:rgba(2,6,23,.88);backdrop-filter:blur(8px)}
.lightbox-container{position:relative;background:#0f172a;border:1px solid #334155;border-radius:16px;max-width:92vw;max-height:90vh;width:880px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 65px rgba(0,0,0,.85)}
.lightbox-header{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid #1e293b;background:#1e293b}
.lightbox-header b{color:#f8fafc;font-size:13px;letter-spacing:.5px}
.lightbox-body{padding:16px;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#020617;min-height:320px}
.lightbox-body img{max-width:100%;max-height:78vh;object-fit:contain;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.lightbox-body video{max-width:100%;max-height:78vh;border-radius:8px;background:#000;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.lightbox-body audio{width:100%;margin-top:20px}

.embedded-media-box{margin:10px 0;border-radius:12px;overflow:hidden;border:1px solid #334155;background:#020617}
.embedded-media-box video{display:block;width:100%;max-height:400px;background:#000}
.embedded-media-box audio{display:block;width:100%;margin-top:4px}
.media-card-bar{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#0f172a;border-top:1px solid #1e293b;font-size:11px;color:#94a3b8}
.media-card-bar button{background:transparent;border:none;color:#38bdf8;cursor:pointer;font-size:11px;font-weight:600;padding:2px 6px}
.media-card-bar button:hover{text-decoration:underline}

.msg-speak-btn{background:transparent;border:1px solid #334155;color:#94a3b8;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all .2s ease}
.msg-speak-btn:hover{color:#38bdf8;border-color:#38bdf8;background:rgba(56,189,248,.08)}
.msg-speak-btn.speaking{color:#f59e0b;border-color:#f59e0b;background:rgba(245,158,11,.15);animation:pulse-glow 1.5s infinite}
@keyframes pulse-glow{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}

.voice-live-btn.recording{background:#881337!important;border-color:#f43f5e!important;color:#fff!important;animation:pulse-red 1.2s infinite}
`;

  if (!css.includes('.trinity-lightbox')) {
    css += '\n' + lightboxStyles;
    fs.writeFileSync('Trinity/public/assistant/builder.css', isCrlf ? css.replace(/\n/g, '\r\n') : css, 'utf8');
    console.log('[2/3] Trinity builder.css updated with lightbox styles.');
  } else {
    console.log('[2/3] Trinity builder.css already contains lightbox styles.');
  }
}

// 3. Update Trinity/public/assistant/chat.js.txt
{
  let raw = fs.readFileSync('Trinity/public/assistant/chat.js.txt', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let js = normalize(raw);

  const lightboxHelpers = `
// Universal Trinity Media Lightbox & Voice TTS
function openTrinityLightbox({type,src,title='Médiá Trinity'}){
  const modal=$('trinity-media-lightbox'),body=$('lightbox-content'),caption=$('lightbox-caption'),dl=$('lightbox-dl-btn');
  if(!modal||!body)return;
  body.innerHTML='';
  if(caption)caption.textContent=title;
  if(dl){
    dl.href=src;
    dl.download=title.replace(/[^a-z0-9_-]/gi,'_');
  }
  if(type==='image'){
    const img=document.createElement('img');img.src=src;img.alt=title;body.append(img);
  }else if(type==='video'){
    const vid=document.createElement('video');vid.src=src;vid.controls=true;vid.autoplay=true;vid.playsInline=true;body.append(vid);
  }else if(type==='audio'){
    const aud=document.createElement('audio');aud.src=src;aud.controls=true;aud.autoplay=true;body.append(aud);
  }
  modal.hidden=false;
}

function speakTrinityMessage(text,btn=null){
  if(!('speechSynthesis' in window)){
    notice('Váš prehliadač nepodporuje syntézu reči.');
    return;
  }
  if(window.speechSynthesis.speaking){
    window.speechSynthesis.cancel();
    if(btn){btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');}
    return;
  }
  const clean=text.replace(/\\x1b\\[[0-9;]*m/g,'').replace(/\\[[^\\]]+\\]\\([^)]+\\)/g,'').slice(0,1200);
  const utter=new SpeechSynthesisUtterance(clean);
  utter.lang=uiLanguage()==='sk'?'sk-SK':'en-US';
  utter.rate=1.0;
  if(btn){
    btn.textContent='⏹️ Zastaviť';
    btn.classList.add('speaking');
    utter.onend=()=>{btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');};
    utter.onerror=()=>{btn.textContent='🔊 Prehrať';btn.classList.remove('speaking');};
  }
  window.speechSynthesis.speak(utter);
}
`;

  // Attach lightbox click events in setup
  const lightboxSetupListeners = `
// Lightbox Close Events
$('lightbox-close-btn')?.addEventListener('click', ()=>{ if($('trinity-media-lightbox')) $('trinity-media-lightbox').hidden=true; });
$('lightbox-backdrop')?.addEventListener('click', ()=>{ if($('trinity-media-lightbox')) $('trinity-media-lightbox').hidden=true; });
window.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && $('trinity-media-lightbox') && !$('trinity-media-lightbox').hidden){
    $('trinity-media-lightbox').hidden=true;
  }
});
`;

  // Enhance renderReply with video, audio, lightbox and speak button
  const renderReplyMarker = `  target.innerHTML=formatMarkdown(text);`;
  const renderReplyEnhancement = `  target.innerHTML=formatMarkdown(text);

  // 1. Image lightbox zoom
  const imgMatches = text.match(/\/api\/assistant\/media\/images\/[0-9a-f-]{36}|https?:\\/\\/[^\\s"'>]+\\.(png|jpe?g|webp|svg|gif)|data:image\\/[^;]+;base64,[^\\s"'>]+/gi);
  if(imgMatches){
    for(const iUrl of imgMatches){
      // Check if not already rendered
      if(!target.querySelector(\`img[src="\${iUrl}"]\`)){
        const img = document.createElement('img');
        img.className = 'generated-media';
        img.src = iUrl;
        img.alt = 'Fotka / Obrázok Trinity';
        img.loading = 'lazy';
        img.style.cursor = 'zoom-in';
        img.title = 'Klikni pre zobrazenie v plnom rozlíšení';
        img.onclick = () => openTrinityLightbox({type:'image',src:iUrl,title:'Fotka Trinity'});
        target.append(img);
      }
    }
  }

  // 2. Video detection and embedding
  const vidMatches = text.match(/\/api\/assistant\/media\/video\\/[0-9a-f-]{36}|https?:\\/\\/[^\\s"'>]+\\.(mp4|webm|mov)|data:video\\/[^;]+;base64,[^\\s"'>]+/gi);
  if(vidMatches){
    for(const vUrl of vidMatches){
      const box = document.createElement('div');
      box.className = 'embedded-media-box';
      box.innerHTML = \`<video controls playsinline preload="metadata" src="\${vUrl}"></video><div class="media-card-bar"><span>🎬 Video záznam Trinity</span><button type="button">🔍 Otvoriť v kine (Fullscreen)</button></div>\`;
      box.querySelector('button').onclick = () => openTrinityLightbox({type:'video',src:vUrl,title:'Video záznam Trinity'});
      target.append(box);
    }
  }

  // 3. Audio detection and embedding
  const audMatches = text.match(/\/api\/assistant\/media\/audio\\/[0-9a-f-]{36}|https?:\\/\\/[^\\s"'>]+\\.(mp3|wav|ogg)|data:audio\\/[^;]+;base64,[^\\s"'>]+/gi);
  if(audMatches){
    for(const aUrl of audMatches){
      if(!target.querySelector(\`audio[src="\${aUrl}"]\`)){
        const box = document.createElement('div');
        box.className = 'embedded-media-box';
        box.innerHTML = \`<audio controls preload="metadata" src="\${aUrl}"></audio><div class="media-card-bar"><span>🎵 Zvukový záznam / Hudba</span><button type="button">🔍 Prehrávač</button></div>\`;
        box.querySelector('button').onclick = () => openTrinityLightbox({type:'audio',src:aUrl,title:'Zvukový záznam'});
        target.append(box);
      }
    }
  }

  // 4. Speak response button
  const speakFooter = document.createElement('div');
  speakFooter.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:8px;';
  const spBtn = document.createElement('button');
  spBtn.type = 'button';
  spBtn.className = 'msg-speak-btn';
  spBtn.textContent = '🔊 Prehrať hlasom';
  spBtn.onclick = () => speakTrinityMessage(text, spBtn);
  speakFooter.append(spBtn);
  target.append(speakFooter);
`;

  if (!js.includes('openTrinityLightbox')) {
    js = lightboxHelpers + '\n' + js;
    js = js.replace(renderReplyMarker, renderReplyEnhancement);
    js += '\n' + lightboxSetupListeners;
    fs.writeFileSync('Trinity/public/assistant/chat.js.txt', isCrlf ? js.replace(/\n/g, '\r\n') : js, 'utf8');
    console.log('[3/3] Trinity chat.js.txt updated with universal media lightbox, video, audio and voice TTS.');
  } else {
    console.log('[3/3] Trinity chat.js.txt already has openTrinityLightbox.');
  }
}
