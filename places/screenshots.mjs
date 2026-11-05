import './evidence.js?v=3';
import {readScreenshot,stopReader} from './ocr.mjs?v=3';
export function setupScreenshots(onRead){
 const $=s=>document.querySelector(s),db=globalThis.PocketEvidence;
 let images=[],busy=false,urls=[],previewURL;
 const progress=$('#ocr-progress'),message=$('#screenshot-message');
 const say=text=>message.textContent=text;
 function remember(){try{localStorage.setItem('pocket-places-active-images',JSON.stringify(images.map(i=>i.id)));}catch{say('Screenshots are available for this visit; storage could not remember the current selection.');}}
 async function preview(id){
  try{const item=images.find(i=>i.id===id)||await db.get(id);if(!item?.blob){say('The source screenshot is no longer available on this device.');return;}
   if(previewURL)URL.revokeObjectURL(previewURL);previewURL=URL.createObjectURL(item.blob);$('#screenshot-preview-image').src=previewURL;$('#screenshot-preview-image').alt=item.name;$('#screenshot-preview-title').textContent=item.name;$('#screenshot-dialog').showModal();
  }catch{say('Could not open the source screenshot.');}
 }
 $('#screenshot-dialog').addEventListener('close',()=>{if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('#screenshot-preview-image').removeAttribute('src');});
 function render(){
  for(const url of urls)URL.revokeObjectURL(url);urls=[];const list=$('#screenshot-list');list.replaceChildren();
  for(const image of images){
   const row=document.createElement('article');row.className='screenshot-card';
   const view=document.createElement('button');view.type='button';view.className='screenshot-thumb';view.setAttribute('aria-label',`View ${image.name}`);
   const thumb=document.createElement('img');const url=URL.createObjectURL(image.blob);urls.push(url);thumb.src=url;thumb.alt='';view.append(thumb);view.onclick=()=>preview(image.id);
   const info=document.createElement('div');info.className='screenshot-info';const name=document.createElement('strong');name.textContent=image.name;const state=document.createElement('p');state.textContent=image.text?'Text read · review names below':'Ready to read';
   const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Remove';remove.disabled=busy;remove.onclick=()=>{images=images.filter(i=>i.id!==image.id);remember();render();onRead();};
   info.append(name,state,remove);row.append(view,info);
   const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Review or edit recognized text';const text=document.createElement('textarea');text.value=image.text;text.maxLength=60000;text.disabled=busy;text.setAttribute('aria-label',`Recognized text from ${image.name}`);text.addEventListener('change',async()=>{image.text=text.value;try{await db.put(image);onRead();}catch{say('Edited text could not be saved. Keep a copy before leaving.');}});details.append(summary,text);row.append(details);list.append(row);
  }
  $('#read-screenshots').hidden=!images.length;$('#read-screenshots').disabled=busy;$('#screenshots').disabled=busy;
  $('#read-screenshots').textContent=busy?'Reading screenshots…':'Read screenshots';
 }
 async function read(){
  if(busy||!images.length)return;busy=true;render();progress.hidden=false;progress.value=0;
  let completed=0;
  try{
   for(let i=0;i<images.length;i++){
    const image=images[i];say(`Reading screenshot ${i+1} of ${images.length}. Keep this page open; the first load can take a moment.`);
    image.text=await readScreenshot(image.blob,value=>{progress.value=Math.round((i+value/100)/images.length*100);});
    await db.put(image);completed++;
   }
   say('Screenshots read. Check the extracted names against the source images—small text and pronunciation labels can cause mistakes.');
  }catch(error){say(`Read ${completed} of ${images.length}. ${error.message||'Could not read this image.'} Try a clearer crop or edit the recognized text.`);}
  finally{await stopReader().catch(()=>{});busy=false;progress.hidden=true;render();onRead();}
 }
 $('#read-screenshots').onclick=read;
 $('#screenshots').addEventListener('change',async()=>{
  const files=[...$('#screenshots').files];$('#screenshots').value='';if(!files.length)return;
  try{db.validate(files);if(images.length+files.length>10)throw Error('Keep up to 10 screenshots selected. Remove some first.');if(images.reduce((n,i)=>n+i.blob.size,0)+files.reduce((n,f)=>n+f.size,0)>40*1024*1024)throw Error('Keep the selected screenshots under 40 MB total.');images.push(...await db.add(files));remember();render();await read();}catch(error){say(error.message);}
 });
 async function init(ids){
  try{
   let selected=ids;if(!selected?.length)selected=JSON.parse(localStorage.getItem('pocket-places-active-images')||'[]');
   if(!Array.isArray(selected))selected=[];
   images=(await Promise.all([...new Set(selected)].slice(0,10).map(id=>db.get(String(id))))).filter(Boolean);remember();render();
   if(ids?.length&&images.length)await read();else if(images.some(i=>i.text))onRead();
  }catch{say('Could not restore selected screenshots. Your saved places have not been changed.');}
 }
 return {init,preview,items:()=>images.filter(i=>i.text).map(i=>({id:i.id,text:i.text})),hasImages:()=>images.length>0};
}
