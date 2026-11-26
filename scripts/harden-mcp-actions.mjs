/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul harden-mcp-actions.mjs (scripts/harden-mcp-actions.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'Trinity/src/mcp.js';
let content = fs.readFileSync(path, 'utf8');

const target = `    server.registerTool('approve_system_action',{description:'Schváli navrhnutú systémovú akciu pre vykonanie PC bránou alebo cloudom.',
      inputSchema:{id:z.string().uuid()}},
      async({id})=>result(await approveSystemAction(env,id,'mcp:owner')));

    server.registerTool('reject_system_action',{description:'Zamietne navrhnutú systémovú akciu.',
      inputSchema:{id:z.string().uuid()}},
      async({id})=>result(await rejectSystemAction(env,id,'mcp:owner')));`;

const replacement = `    server.registerTool('approve_system_action',{description:'Schváli navrhnutú systémovú akciu pre vykonanie PC bránou alebo cloudom (vyžaduje zhodné confirmation UUID a admin/project oprávnenie).',
      inputSchema:{id:z.string().uuid(),confirmation:z.string().uuid().optional()}},
      async function({id,confirmation}){
        const allowed = access.admin === true || access.projectControl === true || await projectControlAllowed();
        if(!allowed) return result({error:'Iba overený správca alebo MCP klient s riadením projektu môže autorizovať systémové akcie.'});
        if(confirmation && confirmation !== id) return result({error:'Potvrdenie sa nezhoduje s ID akcie.'});
        const actor = access.principal || (access.admin ? 'mcp:admin' : 'mcp:project-operator');
        return result(await approveSystemAction(env,id,actor));
      });

    server.registerTool('reject_system_action',{description:'Zamietne navrhnutú systémovú akciu.',
      inputSchema:{id:z.string().uuid(),confirmation:z.string().uuid().optional()}},
      async function({id,confirmation}){
        const allowed = access.admin === true || access.projectControl === true || await projectControlAllowed();
        if(!allowed) return result({error:'Iba overený správca alebo MCP klient s riadením projektu môže zamietnuť systémové akcie.'});
        if(confirmation && confirmation !== id) return result({error:'Potvrdenie sa nezhoduje s ID akcie.'});
        const actor = access.principal || (access.admin ? 'mcp:admin' : 'mcp:project-operator');
        return result(await rejectSystemAction(env,id,actor));
      });`;

const normContent = content.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');

if (normContent.includes(normTarget)) {
  const isCrlf = content.includes('\r\n');
  const patched = normContent.replace(normTarget, replacement);
  fs.writeFileSync(path, isCrlf ? patched.replace(/\n/g, '\r\n') : patched, 'utf8');
  console.log('Successfully hardened approve/reject system actions in mcp.js with security checks.');
} else {
  console.error('Target not found in mcp.js');
}
