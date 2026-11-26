/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul trinity-master-secrets.js (Trinity/src/trinity-master-secrets.js) v ekosystéme TRINITY OMNI-CORE.
 */
/**
 * TRINITY_MASTER — named, least-privilege Secrets Store integration.
 *
 * Store metadata is public deployment configuration; secret values are never
 * returned to API clients, logged, persisted, or surfaced in diagnostics.
 * Cloudflare Secrets Store bindings use asynchronous binding.get().
 */
export const TRINITY_MASTER_NAME='TRINITY_MASTER';

export const TRINITY_MASTER_BINDINGS=Object.freeze({
  gemini:'TRINITY_MASTER_GOOGLE',
  copilot:'TRINITY_MASTER_COPILOT'
});

/**
 * Presence is not provider verification. Never invoke .get() from a public
 * "status" handler: reading secret material must remain server-internal.
 */
export function trinityMasterBindingStatus(env){
  return {
    controller:TRINITY_MASTER_NAME,
    status:'configuration_only',
    live_verified:false,
    providers:Object.fromEntries(Object.entries(TRINITY_MASTER_BINDINGS)
      .map(([provider,binding])=>[provider,{
        binding,
        configured:typeof env?.[binding]?.get==='function',
        verified:false
      }]))
  };
}

/**
 * Server-side only. Resolves an allowlisted Secrets Store binding for a
 * trusted provider adapter, never performs arbitrary binding-name lookups.
 */
export async function readTrinityMasterSecret(env,provider){
  const binding=Object.hasOwn(TRINITY_MASTER_BINDINGS,provider)
    ?TRINITY_MASTER_BINDINGS[provider]:null;
  if(!binding||typeof env?.[binding]?.get!=='function')return null;
  try{
    const value=await env[binding].get();
    return typeof value==='string'&&value.trim()?value.trim():null;
  }catch{
    // A binding may be absent, out of scope or unavailable. Never print an
    // exception body, since some providers embed secrets into exceptions.
    return null;
  }
}
