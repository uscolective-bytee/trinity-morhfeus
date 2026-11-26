/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul patch-copilot-share-link.mjs (scripts/patch-copilot-share-link.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

// 1. Update Trinity/public/assistant/chat.html
{
  let chatHtml = fs.readFileSync('Trinity/public/assistant/chat.html', 'utf8');
  const target = `Tenant: usc31@saboivan2008gmail.onmicrosoft.com · Osobný: saboivan2008@gmail.com · Bot: 767f155a-5b45</small>
                  <div style="display:flex;gap:4px;margin-top:4px;align-items:center;">
                    <button class="secondary" onclick="notice('Trinitys (Copilot Studio) je prepojený. Tenant Object ID: d77169b1-e300-42da-88c3-e8df11b82604.')" style="font-size:9px;padding:3px 8px;">Overiť status</button>`;

  const replacement = `Tenant: usc31@saboivan2008gmail.onmicrosoft.com · Osobný: saboivan2008@gmail.com · Bot: 767f155a-5b45</small>
                  <div style="display:flex;gap:4px;margin-top:4px;align-items:center;">
                    <button class="secondary" onclick="notice('Trinitys (Copilot Studio) je prepojený. Tenant Object ID: d77169b1-e300-42da-88c3-e8df11b82604.')" style="font-size:9px;padding:3px 8px;">Overiť status</button>
                    <button class="primary" onclick="window.open('https://copilot.cloud.microsoft/chat/share/eyJzaGFyZUlkIjoiZDYxMTRkMTEtOTMxNi00NDI4LWI0MDktYjYxNTQxY2JiNzU3IiwiY29udmVyc2F0aW9uSWQiOiIyNDE0MGI3YS0yNjc5LTQxZGItYmQzYi0zZTQ1ZGI3MzEyNjMifQ%3D%3D','_blank')" style="font-size:9px;padding:3px 8px;background:#00a4ef;color:#fff;border:none;border-radius:4px;cursor:pointer;">Otvoriť Zdieľaný Chat ↗</button>`;

  if (chatHtml.includes(target)) {
    chatHtml = chatHtml.replace(target, replacement);
    fs.writeFileSync('Trinity/public/assistant/chat.html', chatHtml, 'utf8');
    console.log('[1/2] chat.html updated with direct link to Copilot Shared Chat.');
  }
}

// 2. Update Local-Desktop/public/index.html
{
  let indexHtml = fs.readFileSync('Local-Desktop/public/index.html', 'utf8');
  const target = `(Bot ID: 767f155a-5b45-15fc-17b1-e4d712682945)</li>`;
  const replacement = `(Bot ID: 767f155a-5b45-15fc-17b1-e4d712682945) · <a href="https://copilot.cloud.microsoft/chat/share/eyJzaGFyZUlkIjoiZDYxMTRkMTEtOTMxNi00NDI4LWI0MDktYjYxNTQxY2JiNzU3IiwiY29udmVyc2F0aW9uSWQiOiIyNDE0MGI3YS0yNjc5LTQxZGItYmQzYi0zZTQ1ZGI3MzEyNjMifQ%3D%3D" target="_blank" rel="noopener" style="color:#00a4ef;">Zdieľaný Copilot Chat ↗</a></li>`;

  if (indexHtml.includes(target)) {
    indexHtml = indexHtml.replace(target, replacement);
    fs.writeFileSync('Local-Desktop/public/index.html', indexHtml, 'utf8');
    console.log('[2/2] Local-Desktop index.html updated with direct link to Copilot Shared Chat.');
  }
}
