const fs = require('fs');
const path = require('path');

// 1. Update src/external-integrations.js
console.log('Updating src/external-integrations.js...');
const extPath = path.join(__dirname, '../src/external-integrations.js');
let ext = fs.readFileSync(extPath, 'utf8');

ext = ext.replace(
  "const repo = params.repo || 'uscolective-byte/trinity-morhfeus';",
  "const repo = params.repo || env.TRINITY_GITHUB_REPO || 'uscolective-byte/Trinity-antigravity';"
);

const newGithubActions = `  if (action === 'get_file' || action === 'read_file') {
    const filePath = params.path || 'README.md';
    const ref = params.ref || env.TRINITY_GITHUB_BRANCH || 'main';
    try {
      const resp = await fetch(\`https://api.github.com/repos/\${repo}/contents/\${filePath.split('/').map(encodeURIComponent).join('/')}?ref=\${encodeURIComponent(ref)}\`, { headers });
      if (!resp.ok) {
        return { success: false, error: \`GitHub HTTP \${resp.status} pri čítaní súboru \${filePath} v \${repo}\` };
      }
      const data = await resp.json();
      let content = '';
      if (data.encoding === 'base64' && data.content) {
        content = Buffer.from(data.content.replace(/\\n/g, ''), 'base64').toString('utf8');
      } else if (typeof data.content === 'string') {
        content = data.content;
      }
      return {
        success: true,
        repo,
        path: filePath,
        ref,
        sha: data.sha,
        size: data.size,
        content: content.slice(0, 32000)
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (action === 'list_files' || action === 'list_tree') {
    const ref = params.ref || env.TRINITY_GITHUB_BRANCH || 'main';
    try {
      const resp = await fetch(\`https://api.github.com/repos/\${repo}/git/trees/\${encodeURIComponent(ref)}?recursive=1\`, { headers });
      if (!resp.ok) {
        return { success: false, error: \`GitHub HTTP \${resp.status} pri načítaní stromu repozitára \${repo}\` };
      }
      const data = await resp.json();
      const files = Array.isArray(data.tree) ? data.tree.map(t => ({
        path: t.path,
        type: t.type,
        size: t.size
      })).slice(0, params.limit || 250) : [];
      return {
        success: true,
        repo,
        ref,
        total: data.tree ? data.tree.length : 0,
        truncated: Boolean(data.truncated),
        files
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
`;

if (!ext.includes("action === 'get_file'")) {
  ext = ext.replace(
    "return { success: false, error: `Neznáma GitHub akcia: ${action}` };",
    newGithubActions + "\n  return { success: false, error: `Neznáma GitHub akcia: ${action}` };"
  );
}

fs.writeFileSync(extPath, ext, 'utf8');
console.log('✓ src/external-integrations.js updated');

// 2. Update src/tools.js
console.log('Updating src/tools.js...');
const toolsPath = path.join(__dirname, '../src/tools.js');
let tools = fs.readFileSync(toolsPath, 'utf8');

tools = tools.replace(
  "action:z.enum(['status','repo_info','list_commits','list_issues','create_issue','dispatch_workflow']).default('status'),",
  "action:z.enum(['status','repo_info','list_commits','list_issues','create_issue','dispatch_workflow','get_file','read_file','list_files','list_tree']).default('status'),"
);

tools = tools.replace(
  "limit:z.number().int().min(1).max(50).optional(),",
  "limit:z.number().int().min(1).max(250).optional(),\n    path:z.string().optional(),"
);

tools = tools.replace(
  "github_manage:'Prepojenie a správa GitHub repozitára (uscolective-byte/trinity-morhfeus), commits, issues, PR a spúšťanie GitHub Actions: {action:status|repo_info|list_commits|list_issues|create_issue|dispatch_workflow, repo?:string, limit?:number, title?:string, body?:string, workflowId?:string, ref?:string}',",
  "github_manage:'Prepojenie a správa GitHub repozitára (uscolective-byte/Trinity-antigravity, uscolective-byte/trinity-morhfeus), čítanie súborov, stromu projektu, commits, issues, PR a spúšťanie GitHub Actions: {action:status|repo_info|list_commits|list_issues|get_file|read_file|list_files|list_tree|create_issue|dispatch_workflow, repo?:string, path?:string, ref?:string, limit?:number}',"
);

fs.writeFileSync(toolsPath, tools, 'utf8');
console.log('✓ src/tools.js updated');

// 3. Update src/fast-chat.js
console.log('Updating src/fast-chat.js...');
const fcPath = path.join(__dirname, '../src/fast-chat.js');
let fc = fs.readFileSync(fcPath, 'utf8');

if (!fc.includes("'github_manage'")) {
  fc = fc.replace(
    "'browser_scrape','browser_render',",
    "'browser_scrape','browser_render','github_manage',"
  );
}

fs.writeFileSync(fcPath, fc, 'utf8');
console.log('✓ src/fast-chat.js updated');

console.log('All files updated successfully.');
