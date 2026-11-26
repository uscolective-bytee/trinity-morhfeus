/**
 * @module TRINITY_OMNI_CORE
 * @subsystem MOBILE_CHAT_EDGE
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul mobile-chat.js (Trinity/src/mobile-chat.js) - Bezpečné a responzívne mobilné chatovacie rozhranie na Cloudflare Edge.
 */

import { TRINITY_VERSION } from './version.js';

/**
 * Generátor HTML/CSS/JS pre responzívne mobilné rozhranie TRINITY OMNI-CORE.
 * Poskytuje zabezpečenú komunikáciu s edge endpointmi (/api/command, /api/launch, /api/status)
 * s ochranou proti DOM XSS (používa textContent namiesto innerHTML) a striktnou CSP.
 *
 * @param {object} env - Cloudflare Worker prostredie
 * @param {string} [host='auru.space'] - Hostname požiadavky
 * @returns {Response}
 */
export function renderMobileChatUI(env = {}, host = 'auru.space') {
  const systemName = env.SYSTEM_NAME || 'TRINITY OMNI-CORE';
  const environment = (env.ENVIRONMENT || 'production').toUpperCase();
  const version = TRINITY_VERSION || '11.0.0';

  const html = `<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${systemName} | Mobile</title>
  <style>
    :root {
      --bg: #090a0f;
      --surface: #12151f;
      --border: #23293d;
      --accent: #00ffa3;
      --text: #e2e8f0;
      --muted: #64748b;
      --danger: #ef4444;
      --code-bg: #0d1117;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); height: 100dvh; display: flex; flex-direction: column; overflow: hidden; }
    
    /* Header */
    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .title-group h1 { font-size: 1rem; font-weight: 700; letter-spacing: 1px; color: var(--accent); }
    .title-group p { font-size: 0.7rem; color: var(--muted); }
    .badge { font-size: 0.65rem; padding: 4px 8px; border-radius: 999px; background: rgba(0, 255, 163, 0.1); color: var(--accent); border: 1px solid var(--accent); font-weight: 600; white-space: nowrap; }
    
    /* Chat stream */
    #chat-stream { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
    .msg.bot { align-self: flex-start; background: var(--surface); border: 1px solid var(--border); border-top-left-radius: 2px; }
    .msg.user { align-self: flex-end; background: #1a2736; border: 1px solid #2b435c; color: #fff; border-top-right-radius: 2px; }
    .msg-meta { font-size: 0.65rem; color: var(--muted); margin-top: 4px; display: block; }
    .msg-pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.75rem; background: var(--code-bg); padding: 8px; border-radius: 6px; margin-top: 6px; overflow-x: auto; white-space: pre-wrap; border: 1px solid var(--border); color: #cbd5e1; }
    
    /* Controls / Input */
    footer { background: var(--surface); border-top: 1px solid var(--border); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .input-row { display: flex; gap: 8px; }
    input[type="text"], input[type="password"] { flex: 1; background: var(--bg); border: 1px solid var(--border); color: #fff; padding: 12px; border-radius: 8px; font-size: 0.95rem; outline: none; }
    input[type="text"]:focus, input[type="password"]:focus { border-color: var(--accent); }
    button { background: var(--accent); color: #000; border: none; padding: 0 16px; border-radius: 8px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; }
    button:active { opacity: 0.8; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    
    /* Auth Header Input (Sovereign identity) */
    .auth-bar { display: flex; gap: 6px; }
    .auth-bar input { flex: 1; background: transparent; border: 1px dashed var(--border); font-size: 0.7rem; color: var(--muted); padding: 4px 6px; border-radius: 4px; }
    .auth-bar input:focus { border-color: var(--accent); color: var(--text); }
  </style>
</head>
<body>
  <header>
    <div class="title-group">
      <h1>${systemName}</h1>
      <p id="system-status">CONNECTING...</p>
    </div>
    <span class="badge" id="auth-badge">BASTERIX SOVEREIGN</span>
  </header>

  <div id="chat-stream">
    <div class="msg bot">
      <div>Systém TRINITY OMNI-CORE inicializovaný. Mobilný kanál aktívny. Zadaj príkaz pre most (port 7788) alebo cloudové moduly.</div>
      <span class="msg-meta">Truth Policy: Enforced | v${version}</span>
    </div>
  </div>

  <footer>
    <div class="auth-bar">
      <input type="text" id="caller-id" placeholder="Identita (napr. 0949009722 alebo saboivan2008@gmail.com)" value="0949009722">
      <input type="password" id="caller-token" placeholder="Trinity Token / Kľúč (voliteľné)">
    </div>
    <div class="input-row">
      <input type="text" id="chat-input" placeholder="Zadaj príkaz (napr. otvor whatsapp)..." autocomplete="off">
      <button id="send-btn">SEND</button>
    </div>
  </footer>

  <script>
    const stream = document.getElementById('chat-stream');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const callerId = document.getElementById('caller-id');
    const callerToken = document.getElementById('caller-token');
    const statusText = document.getElementById('system-status');

    // Obnovenie uloženého tokenu z localStorage
    try {
      const savedToken = localStorage.getItem('trinity_mobile_token');
      if (savedToken && callerToken) callerToken.value = savedToken;
      const savedCaller = localStorage.getItem('trinity_mobile_caller');
      if (savedCaller && callerId) callerId.value = savedCaller;
    } catch (_) {}

    // Overenie online stavu cez /api/status
    fetch('/api/status')
      .then(r => r.json())
      .then(d => {
        const sys = d.service || d.system || 'TRINITY';
        const envName = (d.environment || 'production').toUpperCase();
        const ver = d.version || '${version}';
        statusText.textContent = sys + ' ' + ver + ' [' + envName + ']';
        statusText.style.color = 'var(--accent)';
      })
      .catch(() => {
        statusText.textContent = 'OFFLINE / TUNNEL UNREACHABLE';
        statusText.style.color = 'var(--danger)';
      });

    // Bezpečné vytváranie DOM uzlov (ochrana proti DOM XSS)
    function appendMessage(text, type, metaText = '', detailsJson = null) {
      const msg = document.createElement('div');
      msg.className = 'msg ' + (type === 'user' ? 'user' : 'bot');
      
      const contentDiv = document.createElement('div');
      contentDiv.textContent = text;
      msg.appendChild(contentDiv);

      if (detailsJson !== null && detailsJson !== undefined) {
        const pre = document.createElement('pre');
        pre.className = 'msg-pre';
        pre.textContent = typeof detailsJson === 'string' ? detailsJson : JSON.stringify(detailsJson, null, 2);
        msg.appendChild(pre);
      }

      if (metaText) {
        const metaSpan = document.createElement('span');
        metaSpan.className = 'msg-meta';
        metaSpan.textContent = metaText;
        msg.appendChild(metaSpan);
      }

      stream.appendChild(msg);
      stream.scrollTop = stream.scrollHeight;
    }

    async function handleCommand() {
      const cmd = input.value.trim();
      if (!cmd) return;
      
      const timeStr = new Date().toLocaleTimeString();
      appendMessage(cmd, 'user', timeStr);
      input.value = '';
      sendBtn.disabled = true;

      try {
        const idVal = callerId ? callerId.value.trim() : '';
        const tokenVal = callerToken ? callerToken.value.trim() : '';

        if (tokenVal) {
          try { localStorage.setItem('trinity_mobile_token', tokenVal); } catch (_) {}
        }
        if (idVal) {
          try { localStorage.setItem('trinity_mobile_caller', idVal); } catch (_) {}
        }

        const headers = { 'Content-Type': 'application/json' };
        if (idVal.includes('@')) {
          headers['x-trinity-email'] = idVal;
        } else if (idVal) {
          headers['x-trinity-phone'] = idVal;
        }
        if (tokenVal) {
          headers['X-Trinity-Bridge-Token'] = tokenVal;
          headers['Authorization'] = 'Bearer ' + tokenVal;
        }

        let endpoint = '/api/command';
        let body = {};

        if (cmd.toLowerCase().startsWith('otvor ') || cmd.toLowerCase().startsWith('open ') || cmd.toLowerCase().startsWith('spusti ')) {
          endpoint = '/api/launch';
          const app = cmd.replace(/^(otvor|open|spusti)\s+/i, '').trim();
          body = { target: app };
        } else {
          endpoint = '/api/command';
          body = { command: cmd };
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
        });

        const data = await res.json().catch(() => ({}));
        
        if (res.ok) {
          const successMsg = data.reply || data.message || 'Príkaz vykonaný úspešne.';
          const details = data.data || data.app_execution || (data.d1_ledger_receipt ? { ledger_block: data.d1_ledger_receipt.index || data.d1_ledger_receipt.block_hash } : undefined);
          appendMessage(successMsg, 'bot', 'Exit: ' + (data.exit_code ?? 0), details);
        } else {
          const errMsg = data.error || data.message || ('Chyba servera HTTP ' + res.status);
          appendMessage('CHYBA: ' + errMsg, 'bot', 'Status: ' + res.status, data.reason ? { reason: data.reason } : undefined);
        }
      } catch (err) {
        appendMessage('Zlyhalo sieťové spojenie: ' + err.message, 'bot', 'Network Err');
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    }

    sendBtn.addEventListener('click', handleCommand);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleCommand(); });
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Trinity-Host': host,
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none';"
    }
  });
}
