import {getPCBridgeStatus} from './system-actions.js';

// Configuration, heartbeat and completed execution are deliberately separate.
export function summarizeCapabilities(env, bridge, actions = [], now = Date.now()) {
  const recent = (action,tasks) => actions.some(row => row.action === action &&
    row.status === 'completed' && Number(row.completed_at) <= now &&
    Number(row.completed_at) > now - 15 * 60_000 && row.receipt_json &&
    (() => { try { const receipt = JSON.parse(row.receipt_json); return receipt &&
      typeof receipt === 'object' && !Array.isArray(receipt) &&
      Object.keys(receipt).length > 0 && receipt.success !== false && (!tasks||tasks.includes(receipt.task)); } catch { return false; } })());
  const groups = [
    {id:'reasoning',name:'Rozhovor a plánovanie',configured:!!env.AI,local:false},
    {id:'memory',name:'Pamäť a projekty',configured:!!env.DB,local:false},
    {id:'media',name:'Obrázky a médiá',configured:!!env.AI && !!env.ARTIFACTS,local:false},
    {id:'files',name:'Čítanie a úprava súborov',configured:!!env.TRINITY_GATEWAY_KEY,local:true,actions:['read','write','edit','selfwrite']},
    {id:'build',name:'Testy a zostavenie projektu',configured:!!env.TRINITY_GATEWAY_KEY,local:true,actions:['run'],tasks:['build','tests']},
    {id:'scripts',name:'Node, Python a CMD skripty',configured:!!env.TRINITY_GATEWAY_KEY,local:true,actions:['run'],tasks:['script']},
    {id:'deploy',name:'Nasadenie projektu',configured:!!env.TRINITY_GATEWAY_KEY,local:true,actions:['deploy']}
  ].map(group => {
    const verified = group.configured && group.local && bridge.connected === true && group.actions.some(action=>recent(action,group.tasks));
    return {...group,actions:undefined,tasks:undefined,status:!group.configured?'not-configured':group.local && !bridge.connected?'offline':verified?'verified':'not-verified',
      execution_verified:!!verified,note:verified?'Existuje doklad vykonania za posledných 15 minút.':group.local?'Vyžaduje pripojenú miestnu bránu a doklad konkrétnej akcie.':'Nakonfigurované; úspech konkrétnej úlohy sa overuje jej výsledkom.'};
  });
  return {checked_at:new Date(now).toISOString(),verification_window_minutes:15,
    pc_connected:bridge.connected === true,groups,
    note:'Zapnutý plugin ani heartbeat nepotvrdzuje vykonanie úlohy. Overenie skupiny nepotvrdzuje všetky jej operácie.'};
}

export async function capabilityStatus(env) {
  const bridge = await getPCBridgeStatus(env);
  const actions = env.DB ? (await env.DB.prepare("SELECT action,status,completed_at,receipt_json FROM ops_system_actions WHERE status='completed' AND completed_at>? ORDER BY completed_at DESC LIMIT 100").bind(Date.now()-15*60_000).all()).results : [];
  return summarizeCapabilities(env,bridge,actions);
}
