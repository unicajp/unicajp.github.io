importScripts('vendor/lame.min.js');
onmessage=({data:{left,right,rate}})=>{
 try {const encoder=new lamejs.Mp3Encoder(2,rate,192),parts=[];
 const pcm=a=>{const b=new Int16Array(a.length);for(let i=0;i<a.length;i++)b[i]=Math.round(Math.max(-1,Math.min(1,a[i]))*32767);return b;};
 for(let i=0;i<left.length;i+=1152){const out=encoder.encodeBuffer(pcm(left.subarray(i,i+1152)),pcm(right.subarray(i,i+1152)));if(out.length)parts.push(new Uint8Array(out));if(i%115200===0)postMessage({progress:i/left.length});}
 const end=encoder.flush();if(end.length)parts.push(new Uint8Array(end));postMessage({blob:new Blob(parts,{type:'audio/mpeg'})});
 }catch(e){postMessage({error:e.message});}
};
