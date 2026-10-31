// Private service-binding worker. No public routes, tools, credentials, or database access.
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/health'&&request.method==='GET')return reply({status:env.AI?'serving':'unavailable',ready:!!env.AI,service:'chat-inference',deployment:env.CF_VERSION_METADATA||null},env.AI?200:503);
  if(path!=='/generate')return reply({error:'Not found'},404);
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  const allowed=new Set([env.AI_FAST_MODEL||"@cf/meta/llama-3.1-8b-instruct-fp8-fast",env.AI_FALLBACK_MODEL||"@cf/meta/llama-3.3-70b-instruct-fp8-fast"]);
  let body;
  try{const raw=await request.text();if(raw.length>60000)return reply({error:'Input too large'},413);body=JSON.parse(raw);}catch{return reply({error:'Invalid JSON'},400);}
  if(!allowed.has(body.model)||!Array.isArray(body.messages)||!body.messages.length||body.messages.length>24||body.messages.some(item=>!['system','user','assistant'].includes(item.role)||typeof item.content!=='string'||item.content.length>20000))return reply({error:'Invalid inference request'},400);
  if(!env.AI)return reply({error:'AI binding unavailable'},503);
  try{
   const result=await env.AI.run(body.model,{messages:body.messages,max_tokens:Math.max(1,Math.min(600,Number.isInteger(body.max_tokens)?body.max_tokens:600)),temperature:0.2});
   return reply(result);
  }catch{return reply({error:'Chat inference unavailable'},503);}
 }
};
