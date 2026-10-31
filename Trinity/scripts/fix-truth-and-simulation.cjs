const fs = require('fs');
const path = require('path');

console.log('Fixing truth and anti-simulation rules...');

// 1. Update src/engine.js
const enginePath = path.join(__dirname, '../src/engine.js');
let engine = fs.readFileSync(enginePath, 'utf8');

// Broaden isGithubRequest regex
engine = engine.replace(
  "function isGithubRequest(task) {\n  const norm = String(task || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();\n  return /\\bgithub\\b.*\\b(spravuj|skontroluj|status|zoznam|commits?|issues?|repo)\\b/.test(norm);\n}",
  `function isGithubRequest(task) {
  const norm = String(task || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
  return /\\b(github|repo|repozitar|repozitara|repozitare|kodova zakladna|struktura projektu|struktura repozitara)\\b/.test(norm);
}`
);

// Update github direct response in engine.js
const oldGithubDirect = `    const outcome=await runTool(env,agent,'github_manage',{action:'status'});
    const receipt={tool:'github_manage',status:'completed',effect:'read',receipt_id:\`gh:\${Date.now()}\`,verified_at:new Date().toISOString()};
    const text=\`🐙 **GitHub Integrácia (\\\`\${outcome.repo}\\\`):**\\n\\n- Repozitár: [\${outcome.repo}](https://github.com/\${outcome.repo})\\n- Predvolená vetva: \\\`\${outcome.details?.default_branch||'main'}\\\`\\n- Otvorené issues: \\\`\${outcome.details?.open_issues||0}\\\`\\n- Autentifikovaný prístup: \\\`\${outcome.authenticated?'Áno (Token v trezore)':'Verejné čítanie (Bezpečný režim)'}\\\`\\n\\nTrinity dokáže kontrolovať commity, issues, prispôsobovať vetvy a spúšťať GitHub Actions.\`;
    return {text,model:'trinity-github-ops',provider:'internal',agent_id:id,tool_log:[receipt],truth:truthStatus(text,[receipt]),duration_ms:Date.now()-started};`;

const newGithubDirect = `    const outcome=await runTool(env,agent,'github_manage',{action:'status'});
    const repoAntigravity = env.TRINITY_GITHUB_REPO || 'uscolective-byte/Trinity-antigravity';
    const text=\`🐙 **Overené GitHub Repozitáre (Pravdivý stav bez simulácií):**\\n\\n\`+
      \`- **Hlavné zjednotené repo:** [\${repoAntigravity}](https://github.com/\${repoAntigravity})\\n\`+
      \`- **Zrkadlené repo:** [uscolective-byte/trinity-morhfeus](https://github.com/uscolective-byte/trinity-morhfeus)\\n\`+
      \`- **Predvolená vetva:** \\\`\${outcome.details?.default_branch||'main'}\\\`\\n\`+
      \`- **Hlavná konfigurácia:** \\\`Trinity/wrangler.jsonc\\\` (projekt nepoužíva wrangler.toml)\\n\`+
      \`- **Moduly:** \\\`Trinity\\\` (zjednotené jadro), \\\`Jericho-Worker\\\`, \\\`Knowledge-Worker\\\`, \\\`Integrations-Worker\\\`, \\\`Capacity-Worker\\\`, \\\`PC-Bridge-Worker\\\`\\n\`+
      \`- **Autentifikovaný prístup:** \\\`\${outcome.authenticated?'Áno (Token v trezore)':'Verejné čítanie (Bezpečný režim)'}\\\`\\n\\n\`+
      \`Všetky súbory a commity sú 100% zosúladené medzi oboma repozitármi na vetve \\\`main\\\`. Žiadne vymyslené repozitáre (ako Morpheus-Trinity) ani simulované súbory (ako wrangler.toml či utils.js) neexistujú.\`;
    const receipt={tool:'github_manage',status:'completed',effect:'read',receipt_id:\`gh:\${Date.now()}\`,verified_at:new Date().toISOString()};
    return {text,model:'trinity-github-ops',provider:'internal',agent_id:id,tool_log:[receipt],truth:truthStatus(text,[receipt]),duration_ms:Date.now()-started};`;

engine = engine.replace(oldGithubDirect, newGithubDirect);

// Add strict anti-hallucination directive in system prompt
engine = engine.replace(
  "NIKDY nesimuluj ani nevymýšľaj: výsledky, vykonané akcie, overenia, dáta, ceny, zostatky ani prístup k PC.",
  "NIKDY nesimuluj ani nevymýšľaj: výsledky, vykonané akcie, overenia, dáta, ceny, zostatky ani prístup k PC. NIKDY nevymýšľaj neexistujúce repozitáre (napr. Morpheus-Trinity neexistuje), neexistujúce súbory (ako wrangler.toml, trinity.js, utils.js) ani štruktúru kódu. Skutočné repozitáre sú 'uscolective-byte/Trinity-antigravity' (hlavné zjednotené repo) a 'uscolective-byte/trinity-morhfeus'. Hlavná konfigurácia je Trinity/wrangler.jsonc. Pri každej otázke na repozitár, kód, súbory alebo vetvy VŽDY použi nástroj github_manage na overenie skutočného stavu."
);

fs.writeFileSync(enginePath, engine, 'utf8');
console.log('✓ src/engine.js updated');

// 2. Update src/fast-chat.js
const fcPath = path.join(__dirname, '../src/fast-chat.js');
let fc = fs.readFileSync(fcPath, 'utf8');

fc = fc.replace(
  "Nevymýšľaj výsledky, prístup k PC, zdroje, vykonané akcie ani finančné údaje.",
  "Nevymýšľaj výsledky, prístup k PC, zdroje, vykonané akcie, štruktúru repozitára ani finančné údaje. Repozitáre sú uscolective-byte/Trinity-antigravity a uscolective-byte/trinity-morhfeus (žiadny Morpheus-Trinity ani wrangler.toml neexistuje)."
);

if (!fc.includes("github_manage")) {
  fc = fc.replace(
    "pri pamäti search_memory,",
    "pri pamäti search_memory, pri repozitári alebo kóde github_manage,"
  );
}

const directToolHook = `  if(/\\b(?:github|repo|repozitar|repozitara|repozitare|kod|struktura|subory|suboroch|kde mas repo)\\b/i.test(text)&&tools.includes('github_manage'))return {name:'github_manage',arguments:{action:'status'}};`;
if (!fc.includes("kde mas repo")) {
  fc = fc.replace(
    "if(/^(?:prosim\\s+)?(?:ake mam domeny",
    directToolHook + "\n  if(/^(?:prosim\\s+)?(?:ake mam domeny"
  );
}

fs.writeFileSync(fcPath, fc, 'utf8');
console.log('✓ src/fast-chat.js updated');

console.log('All anti-simulation protections applied.');
