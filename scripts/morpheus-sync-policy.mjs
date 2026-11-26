/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul morpheus-sync-policy.mjs (scripts/morpheus-sync-policy.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
// Conservative release gate for automated Morpheus -> Trinity sync.
// Mirror refs preserve source history; only low-risk text documentation
// may merge automatically after the exact source merge passes security CI.
export const REQUIRED_CHECK_NAMES=Object.freeze([
  'Cloudflare build, tests, dependency and AI policy',
  'check',
  'Analyze JavaScript and TypeScript',
  'token-tests',
  'audit (Trinity)'
]);
export function requiresHumanReview(paths){
  if(!Array.isArray(paths)||paths.length===0)return true;
  return paths.some(path=>{
    if(typeof path!=='string'||!path.trim())return true;
    if(/^\.github\//i.test(path))return true;
    if(/(^|\/)(src|migrations|workers|contracts|security|integrations|scripts)\//i.test(path))return true;
    if(/\.(?:js|mjs|cjs|ts|tsx|jsx|sql|sh|ps1|cmd|bat|jsonc?|toml|yaml|yml|sol)$/i.test(path))return true;
    if(/(secret|token|wallet|auth|payment|deploy|wrangler|package-lock|package\.json)/i.test(path))return true;
    return !/\.(?:md|mdx|txt|rst)$/i.test(path);
  });
}
export function approvedCheckRuns(checks){
  if(!Array.isArray(checks))return false;
  const latest=new Map();
  for(const check of checks.filter(c=>c.app?.slug==='github-actions')){
    const prior=latest.get(check.name);
    if(!prior||(check.started_at||'').localeCompare(prior.started_at||'')>0||
      ((check.started_at||'')===(prior.started_at||'')&&(check.id||0)>(prior.id||0)))
      latest.set(check.name,check);
  }
  for(const name of REQUIRED_CHECK_NAMES){
    const run=latest.get(name);
    if(!run||run.status!=='completed'||run.conclusion!=='success')return false;
  }
  return [...latest.values()].every(c=>c.status==='completed'&&['success','skipped','neutral'].includes(c.conclusion));
}
