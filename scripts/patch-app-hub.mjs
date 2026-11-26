/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul patch-app-hub.mjs (scripts/patch-app-hub.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

// 1. Update Trinity/src/mcp.js
{
  let raw = fs.readFileSync('Trinity/src/mcp.js', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let content = normalize(raw);

  content = content.replace(
    `import {createSystemAction,getSystemAction,listSystemActions,approveSystemAction} from './system-actions.js';`,
    `import {createSystemAction,getSystemAction,listSystemActions,approveSystemAction,rejectSystemAction} from './system-actions.js';`
  );

  const marker = `server.registerTool('list_system_actions',{description:'Zoznam posledných systémových akcií a ich stavov.',
      inputSchema:{}},
      async()=>result(await listSystemActions(env)));`;

  const addition = `server.registerTool('approve_system_action',{description:'Schváli navrhnutú systémovú akciu pre vykonanie PC bránou alebo cloudom.',
      inputSchema:{id:z.string().uuid()},
      async({id})=>result(await approveSystemAction(env,id,'mcp:owner')));

    server.registerTool('reject_system_action',{description:'Zamietne navrhnutú systémovú akciu.',
      inputSchema:{id:z.string().uuid()},
      async({id})=>result(await rejectSystemAction(env,id,'mcp:owner')));`;

  if (content.includes(marker) && !content.includes('approve_system_action')) {
    content = content.replace(marker, marker + '\n\n    ' + addition);
    fs.writeFileSync('Trinity/src/mcp.js', isCrlf ? content.replace(/\n/g, '\r\n') : content, 'utf8');
    console.log('[1/5] Trinity/src/mcp.js successfully updated.');
  } else if (content.includes('approve_system_action')) {
    console.log('[1/5] Trinity/src/mcp.js already has approve_system_action.');
  } else {
    console.log('[1/5] Could not find marker in mcp.js, inspecting nearby lines...');
  }
}

// 2. Update Trinity/public/assistant/chat.js.txt
{
  let raw = fs.readFileSync('Trinity/public/assistant/chat.js.txt', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let chatJs = normalize(raw);

  const renderReplyStart = `function renderReply(target,raw){\n  const text = typeof raw === 'string' ? raw : (raw?.text || raw?.response || raw?.result || (raw ? JSON.stringify(raw, null, 2) : ''));\n  target.innerHTML=formatMarkdown(text);`;

  const approvalCardHelper = `
  // Check for guarded action approvals in text
  const actionMatch = text.match(/\\b([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\\b/i);
  const isApprovalIntent = /(?:SCHVÁĽ|schválenie|vyžaduje autorizáciu|approval_required|navrhnutá akcia|akcia navrhnutá)/i.test(text);
  if(actionMatch && isApprovalIntent){
    const actionId = actionMatch[1];
    const card = document.createElement('div');
    card.className = 'guarded-approval-card';
    card.dataset.actionId = actionId;
    card.innerHTML = \`
      <div class="approval-card-header">
        <span class="badge-risk">⚠️ Vyžaduje autorizáciu vlastníka</span>
        <span style="font-family:monospace;font-size:10px;color:#94a3b8;">\${actionId}</span>
      </div>
      <div style="font-size:12px;font-weight:600;color:#f8fafc;margin-bottom:6px;">Navrhnutá systémová akcia</div>
      <div class="approval-actions" style="display:flex;gap:8px;margin-top:6px;">
        <button class="btn-approve-action" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">⚡ Schváliť a vykonať</button>
        <button class="btn-reject-action" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">❌ Odmietnuť</button>
      </div>
      <div class="approval-status-msg" style="display:none;margin-top:6px;font-size:11px;"></div>
    \`;
    const approveBtn = card.querySelector('.btn-approve-action');
    const rejectBtn = card.querySelector('.btn-reject-action');
    const statusMsg = card.querySelector('.approval-status-msg');

    approveBtn.onclick = async () => {
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#38bdf8';
      statusMsg.textContent = 'Odosielam autorizáciu...';
      try {
        const res = await fetch('/api/system/actions/' + actionId + '/approve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({confirmation: actionId})
        });
        const d = await res.json().catch(()=>({}));
        if(res.ok) {
          card.classList.add('approved');
          statusMsg.style.color = '#34d399';
          statusMsg.textContent = '✅ Akcia bola autorizovaná vlastníkom a odoslaná na vykonanie!';
        } else {
          throw new Error(d.error || 'Schválenie zlyhalo');
        }
      } catch(e) {
        statusMsg.style.color = '#f87171';
        statusMsg.textContent = 'Chyba: ' + e.message;
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    };

    rejectBtn.onclick = async () => {
      approveBtn.disabled = true;
      rejectBtn.disabled = true;
      statusMsg.style.display = 'block';
      statusMsg.style.color = '#f87171';
      statusMsg.textContent = 'Odosielam zamietnutie...';
      try {
        const res = await fetch('/api/system/actions/' + actionId + '/reject', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({confirmation: actionId})
        });
        const d = await res.json().catch(()=>({}));
        if(res.ok) {
          card.classList.add('rejected');
          statusMsg.textContent = '❌ Akcia bola bezpečne zamietnutá.';
        } else {
          throw new Error(d.error || 'Zamietnutie zlyhalo');
        }
      } catch(e) {
        statusMsg.textContent = 'Chyba: ' + e.message;
        approveBtn.disabled = false;
        rejectBtn.disabled = false;
      }
    };

    target.append(card);
  }`;

  if (!chatJs.includes('guarded-approval-card')) {
    chatJs = chatJs.replace(renderReplyStart, renderReplyStart + approvalCardHelper);
    console.log('[2/5] renderReply in chat.js.txt enhanced with approval cards.');
  }

  const pendingApprovalsFunction = `
async function loadPendingApprovals(){
  const list = $('pending-approvals-list');
  if(!list) return;
  list.innerHTML = '<div style="color:#94a3b8;font-size:11px;">Načítavam čakajúce autorizácie...</div>';
  try {
    const res = await fetch('/api/system/actions');
    if(!res.ok) throw new Error('Nepodarilo sa načítať akcie: ' + res.status);
    const data = await res.json();
    const items = (data.items || []).filter(x => x.status === 'proposed');
    if(!items.length){
      list.innerHTML = '<div style="color:#94a3b8;font-size:11px;">Žiadne čakajúce autorizácie. Systém bezpečne čaká na tvoje príkazy.</div>';
      return;
    }
    list.innerHTML = '';
    for(const item of items){
      const card = document.createElement('div');
      card.className = 'guarded-approval-card';
      card.dataset.actionId = item.id;
      const payloadStr = typeof item.payload === 'object' ? JSON.stringify(item.payload, null, 2) : String(item.payload || '');
      card.innerHTML = \`
        <div class="approval-card-header">
          <span class="badge-risk">⚠️ Vyžaduje autorizáciu (\${item.action || 'akcia'})</span>
          <span style="font-family:monospace;font-size:10px;color:#94a3b8;">\${item.id}</span>
        </div>
        <div style="font-size:11px;color:#cbd5e1;margin-bottom:4px;"><b>Dôvod:</b> \${item.rationale || 'Bez popisu'}</div>
        <pre class="approval-payload">\${payloadStr.slice(0, 500)}</pre>
        <div class="approval-actions" style="display:flex;gap:8px;margin-top:6px;">
          <button class="btn-approve-action" style="background:#10b981;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">⚡ Schváliť a vykonať</button>
          <button class="btn-reject-action" style="background:#ef4444;color:#fff;border:none;border-radius:6px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">❌ Odmietnuť</button>
        </div>
        <div class="approval-status-msg" style="display:none;margin-top:6px;font-size:11px;"></div>
      \`;

      const approveBtn = card.querySelector('.btn-approve-action');
      const rejectBtn = card.querySelector('.btn-reject-action');
      const statusMsg = card.querySelector('.approval-status-msg');

      approveBtn.onclick = async () => {
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#38bdf8';
        statusMsg.textContent = 'Odosielam autorizáciu...';
        try {
          const r = await fetch('/api/system/actions/' + item.id + '/approve', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({confirmation: item.id})
          });
          const d = await r.json().catch(()=>({}));
          if(r.ok){
            card.classList.add('approved');
            statusMsg.style.color = '#34d399';
            statusMsg.textContent = '✅ Schválené vlastníkom a zaradené na vykonanie!';
            setTimeout(loadPendingApprovals, 2000);
          } else {
            throw new Error(d.error || 'Schválenie zlyhalo');
          }
        } catch(e) {
          statusMsg.style.color = '#f87171';
          statusMsg.textContent = 'Chyba: ' + e.message;
          approveBtn.disabled = false;
          rejectBtn.disabled = false;
        }
      };

      rejectBtn.onclick = async () => {
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        statusMsg.style.display = 'block';
        statusMsg.style.color = '#f87171';
        statusMsg.textContent = 'Odosielam zamietnutie...';
        try {
          const r = await fetch('/api/system/actions/' + item.id + '/reject', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({confirmation: item.id})
          });
          const d = await r.json().catch(()=>({}));
          if(r.ok){
            card.classList.add('rejected');
            statusMsg.textContent = '❌ Zamietnuté.';
            setTimeout(loadPendingApprovals, 2000);
          } else {
            throw new Error(d.error || 'Zamietnutie zlyhalo');
          }
        } catch(e) {
          statusMsg.textContent = 'Chyba: ' + e.message;
          approveBtn.disabled = false;
          rejectBtn.disabled = false;
        }
      };

      list.append(card);
    }
  } catch(e) {
    list.innerHTML = '<div style="color:#f87171;font-size:11px;">Chyba pri načítaní autorizácií: ' + e.message + '</div>';
  }
}
`;

  const initOmniDevEventsTarget = `if($('omni-fs-refresh'))$('omni-fs-refresh').onclick=refreshOmniFiles;`;
  const initOmniDevEventsAddition = `if($('omni-fs-refresh'))$('omni-fs-refresh').onclick=refreshOmniFiles;
  if($('omni-apps-refresh'))$('omni-apps-refresh').onclick=loadPendingApprovals;
  if($('refresh-approvals-btn'))$('refresh-approvals-btn').onclick=loadPendingApprovals;
  const appsTabBtn = document.querySelector('[data-omni-tab="apps"]');
  if(appsTabBtn){
    appsTabBtn.addEventListener('click', () => { loadPendingApprovals(); });
  }`;

  if (!chatJs.includes('loadPendingApprovals')) {
    chatJs = chatJs + '\n' + pendingApprovalsFunction;
    chatJs = chatJs.replace(initOmniDevEventsTarget, initOmniDevEventsAddition);
    fs.writeFileSync('Trinity/public/assistant/chat.js.txt', isCrlf ? chatJs.replace(/\n/g, '\r\n') : chatJs, 'utf8');
    console.log('[2/5] chat.js.txt loadPendingApprovals and tab listeners added.');
  } else {
    console.log('[2/5] chat.js.txt already contains loadPendingApprovals.');
  }
}

// 3. Update Local-Desktop/server.mjs
{
  let raw = fs.readFileSync('Local-Desktop/server.mjs', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let serverMjs = normalize(raw);

  const serverTarget = `if(url.pathname==='/api/tasks/refresh')return send(response,200,await mutate(async()=>{for(const item of tasks.filter(t=>t.environment===settings.environment&&!['completed','failed'].includes(t.status)).slice(-20)){`;

  const serverAddition = `if(request.method==='GET'&&url.pathname==='/api/system/actions'){
    try {
      const res = await cloud().call('list_system_actions', {});
      return send(response, 200, res);
    } catch(e) {
      return send(response, 200, { items: [], error: e.message });
    }
  }
  if(request.method==='POST'&&url.pathname==='/api/system/actions/approve'){
    try {
      const res = await cloud().call('approve_system_action', { id: input.id });
      return send(response, 200, res);
    } catch(e) {
      return send(response, 400, { error: e.message });
    }
  }
  if(request.method==='POST'&&url.pathname==='/api/system/actions/reject'){
    try {
      const res = await cloud().call('reject_system_action', { id: input.id });
      return send(response, 200, res);
    } catch(e) {
      return send(response, 400, { error: e.message });
    }
  }
  ${serverTarget}`;

  if (!serverMjs.includes('/api/system/actions')) {
    serverMjs = serverMjs.replace(serverTarget, serverAddition);
    fs.writeFileSync('Local-Desktop/server.mjs', isCrlf ? serverMjs.replace(/\n/g, '\r\n') : serverMjs, 'utf8');
    console.log('[3/5] Local-Desktop/server.mjs updated with system actions endpoints.');
  } else {
    console.log('[3/5] Local-Desktop/server.mjs already has system actions endpoints.');
  }
}

// 4. Update Local-Desktop/public/index.html
{
  let raw = fs.readFileSync('Local-Desktop/public/index.html', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let indexHtml = normalize(raw);

  const navTarget = `<button data-view="settings">⚙ <span>Nastavenia</span></button>`;
  const navAddition = `<button data-view="apps">⚡ <span>Aplikácie & Auth</span></button><button data-view="settings">⚙ <span>Nastavenia</span></button>`;

  if (!indexHtml.includes('data-view="apps"')) {
    indexHtml = indexHtml.replace(navTarget, navAddition);
  }

  const sectionTarget = `</section><section id="view-settings" class="view" hidden>`;
  const appsSection = `</section><section id="view-apps" class="view" hidden>
  <div class="section-intro">
    <div>
      <h2>Prepojené Aplikácie & Schvaľovanie</h2>
      <p>Centrálny hub aplikácií (Telegram, GitHub, Google, PC Bridge) a bezpečnostné schvaľovanie úprav vlastníkom.</p>
    </div>
    <button id="refresh-desktop-approvals" class="secondary">Obnoviť čakajúce</button>
  </div>
  <div class="settings-grid">
    <div class="panel">
      <span class="eyebrow">PREPOJENÉ SLUŽBY</span>
      <h2>Aktívne Aplikácie</h2>
      <ul class="features">
        <li>📱 <b>Telegram Bot:</b> @Trinity_Telegram_Bot (Webhook /api/telegram/webhook)</li>
        <li>🐙 <b>GitHub:</b> @uscolective-byte/Trinity-antigravity (main vetva)</li>
        <li>🌐 <b>Google Workspace:</b> saboivan2008@gmail.com (Gmail, Drive, Docs)</li>
        <li>🕊️ <b>X / Twitter (Morpheus):</b> OAuth 2.0 PKCE</li>
        <li>💻 <b>PC Bridge:</b> Lokálne riadenie procesov a súborov cez DPAPI</li>
      </ul>
      <p class="hint">Žiadna aplikácia ani AI agent nemôže vykonať zmenu systémových súborov, git commit alebo externý post bez tvojho výslovného schválenia.</p>
    </div>
    <div class="panel">
      <span class="eyebrow">AUTORIZÁCIA MAJITEĽA</span>
      <h2>Čakajúce Akcie na Schválenie</h2>
      <div id="desktop-approvals-list" style="display:flex;flex-direction:column;gap:10px;margin-top:10px;">
        <p class="hint">Načítavam čakajúce akcie...</p>
      </div>
    </div>
  </div>
</section><section id="view-settings" class="view" hidden>`;

  if (!indexHtml.includes('id="view-apps"')) {
    indexHtml = indexHtml.replace(sectionTarget, appsSection);
    fs.writeFileSync('Local-Desktop/public/index.html', isCrlf ? indexHtml.replace(/\n/g, '\r\n') : indexHtml, 'utf8');
    console.log('[4/5] Local-Desktop/public/index.html updated with Apps view.');
  } else {
    console.log('[4/5] Local-Desktop/public/index.html already has Apps view.');
  }
}

// 5. Update Local-Desktop/public/app.js
{
  let raw = fs.readFileSync('Local-Desktop/public/app.js', 'utf8');
  let isCrlf = raw.includes('\r\n');
  let appJs = normalize(raw);

  const switchTarget = `settings:'Nastavenia',connections:'Prepojenia',tasks:'Úlohy'})[view];`;
  const switchAddition = `settings:'Nastavenia',connections:'Prepojenia',tasks:'Úlohy',apps:'Aplikácie & Auth'})[view];if(view==='apps')loadDesktopApprovals().catch(e=>notice(e.message));`;

  if (!appJs.includes("apps:'Aplikácie & Auth'")) {
    appJs = appJs.replace(switchTarget, switchAddition);
  }

  const desktopApprovalLogic = `
async function loadDesktopApprovals(){
  const list = $('desktop-approvals-list');
  if(!list) return;
  list.innerHTML = '<p class="hint">Načítavam akcie z cloudu...</p>';
  try {
    const res = await api('/api/system/actions');
    const items = (res.items || []).filter(x => x.status === 'proposed');
    if(!items.length){
      list.innerHTML = '<p class="hint" style="color:#10b981;">✓ Žiadne čakajúce autorizácie. Systém je v bezpečnom stave.</p>';
      return;
    }
    list.innerHTML = '';
    for(const item of items){
      const card = document.createElement('div');
      card.className = 'panel';
      card.style.cssText = 'border:1px solid #f59e0b;padding:10px;border-radius:6px;background:rgba(245,158,11,0.05);';
      const payloadStr = typeof item.payload === 'object' ? JSON.stringify(item.payload, null, 2) : String(item.payload || '');
      card.innerHTML = \`
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <b style="color:#f59e0b;font-size:12px;">⚠️ Vyžaduje schválenie (\${item.action})</b>
          <small style="font-family:monospace;color:#94a3b8;">\${item.id}</small>
        </div>
        <p style="font-size:12px;margin:4px 0;"><b>Dôvod:</b> \${item.rationale || 'Bez popisu'}</p>
        <pre style="background:#0f172a;padding:6px;border-radius:4px;font-size:11px;max-height:120px;overflow-y:auto;color:#cbd5e1;">\${payloadStr.slice(0, 400)}</pre>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="approve-btn" style="background:#10b981;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">⚡ Schváliť a vykonať</button>
          <button class="reject-btn" style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:11px;">❌ Odmietnuť</button>
        </div>
        <p class="status-box" style="display:none;margin-top:6px;font-size:11px;"></p>
      \`;

      const apBtn = card.querySelector('.approve-btn');
      const rjBtn = card.querySelector('.reject-btn');
      const stBox = card.querySelector('.status-box');

      apBtn.onclick = async () => {
        apBtn.disabled = true;
        rjBtn.disabled = true;
        stBox.style.display = 'block';
        stBox.style.color = '#38bdf8';
        stBox.textContent = 'Odosielam schválenie...';
        try {
          await api('/api/system/actions/approve', { id: item.id });
          stBox.style.color = '#10b981';
          stBox.textContent = '✓ Akcia bola schválená a odoslaná na vykonanie!';
          setTimeout(loadDesktopApprovals, 2000);
        } catch(e) {
          stBox.style.color = '#ef4444';
          stBox.textContent = 'Chyba: ' + e.message;
          apBtn.disabled = false;
          rjBtn.disabled = false;
        }
      };

      rjBtn.onclick = async () => {
        apBtn.disabled = true;
        rjBtn.disabled = true;
        stBox.style.display = 'block';
        stBox.style.color = '#ef4444';
        stBox.textContent = 'Odosielam zamietnutie...';
        try {
          await api('/api/system/actions/reject', { id: item.id });
          stBox.textContent = '✓ Akcia bola zamietnutá.';
          setTimeout(loadDesktopApprovals, 2000);
        } catch(e) {
          stBox.textContent = 'Chyba: ' + e.message;
          apBtn.disabled = false;
          rjBtn.disabled = false;
        }
      };

      list.append(card);
    }
  } catch(e) {
    list.innerHTML = '<p class="hint" style="color:#ef4444;">Chyba: ' + e.message + '</p>';
  }
}
if($('refresh-desktop-approvals'))$('refresh-desktop-approvals').onclick = loadDesktopApprovals;
`;

  if (!appJs.includes('loadDesktopApprovals')) {
    appJs = appJs + '\n' + desktopApprovalLogic;
    fs.writeFileSync('Local-Desktop/public/app.js', isCrlf ? appJs.replace(/\n/g, '\r\n') : appJs, 'utf8');
    console.log('[5/5] Local-Desktop/public/app.js updated with loadDesktopApprovals.');
  } else {
    console.log('[5/5] Local-Desktop/public/app.js already has loadDesktopApprovals.');
  }
}
