const asset=name=>new URL('./vendor/ocr/'+name,import.meta.url).href;
let worker=null,loading=null,report=()=>{};
function library(){if(globalThis.Tesseract)return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=asset('tesseract.min.js');s.onload=resolve;s.onerror=()=>{s.remove();reject(Error('The screenshot reader could not load. Connect once and refresh.'));};document.head.append(s);});}
async function getWorker(){
 if(worker)return worker;if(loading)return loading;
 loading=(async()=>{await library();worker=await Tesseract.createWorker('chi_sim',1,{workerPath:asset('worker.min.js'),corePath:asset('tesseract-core-lstm.wasm.js'),langPath:asset('lang'),workerBlobURL:false,gzip:true,cacheMethod:'write',logger:event=>{if(event.status==='recognizing text')report(Math.round(event.progress*100));}});return worker;})();
 try{return await loading;}finally{loading=null;}
}
export async function readScreenshot(blob,onProgress){
 report=onProgress;const w=await getWorker();let bitmap;
 try{
  bitmap=await createImageBitmap(blob);
  if(bitmap.width*bitmap.height>24000000||bitmap.height>30000)throw Error('This scrolling screenshot is very long. Split it into smaller screenshots.');
  // Upscale small comment text; process long screenshots in overlapping strips.
  const scale=Math.min(3,1800/bitmap.width),width=Math.max(1,Math.round(bitmap.width*scale));
  const sourceHeight=Math.max(1,Math.floor(2400/scale)),overlap=Math.round(100/scale),texts=[];
  const count=Math.ceil(bitmap.height/Math.max(1,sourceHeight-overlap));
  for(let y=0,part=0;y<bitmap.height;y+=sourceHeight-overlap,part++){
   const h=Math.min(sourceHeight,bitmap.height-y),canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(h*scale);
   const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,y,bitmap.width,h,0,0,canvas.width,canvas.height);
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);let light=0,total=0;
   for(let i=0;i<pixels.data.length;i+=64){light+=pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114;total++;}
   const dark=light/total<115;
   for(let i=0;i<pixels.data.length;i+=4){let value=pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114;if(dark)value=255-value;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;}
   ctx.putImageData(pixels,0,0);
   report=p=>onProgress(Math.round(((part+p/100)/count)*100));
   const {data}=await w.recognize(canvas);texts.push(data.text);canvas.width=canvas.height=1;
   if(y+h>=bitmap.height)break;
  }
  onProgress(100);return texts.join('\n');
 }catch(error){if(error instanceof Error)throw error;throw Error(String(error));}finally{bitmap?.close();}
}
export async function stopReader(){const old=worker;worker=null;if(old)await old.terminate();}
