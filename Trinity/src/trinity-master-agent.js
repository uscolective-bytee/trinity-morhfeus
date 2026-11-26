/**
 * @module TRINITY_OMNI_CORE
 * @subsystem CORE_RUNTIME
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul trinity-master-agent.js (Trinity/src/trinity-master-agent.js) v ekosystéme TRINITY OMNI-CORE.
 */
import {trinityMasterStatus} from './trinity-master-status.js';

// A restricted Cloudflare Workers AI diagnostics assistant. No tools, deployment,
// shell access, secrets access or privileged actions are granted to the model.
export async function adviseTrinityMaster(env,input,pcBridge=null){
  const task=typeof input?.task==='string'?input.task.trim():'';
  if(!task||task.length>2000)
    return {success:false,status:'invalid_request',error:'Úloha musí mať 1 až 2000 znakov.',execution_performed:false};
  // Reject credentials even when supplied by an authenticated admin.
  // These requests must never be forwarded to model inference.
  if(/(?:cfat_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|sk-(?:proj-)?[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{20,}|ya29\.[A-Za-z0-9_.-]{10,}|-----BEGIN PRIVATE KEY-----|(?:api[_-]?key|token)\s*[:=]\s*[A-Za-z0-9_-]{12,})/i.test(task))
    return {success:false,status:'sensitive_input_rejected',error:'Do AI diagnostiky nevkladaj API kľúče ani iné poverenia.',execution_performed:false};
  if(typeof env?.AI?.run!=='function')
    return {success:false,status:'not_configured',error:'Cloudflare Workers AI binding nie je dostupný.',execution_performed:false};
  const diagnostics=trinityMasterStatus(env,pcBridge);
  const model=env.AI_MODEL||'@cf/meta/llama-3.3-70b-instruct-fp8-fast';
  const safeSnapshot={
    cloudflare:diagnostics.cloudflare,
    providers:Object.fromEntries(Object.entries(diagnostics.credentials).map(([name,item])=>
      [name,{configured:item.configured===true,verified:item.provider_verified===true,oauth_linked:item.oauth_linked===true}])),
    pc:diagnostics.pc,
    deployment_environment:diagnostics.deployment_environment
  };
  const prompt=[
    'Si TRINITY_MASTER, diagnostický pomocník pre Cloudflare Trinity AI orchestrator.',
    'Poskytuj iba odporúčania a kroky overenia podľa dodaných metadát.',
    'Žiadne skutočné deploy, zmeny súborov, vytvorenie účtu, OAuth prepojenie alebo opravu nesmieš tvrdiť ako vykonanú.',
    'Configured a verified sú odlišné stavy. Chýbajúce dáta nesmieš doplniť odhadom.',
    'Odpovedaj po slovensky, stručne a technicky presne. Nevypisuj ani nežiaduj tajomstvá.',
    'K dispozícii nemáš Shell, PC, sieťové ani GitHub tools.',
    'Diagnostika (iba metadata): '+JSON.stringify(safeSnapshot)
  ].join('\n');
  try{
    const result=await env.AI.run(model,{
      messages:[{role:'system',content:prompt},{role:'user',content:task}],
      max_tokens:600,temperature:0.15
    });
    const answer=typeof result==='string'?result
      :typeof result?.response==='string'?result.response
      :typeof result?.output_text==='string'?result.output_text
      :typeof result?.choices?.[0]?.message?.content==='string'?result.choices[0].message.content:'';
    if(!answer.trim())return {success:false,status:'provider_empty',model,execution_performed:false};
    return {success:true,status:'advice_only',model,answer:answer.slice(0,5000),
      execution_performed:false,verified_action_receipt:null};
  }catch{
    return {success:false,status:'provider_error',model,
      error:'Cloudflare Workers AI nevrátilo overiteľnú odpoveď.',execution_performed:false};
  }
}
