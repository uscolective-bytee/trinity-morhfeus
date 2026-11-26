/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul trinity-master-status.js (Trinity/src/trinity-master-status.js) v ekosystéme TRINITY OMNI-CORE.
 */
import {trinityMasterBindingStatus} from './trinity-master-secrets.js';

// Metadata-only control-plane inventory. Do not read secret values here.
// An env binding and an authenticated external account are different facts.
export function trinityMasterStatus(env,pcBridge=null){
  const store=trinityMasterBindingStatus(env);
  const configured=(name)=>typeof env?.[name]==='string'&&env[name].trim().length>0;
  const connectedPC=pcBridge?.connected===true;
  return {
    controller:'TRINITY_MASTER',
    status:'configuration_inventory',
    checked_at:new Date().toISOString(),
    deployment_environment:env?.TRINITY_ENV||'unknown',
    canonical_repository:env?.TRINITY_GITHUB_REPO||'uscolective-byte/Trinity-antigravity',
    cloudflare:{
      workers_ai:{configured:typeof env?.AI?.run==='function',provider_verified:false},
      database:{configured:typeof env?.DB?.prepare==='function',schema_verified:false},
      storage:{configured:typeof env?.ARTIFACTS?.get==='function',access_verified:false},
      mcp:{configured:typeof env?.MCP_SERVICE?.fetch==='function',connected:false}
    },
    credentials:{
      gemini:{binding:store.providers.gemini.binding,configured:store.providers.gemini.configured||configured('GEMINI_API_KEY'),oauth_linked:false,provider_verified:false},
      copilot:{binding:store.providers.copilot.binding,configured:store.providers.copilot.configured||configured('COPILOT_API_TOKEN'),oauth_linked:false,provider_verified:false},
      chatgpt_openai_api:{configured:configured('OPENAI_API_KEY'),chatgpt_account_linked:false,provider_verified:false},
      claude_anthropic_api:{configured:configured('ANTHROPIC_API_KEY'),claude_account_linked:false,provider_verified:false},
      github:{configured:configured('TRINITY_GITHUB_TOKEN')||configured('GITHUB_TOKEN'),authenticated:false,repository_permissions_verified:false},
      codex:{github_repository_workflow:true,codex_account_linked:false}
    },
    pc:{
      status:pcBridge==null?'unknown':connectedPC?'bridge-reported-connected':'offline',
      connected:connectedPC,
      execution_verified:false
    },
    safety:{
      metadata_only:true,
      secrets_read:false,
      changes_performed:false,
      owner_authorization_required:true
    }
  };
}
