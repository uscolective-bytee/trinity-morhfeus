/**
 * @module TRINITY_OMNI_CORE
 * @subsystem AUTOMATION_AND_OPS_SCRIPTS
 * @author Basterix (Root Architect)
 * @license Sovereign Irrevocable Covenant
 * @description Modul fix-mcp-syntax.mjs (scripts/fix-mcp-syntax.mjs) v ekosystéme TRINITY OMNI-CORE.
 */
import fs from 'node:fs';

const path = 'Trinity/src/mcp.js';
let lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const newLines = [
  "    server.registerTool('approve_system_action',{description:'Schváli navrhnutú systémovú akciu pre vykonanie PC bránou alebo cloudom.',",
  "      inputSchema:{id:z.string().uuid()}},",
  "      async({id})=>result(await approveSystemAction(env,id,'mcp:owner')));",
  "",
  "    server.registerTool('reject_system_action',{description:'Zamietne navrhnutú systémovú akciu.',",
  "      inputSchema:{id:z.string().uuid()}},",
  "      async({id})=>result(await rejectSystemAction(env,id,'mcp:owner')));"
];

// Replace lines 205..211 (0-indexed 204..211)
lines.splice(204, 7, ...newLines);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('mcp.js successfully fixed with correct bracket placement.');
