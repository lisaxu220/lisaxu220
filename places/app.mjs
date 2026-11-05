import {extractPlaces,placeKey,amapLinks} from './parser.mjs?v=3';
import {setupScreenshots} from './screenshots.mjs?v=3';
const $=s=>document.querySelector(s);
const STORAGE='pocket-places-v1';
let candidates=[],saved=[],picked=new Set(),storageError=false,timer,installPrompt=null;
const android=/Android/i.test(navigator.userAgent);
const screenshots=setupScreenshots(()=>$('#extract-form').requestSubmit());
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function safeLink(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
try{saved=JSON.parse(localStorage.getItem(STORAGE)||'[]');if(!Array.isArray(saved)||!saved.every(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&typeof p.city==='string'&&typeof p.address==='string'))throw Error();picked=new Set(saved.slice(0,10).map(p=>p.id));}catch{saved=[];storageError=true;toast('Saved data could not be loaded. Export a backup before continuing.');}
function notice(text){$('#extraction-message').hidden=!text;$('#extraction-message').textContent=text;}
function selection(){const selected=candidates.filter(p=>p.checked);$('#selected-count').textContent=`${selected.length} selected`;$('#save').disabled=!selected.length;$('#save').textContent=android?'Save & open Amap →':`Save ${selected.length} selected ${selected.length===1?'place':'places'}`;$('#select-all').checked=selected.length===candidates.length;$('#select-all').indeterminate=selected.length>0&&selected.length<candidates.length;}
function field(value,label,cls,onChange){const wrap=el('label',cls);wrap.append(el('span','field-label',label));const input=el('input');input.value=value;input.maxLength=label==='City'?30:label==='Address'?240:100;input.setAttribute('aria-label',label);input.addEventListener('input',()=>onChange(input.value.trim()));wrap.append(input);return wrap;}
function review(){
 $('#found-count').textContent=candidates.length;$('#review-empty').hidden=!!candidates.length;$('#review-content').hidden=!candidates.length;$('#candidates').replaceChildren();
 for(const p of candidates){const row=el('div','candidate');const check=el('input','candidate-check');check.type='checkbox';check.checked=p.checked;check.setAttribute('aria-label',`Select ${p.name}`);check.addEventListener('change',()=>{p.checked=check.checked;selection();});const fields=el('div','candidate-fields');if(p.sourceImageIds?.length){const source=el('button','text-button','Check source screenshot');source.type='button';source.addEventListener('click',()=>screenshots.preview(p.sourceImageIds[0]));fields.append(source);}
  fields.append(field(p.name,'Place name','',v=>{p.name=v;check.setAttribute('aria-label',`Select ${v}`);}),field(p.city,'City','',v=>p.city=v),field(p.address,'Address','address',v=>p.address=v),el('span','candidate-type',p.kind==='address'?'Address text found · check the branch':p.kind==='area'?'Area clue only · check the exact branch':'Name only · Amap search needed'));row.append(check,fields);$('#candidates').append(row);}
 selection();
}
function updateOpen(){const n=picked.size;$('#open-amap').disabled=n===0;$('#open-amap').textContent=n?`Open ${n} in Amap →`:'Open selected in Amap →';}
function persist(next){if(storageError){toast('Export a backup first. Existing saved data was kept.');return false;}try{localStorage.setItem(STORAGE,JSON.stringify(next));saved=next;return true;}catch{toast('Could not save. Your browser storage may be full.');return false;}}
function showSaved(){
 $('#saved-count').textContent=saved.length;$('#saved-empty').hidden=!!saved.length;$('#saved-list').replaceChildren();
 for(const [i,p] of saved.entries()){
  const row=el('article','saved-row');const check=el('input','saved-check');check.type='checkbox';check.checked=picked.has(p.id);check.setAttribute('aria-label',`Search ${p.name}`);check.addEventListener('change',()=>{if(check.checked&&picked.size>=10){check.checked=false;toast('Choose up to 10 places for one search.');return;}if(check.checked)picked.add(p.id);else picked.delete(p.id);updateOpen();});
  const info=el('div','saved-info');info.append(el('h3','',p.name),el('p','',[p.city,p.address].filter(Boolean).join(' · ')||'Name only · check the location in Amap'));
  if(p.sourceImageIds?.length){const source=el('button','text-button source-link','Source screenshot');source.type='button';source.onclick=()=>screenshots.preview(p.sourceImageIds[0]);info.append(source);}
  if(safeLink(p.source)){const source=el('a','source-link','Original post →');source.href=safeLink(p.source);source.target='_blank';source.rel='noopener noreferrer';info.append(source);}
  const open=el('a','open-one','Amap →');const links=amapLinks([p]);open.href=android?links.intent:links.web;if(!android){open.target='_blank';open.rel='noopener';}
  const remove=el('button','remove','×');remove.setAttribute('aria-label',`Remove ${p.name}`);remove.addEventListener('click',()=>{if(!confirm(`Remove “${p.name}” from Pocket Places?`))return;if(persist(saved.filter(a=>a.id!==p.id))){picked.delete(p.id);showSaved();}});
  row.append(check,el('span','place-number',String(i+1).padStart(2,'0')),info,open,remove);$('#saved-list').append(row);
 }
 updateOpen();
}
function openMap(places){
 try{
  const links=amapLinks(places);$('#handoff-status').hidden=false;$('#handoff-status').textContent=`Opening a search for ${places.length} ${places.length===1?'place':'places'}. These stay saved in Pocket Places. Check Amap’s results; this does not add them to Amap favourites.`;const fallback=$('#web-fallback');fallback.href=links.web;fallback.hidden=false;
  if(android)location.href=links.intent;else window.open(links.web,'_blank','noopener');
 }catch(error){toast(error.message);}
}
$('#extract-form').addEventListener('submit',event=>{
 event.preventDefault();const text=$('#post').value.trim();if(!text&&!screenshots.hasImages()){toast('Choose comment screenshots or add some text first.');return;}
 const result=extractPlaces(text,$('#city').value),combined=new Map();
 for(const place of result.places)combined.set(placeKey(place),{...place,sourceImageIds:[],checked:true});
 for(const image of screenshots.items())for(const place of extractPlaces(image.text,$('#city').value).places){const key=placeKey(place);if(combined.has(key)){const item=combined.get(key);item.sourceImageIds=[...new Set([...item.sourceImageIds,image.id])];}else combined.set(key,{...place,sourceImageIds:[image.id],checked:true});}
 candidates=[...combined.values()].slice(0,80);review();
 notice(result.linkOnly&&!screenshots.hasImages()?'Only a post link came through. This version cannot read the post behind that link. Share or copy the full post text once, and we’ll extract its places together.':!candidates.length?'No clear places found yet. If you chose screenshots, review the recognized text above and correct unclear names, then tap Find places.':candidates.length>=80?'Showing the first 80 suggestions. Check names and cities before saving.':'');
 if(candidates.length&&matchMedia('(max-width:730px)').matches)$('#review-content').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
});
$('#select-all').addEventListener('change',()=>{for(const p of candidates)p.checked=$('#select-all').checked;review();});
$('#save').addEventListener('click',()=>{
 const selected=candidates.filter(p=>p.checked);if(!selected.length)return;
 if(selected.some(p=>!p.name.trim())){toast('Give every selected place a name before saving.');return;}
 const next=saved.slice();const keys=new Set(next.map(placeKey));const added=[];
 for(const p of selected){const key=placeKey(p);if(keys.has(key)){const existing=next.find(item=>placeKey(item)===key);existing.sourceImageIds=[...new Set([...(existing.sourceImageIds||[]),...(p.sourceImageIds||[])])];continue;}keys.add(key);const item={id:crypto.randomUUID(),name:p.name,address:p.address,city:p.city,source:p.source,sourceImageIds:p.sourceImageIds||[],added:new Date().toISOString()};next.push(item);added.push(item);}
 if(!persist(next))return;
 const selectedKeys=new Set(selected.map(placeKey));const toOpen=saved.filter(p=>selectedKeys.has(placeKey(p))).slice(0,10);picked=new Set(toOpen.map(p=>p.id));showSaved();toast(added.length?`${added.length} ${added.length===1?'place':'places'} saved to your pocket list.`:'These places are already in your pocket list.');
 if(android)openMap(toOpen);else $('#saved-list').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#open-amap').addEventListener('click',()=>openMap(saved.filter(p=>picked.has(p.id))));
$('#example').addEventListener('click',()=>{$('#city').value='上海';$('#post').value='上海周末咖啡清单 ☕\n1. 蓝瓶咖啡（裕通店）\n地址：静安区裕通路9号\n2. Manner Coffee（南阳路店）\n地址：静安区南阳路205号\n\n记得收藏，周末慢慢逛！';$('#post').dispatchEvent(new Event('input'));toast('Example text loaded. Tap Find places to try it.');});
$('#post').addEventListener('input',()=>$('#char-count').textContent=`${$('#post').value.length.toLocaleString()} / 20,000`);
$('#export').addEventListener('click',()=>{try{const data=storageError?localStorage.getItem(STORAGE):JSON.stringify(saved,null,2);const url=URL.createObjectURL(new Blob([data||'[]'],{type:'application/json'}));const link=el('a');link.href=url;link.download='pocket-places.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{toast('Export could not access browser storage.');}});
$('#install').addEventListener('click',async()=>{if(installPrompt){const prompt=installPrompt;installPrompt=null;await prompt.prompt();await prompt.userChoice;}else $('#install-help').hidden=!$('#install-help').hidden;});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('appinstalled',()=>$('#install').hidden=true);
if(matchMedia('(display-mode: standalone)').matches)$('#install').hidden=true;
window.addEventListener('storage',e=>{if(e.key===STORAGE)location.reload();});
const params=new URLSearchParams(location.search);const shared=[params.get('title'),params.get('text'),params.get('url')].filter(Boolean).join('\n').slice(0,20000);
if(shared){$('#post').value=shared;history.replaceState(null,'',location.pathname);$('#post').dispatchEvent(new Event('input'));$('#extract-form').requestSubmit();}
showSaved();
screenshots.init(params.get('images')?.split(',').filter(Boolean));
if(params.has('share-error'))notice(params.get('share-error'));
if(params.has('images')||params.has('share-error'))history.replaceState(null,'',location.pathname);
if('serviceWorker' in navigator&&isSecureContext){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(registration=>{if(registration.active)return registration;return new Promise((resolve,reject)=>{const worker=registration.installing||registration.waiting;if(!worker){reject(Error('No offline worker'));return;}const check=()=>{if(worker.state==='activated')resolve(registration);if(worker.state==='redundant')reject(Error('Offline installation failed'));};worker.addEventListener('statechange',check);check();});}).then(()=>$('#offline-status').textContent='Ready offline · Amap searches still need a connection.').catch(()=>$('#offline-status').textContent='Offline setup didn’t finish. Reconnect and refresh to try again.');}
