import {deflateSync} from 'node:zlib';
import {writeFile} from 'node:fs/promises';
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type);const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([len,name,data,crc]);}
for(const size of [192,512]){
  const raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const px=x/size,py=y/size;
    const ink=(py>=.24&&py<.37&&px>=.23&&px<.77)||(py>=.37&&py<.76&&px>=.43&&px<.57);
    const offset=y*(size*4+1)+1+x*4;
    raw.set(ink?[228,228,54,255]:[25,25,22,255],offset);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
  await writeFile(new URL(`../public/assistant/mobile-icon-${size}.png.txt`,import.meta.url),png.toString('base64')+'\n');
  console.log(`Created ${size}x${size} mobile icon (${png.length} bytes).`);
}
