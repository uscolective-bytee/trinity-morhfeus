import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
export async function startLocalEvm(){
 const architecture=process.arch==='x64'?'amd64':process.arch,platform=process.platform;
 const binary=fileURLToPath(import.meta.resolve('@foundry-rs/anvil-'+platform+'-'+architecture+'/bin/anvil'+(platform==='win32'?'.exe':'')));
 const reservation=createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');
 const port=reservation.address().port;await new Promise(resolve=>reservation.close(resolve));
 // Local in-memory chain only: no fork URLs, persistent state or wallet secrets.
 const child=spawn(binary,['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','shanghai','--silent'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
 let failure='';child.on('error',e=>{failure=e.message;});child.stderr.on('data',data=>{failure=(failure+data).slice(-1000);});
 const url='http://127.0.0.1:'+port;
 async function close(){if(child.exitCode===null){const exited=once(child,'exit');child.kill();await Promise.race([exited,delay(2000)]);}}
 for(let i=0;i<50;i++){
  if(child.exitCode!==null)throw Error('Local Anvil exited: '+failure);
  try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(300)});
   const data=await response.json();if(data.result!=='0x7a69')throw Error('Unexpected local chain');return {url,close};
  }catch{await delay(100);}
 }
 await close();throw Error('Local Anvil did not start: '+failure);
}
