/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul patch-microsoft-connector.mjs (scripts/patch-microsoft-connector.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

// 1. Update Trinity/public/assistant/chat.html
{
  let chatHtml = fs.readFileSync('Trinity/public/assistant/chat.html', 'utf8');
  const googleMarker = '<!-- Google Workspace / Gmail -->';
  const msCard = `<!-- Microsoft Copilot Studio & Entra ID -->
                <div class="app-connector-card" style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <b style="color:#00a4ef;">🪟 Microsoft Copilot Studio (Trinitys)</b>
                    <span style="color:#4ade80;font-size:10px;font-weight:700;">● Active</span>
                  </div>
                  <small style="color:#94a3b8;font-size:10px;">Tenant: usc31@saboivan2008gmail.onmicrosoft.com · Osobný: saboivan2008@gmail.com · Bot: 767f155a-5b45</small>
                  <div style="display:flex;gap:4px;margin-top:4px;align-items:center;">
                    <button class="secondary" onclick="notice('Trinitys (Copilot Studio) je prepojený. Tenant Object ID: d77169b1-e300-42da-88c3-e8df11b82604.')" style="font-size:9px;padding:3px 8px;">Overiť status</button>
                    <span style="color:#f59e0b;font-size:9px;">🛡️ Auth = Potvrdenie</span>
                  </div>
                </div>

                `;

  if (!chatHtml.includes('Microsoft Copilot Studio (Trinitys)')) {
    chatHtml = chatHtml.replace(googleMarker, msCard + googleMarker);
    fs.writeFileSync('Trinity/public/assistant/chat.html', chatHtml, 'utf8');
    console.log('[1/2] chat.html updated with Microsoft Copilot Studio Trinitys card.');
  } else {
    console.log('[1/2] chat.html already has Microsoft Copilot Studio Trinitys card.');
  }
}

// 2. Update Local-Desktop/public/index.html
{
  let indexHtml = fs.readFileSync('Local-Desktop/public/index.html', 'utf8');
  const target = `<li>🌐 <b>Google Workspace:</b> saboivan2008@gmail.com (Gmail, Drive, Docs)</li>`;
  const addition = `<li>🪟 <b>Microsoft Copilot Studio (Trinitys):</b> Tenant usc31@saboivan2008gmail.onmicrosoft.com & Osobný saboivan2008@gmail.com (Bot ID: 767f155a-5b45-15fc-17b1-e4d712682945)</li>\n        ${target}`;

  if (!indexHtml.includes('Microsoft Copilot Studio (Trinitys)')) {
    indexHtml = indexHtml.replace(target, addition);
    fs.writeFileSync('Local-Desktop/public/index.html', indexHtml, 'utf8');
    console.log('[2/2] Local-Desktop index.html updated with Microsoft Trinitys account.');
  } else {
    console.log('[2/2] Local-Desktop index.html already has Microsoft Trinitys account.');
  }
}
