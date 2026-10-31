import {McpServer} from '@modelcontextprotocol/server';
import {serveStdio} from '@modelcontextprotocol/server/stdio';
import {z} from 'zod';
import {TRINITY_VERSION} from '../src/version.js';

const token=process.env.TRINITY_MCP_TOKEN;
if(!token)throw new Error('TRINITY_MCP_TOKEN is missing.');
const base=(process.env.TRINITY_MCP_URL||'https://auru.space').replace(/\/$/,'');
let requestId=0;

function parseRemoteResponse(text){
  const lines=text.split(/\r?\n/).filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trim()).filter(Boolean);
  const payload=lines.length?JSON.parse(lines.at(-1)):JSON.parse(text);
  if(payload.error)throw new Error(payload.error.message||'Trinity MCP request failed.');
  return payload.result;
}

async function remoteTool(name,args={}){
  const response=await fetch(base+'/mcp',{method:'POST',headers:{Authorization:'Bearer '+token,Accept:'application/json, text/event-stream','Content-Type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:++requestId,method:'tools/call',params:{name,arguments:args}}),signal:AbortSignal.timeout(70_000)});
  const text=await response.text();
  if(!response.ok)throw new Error(`Trinity MCP HTTP ${response.status}`);
  return parseRemoteResponse(text);
}

const forward=name=>async args=>remoteTool(name,args);
serveStdio(()=>{
  const server=new McpServer({name:'trinity-secure-bridge',version:TRINITY_VERSION},{instructions:'Read status first. Mutating project or PC actions are proposals until Trinity returns a completed receipt. Never expose credentials or claim that a queued/proposed action already ran.'});
  server.registerTool('trinity_status',{description:'Read verified Trinity readiness and plugin status.',inputSchema:{}},forward('trinity_status'));
  server.registerTool('get_capability_status',{description:'Read current capability configuration, connectivity and execution evidence without secrets.',inputSchema:{}},forward('get_capability_status'));
  server.registerTool('list_agents',{description:'List Trinity specialist roles.',inputSchema:{}},forward('list_agents'));
  server.registerTool('dispatch_task',{description:'Queue bounded work in Trinity; follow with get_task.',inputSchema:{task:z.string().min(1).max(12000),agent:z.string().optional(),mode:z.enum(['single','team']).optional(),provider:z.enum(['workers-ai','openai','gemini','ollama','local']).optional(),language:z.enum(['sk','en']).optional(),idempotency_key:z.string().uuid().optional()}},forward('dispatch_task'));
  server.registerTool('get_task',{description:'Read task state and verified receipts.',inputSchema:{id:z.string().uuid()}},forward('get_task'));
  server.registerTool('search_memory',{description:'Search shared Trinity memory as untrusted context.',inputSchema:{query:z.string().max(200)}},forward('search_memory'));
  server.registerTool('check_services',{description:'Check actual service-binding reachability.',inputSchema:{}},forward('check_services'));
  server.registerTool('list_project_files',{description:'List the bounded Trinity project workspace.',inputSchema:{path:z.string().max(500).optional(),depth:z.number().int().min(1).max(3).optional()}},forward('list_project_files'));
  server.registerTool('get_source_file',{description:'Read a source file through the approved PC bridge.',inputSchema:{path:z.string().min(1).max(500)}},forward('get_source_file'));
  server.registerTool('edit_source_file',{description:'Propose a source-file replacement. It will not run until the owner approves it.',inputSchema:{path:z.string().min(1).max(500),content:z.string().min(1).max(500000),rationale:z.string().min(10).max(500)}},forward('edit_source_file'));
  server.registerTool('run_build',{description:'Propose a bounded Trinity build on the PC bridge. Follow the returned action until a verified receipt exists.',inputSchema:{cwd:z.string().max(500).optional()}},forward('run_build'));
  server.registerTool('request_project_action',{description:'Propose a bounded project or PC action. Mutations require approval and a completed receipt.',inputSchema:{action:z.enum(['read','write','edit','selfwrite','run','deploy','share','upload','upgrade','screenshot','open_app','notify','system_info','scrape','web_fetch','download','git_commit','git_pr']),payload:z.record(z.string(),z.unknown()).default({}),rationale:z.string().min(5).max(1000)}},forward('request_project_action'));
  server.registerTool('get_project_action',{description:'Read the state and receipt of a proposed project action.',inputSchema:{id:z.string().uuid()}},forward('get_project_action'));
  server.registerTool('list_system_actions',{description:'List recent project actions and statuses.',inputSchema:{}},forward('list_system_actions'));
  server.registerTool('pc_status',{description:'Check the PC bridge and its bounded capabilities.',inputSchema:{}},forward('pc_status'));
  return server;
},{onerror:error=>console.error(JSON.stringify({event:'trinity_mcp_error',message:error.message}))});
