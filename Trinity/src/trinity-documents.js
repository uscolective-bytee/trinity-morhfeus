import { z } from 'zod';
import { HttpError } from './security.js';
import { generateSimplePdf } from './artifacts.js';

const DOCS_KV_KEY = 'assistant:documents:index';
const MAX_DOCS_INDEX = 120;

export const DOCUMENT_CATEGORIES = [
  'workflow_step',
  'ui_evolution',
  'domain_production',
  'commerce',
  'self_improvement',
  'architecture',
  'manual_doc'
];

export const createDocumentSchema = z.object({
  title: z.string().trim().min(2).max(180),
  category: z.enum(DOCUMENT_CATEGORIES).default('manual_doc'),
  step_name: z.string().trim().max(120).optional().default('manual'),
  summary: z.string().trim().max(1000).optional().default(''),
  content: z.string().trim().min(1).max(100000),
  tags: z.array(z.string().trim().max(40)).max(12).optional().default([]),
  receipt_id: z.string().trim().max(160).optional().nullable()
}).strict();

const memoryCache = new Map();

async function readDocsIndex(env) {
  if (env?.Mastermind?.get) {
    try {
      const raw = await env.Mastermind.get(DOCS_KV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  if (env?.DB?.prepare) {
    try {
      const row = await env.DB.prepare("SELECT value FROM ops_memory WHERE key = ?").bind(DOCS_KV_KEY).first();
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return memoryCache.get(DOCS_KV_KEY) || [];
}

async function writeDocsIndex(env, items) {
  const bounded = items.slice(0, MAX_DOCS_INDEX);
  const serialized = JSON.stringify(bounded);
  memoryCache.set(DOCS_KV_KEY, bounded);
  if (env?.Mastermind?.put) {
    try {
      await env.Mastermind.put(DOCS_KV_KEY, serialized);
    } catch {}
  }
  if (env?.DB?.prepare) {
    try {
      await env.DB.prepare(
        "INSERT INTO ops_memory(key,value,source) VALUES(?,?,'trinity-document') ON CONFLICT(key) DO UPDATE SET value=excluded.value,source='trinity-document',updated_at=datetime('now')"
      ).bind(DOCS_KV_KEY, serialized).run();
    } catch {}
  }
  return bounded;
}

export function formatStepMarkdown({
  id,
  title,
  category,
  step_name,
  actor = 'Trinity AI',
  created_at,
  summary = '',
  content = '',
  tool_log = [],
  receipt_id = null,
  tags = []
}) {
  const lines = [
    `# ${title}`,
    '',
    `- **ID dokumentu**: \`${id}\``,
    `- **Kategória**: \`${category}\``,
    `- **Krok / Operácia**: \`${step_name || 'step'}\``,
    `- **Vyhotovil**: ${actor}`,
    `- **Čas vyhotovenia**: ${created_at}`,
    ...(receipt_id ? [`- **Potvrdenie (Receipt)**: \`${receipt_id}\``] : []),
    ...(tags?.length ? [`- **Štítky**: ${tags.map(t => `\`${t}\``).join(', ')}`] : []),
    ''
  ];
  if (summary) {
    lines.push('## Zhrnutie kroku', '', summary, '');
  }
  if (content) {
    lines.push('## Detailný záznam a výstup', '', content, '');
  }
  if (Array.isArray(tool_log) && tool_log.length > 0) {
    lines.push('## Použité nástroje a dôkazy', '');
    for (const entry of tool_log) {
      lines.push(`- **${entry.tool || entry.name || 'nástroj'}**: stav \`${entry.status || 'completed'}\`${entry.receipt_id ? ` · doklad \`${entry.receipt_id}\`` : ''}`);
    }
    lines.push('');
  }
  lines.push('---', '*Automaticky vygenerované systémom Trinity Documents pri vykonaní kroku.*');
  return lines.join('\n');
}

export async function createTrinityDocument(env, actor = 'Trinity AI', input) {
  const data = createDocumentSchema.parse(input);
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const summary = data.summary || data.content.replace(/[#*`>\n]+/g, ' ').trim().slice(0, 220);
  const markdown = formatStepMarkdown({
    id,
    title: data.title,
    category: data.category,
    step_name: data.step_name,
    actor,
    created_at,
    summary,
    content: data.content,
    receipt_id: data.receipt_id || `doc:${id}`,
    tags: data.tags
  });

  const doc = {
    id,
    title: data.title,
    category: data.category,
    step_name: data.step_name || 'manual',
    actor,
    summary,
    content: data.content,
    markdown,
    tags: data.tags || [],
    receipt_id: data.receipt_id || `doc:${id}`,
    auto_generated: false,
    created_at,
    export_md_url: `/api/assistant/documents/${id}/export?format=md`,
    export_pdf_url: `/api/assistant/documents/${id}/export?format=pdf`
  };

  const existing = await readDocsIndex(env);
  await writeDocsIndex(env, [doc, ...existing.filter(item => item.id !== id)]);

  if (env?.ARTIFACTS?.put) {
    try {
      await env.ARTIFACTS.put(`documents/${id}.md`, markdown, {
        httpMetadata: { contentType: 'text/markdown; charset=utf-8' },
        customMetadata: { id, title: data.title.slice(0, 120), category: data.category }
      });
    } catch {}
  }

  return doc;
}

export async function recordStepDocument(env, {
  title,
  category = 'workflow_step',
  step_name = 'step',
  actor = 'Trinity AI',
  summary = '',
  content = '',
  tool_log = [],
  receipt_id = null,
  tags = []
} = {}) {
  try {
    if (!env) return null;
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const cleanTitle = String(title || 'Krok Trinity').trim().slice(0, 180);
    const cleanSummary = String(summary || content || cleanTitle).replace(/\s+/g, ' ').trim().slice(0, 260);
    const cleanContent = String(content || summary || cleanTitle).slice(0, 40000);
    const safeCategory = DOCUMENT_CATEGORIES.includes(category) ? category : 'workflow_step';
    const markdown = formatStepMarkdown({
      id,
      title: cleanTitle,
      category: safeCategory,
      step_name,
      actor,
      created_at,
      summary: cleanSummary,
      content: cleanContent,
      tool_log,
      receipt_id: receipt_id || `step:${id}`,
      tags
    });

    const doc = {
      id,
      title: cleanTitle,
      category: safeCategory,
      step_name: String(step_name || 'step').slice(0, 120),
      actor: String(actor || 'Trinity AI').slice(0, 100),
      summary: cleanSummary,
      content: cleanContent,
      markdown,
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      receipt_id: receipt_id || `step:${id}`,
      auto_generated: true,
      created_at,
      export_md_url: `/api/assistant/documents/${id}/export?format=md`,
      export_pdf_url: `/api/assistant/documents/${id}/export?format=pdf`
    };

    const existing = await readDocsIndex(env);
    await writeDocsIndex(env, [doc, ...existing.filter(item => item.id !== id)]);

    if (env?.ARTIFACTS?.put) {
      try {
        await env.ARTIFACTS.put(`documents/${id}.md`, markdown, {
          httpMetadata: { contentType: 'text/markdown; charset=utf-8' }
        });
      } catch {}
    }
    return doc;
  } catch {
    return null;
  }
}

export async function listTrinityDocuments(env, { category, search, limit = 50 } = {}) {
  let items = await readDocsIndex(env);
  if (category && category !== 'all') {
    items = items.filter(item => item.category === category);
  }
  if (search && String(search).trim()) {
    const q = String(search).trim().toLowerCase();
    items = items.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.summary || '').toLowerCase().includes(q) ||
      (item.step_name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  }
  const boundedLimit = Math.max(1, Math.min(120, Number(limit) || 50));
  const sliced = items.slice(0, boundedLimit);
  return {
    auto_step_documentation: true,
    total: items.length,
    categories: DOCUMENT_CATEGORIES,
    items: sliced
  };
}

export async function getTrinityDocument(env, id) {
  const items = await readDocsIndex(env);
  const found = items.find(item => item.id === id);
  if (!found) throw new HttpError(404, 'Trinity dokument nebol nájdený.');
  return found;
}

export async function deleteTrinityDocument(env, actor, id) {
  const items = await readDocsIndex(env);
  const filtered = items.filter(item => item.id !== id);
  await writeDocsIndex(env, filtered);
  return { ok: true, deleted_id: id, total: filtered.length };
}

export function exportTrinityDocument(doc, format = 'md') {
  const safeSlug = String(doc.title || 'trinity-dokument')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'trinity-dokument';

  if (format === 'pdf') {
    const bytes = generateSimplePdf({
      title: doc.title,
      author: doc.actor || 'Trinity AI',
      content: `${doc.summary ? doc.summary + '\n\n' : ''}${doc.content || ''}`,
      date: doc.created_at ? new Date(doc.created_at).toLocaleDateString('sk-SK') : new Date().toLocaleDateString('sk-SK')
    });
    return {
      filename: `${safeSlug}.pdf`,
      contentType: 'application/pdf',
      body: bytes
    };
  }

  return {
    filename: `${safeSlug}.md`,
    contentType: 'text/markdown; charset=utf-8',
    body: doc.markdown || `# ${doc.title}\n\n${doc.content || ''}`
  };
}
