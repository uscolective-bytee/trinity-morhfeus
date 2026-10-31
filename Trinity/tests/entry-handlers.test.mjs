import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';

test('integration wrappers forward cron and email to the core handler',async()=>{
  const result=await build({entryPoints:['services/integrations-entry.js'],bundle:true,write:false,format:'esm',platform:'node',plugins:[{
    name:'core-event-probe',setup(builder){
      builder.onLoad({filter:/[\\/]src[\\/]index\.js$/},()=>({contents:`
        export class TrinityAgent {} export class ChatAgent {} export class GuardianAgent {} export class TrinityOperations {}
        export default {fetch(){return new Response('core');},scheduled(event,env,ctx){return {event,env,ctx,type:'cron'};},email(message,env,ctx){return {message,env,ctx,type:'email'};}};
      `,loader:'js'}));
    }
  }]});
  const {default:entry}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  const event={cron:'0 0 * * *'},env={},ctx={};
  assert.deepEqual(entry.scheduled(event,env,ctx),{event,env,ctx,type:'cron'});
  const message={from:'test@example.com'};
  assert.deepEqual(entry.email(message,env,ctx),{message,env,ctx,type:'email'});
});
