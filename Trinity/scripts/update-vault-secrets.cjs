const fs = require('fs');
const path = require('path');

// 1. Update src/secret-vault.js
const vaultPath = path.join(__dirname, '../src/secret-vault.js');
let vault = fs.readFileSync(vaultPath, 'utf8');

vault = vault.replace(
  "github:env?.TRINITY_GITHUB_TOKEN||env?.GITHUB_TOKEN,",
  "github:env?.TRINITY_GITHUB_TOKEN||env?.GITHUB_TOKEN||env?.GITHUBE_API_KEY||env?.GTH||env?.GITHUBE_FINE_TOKEN,"
);
vault = vault.replace(
  "firecrawl:env?.FIRECRAWL_API_KEY||env?.TRINITY_FIRECRAWL_KEY,",
  "firecrawl:env?.FIRECRAWL_API_KEY||env?.TRINITY_FIRECRAWL_KEY||env?.firecrawl,"
);
vault = vault.replace(
  "notion:env?.NOTION_API_KEY,",
  "notion:env?.NOTION_API_KEY||env?.notionaccess,"
);
vault = vault.replace(
  "telegram:env?.TELEGRAM_BOT_TOKEN,",
  "telegram:env?.TELEGRAM_BOT_TOKEN||env?.telegram8842409933,"
);
vault = vault.replace(
  "gemini:env?.GEMINI_API_KEY,",
  "gemini:env?.GEMINI_API_KEY||env?.apigoogle,"
);
vault = vault.replace(
  "groq:env?.GROQ_API_KEY,",
  "groq:env?.GROQ_API_KEY||env?.default_grok_default,"
);

const getStoreHook = `  if(envMap[provider]&&typeof envMap[provider].get==='function'){
    try{const val=await envMap[provider].get();if(val&&typeof val==='string')return val.trim();}catch{}
  }
  if(typeof envMap[provider]==='string'&&envMap[provider].trim())return envMap[provider].trim();`;

if (!vault.includes("envMap[provider].get")) {
  vault = vault.replace(
    "if(typeof envMap[provider]==='string'&&envMap[provider].trim())return envMap[provider].trim();",
    getStoreHook
  );
}

fs.writeFileSync(vaultPath, vault, 'utf8');
console.log('✓ src/secret-vault.js updated with all secret aliases');

// 2. Update src/project-evolution.js
const evoPath = path.join(__dirname, '../src/project-evolution.js');
let evo = fs.readFileSync(evoPath, 'utf8');
evo = evo.replace(
  "const token=env.TRINITY_GITHUB_TOKEN||env.GITHUB_TOKEN;",
  "const token=env.TRINITY_GITHUB_TOKEN||env.GITHUB_TOKEN||env.GITHUBE_API_KEY||env.GTH||env.GITHUBE_FINE_TOKEN;"
);
fs.writeFileSync(evoPath, evo, 'utf8');
console.log('✓ src/project-evolution.js updated with GitHub token aliases');
