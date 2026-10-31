import css from '../public/assistant/mobile.css';
import script from '../public/assistant/mobile-device.js.txt';
import icon192 from '../public/assistant/mobile-icon-192.png.txt';
import icon512 from '../public/assistant/mobile-icon-512.png.txt';
const assets=new Map([
  ['/mobile.css',[css,'text/css; charset=utf-8']],
  ['/mobile-device.js',[script,'application/javascript; charset=utf-8']],
  ['/mobile-icon-192.png',[Buffer.from(icon192.trim(),'base64'),'image/png']],
  ['/mobile-icon-512.png',[Buffer.from(icon512.trim(),'base64'),'image/png']]
]);
export function handleMobileAsset(request){
  if(request.method!=='GET')return null;
  const asset=assets.get(new URL(request.url).pathname);
  if(!asset)return null;
  return new Response(asset[0],{headers:{'Content-Type':asset[1],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
}
