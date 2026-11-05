/* Shared by the page and service worker. Images never leave browser storage. */
(() => {
  const LIMIT=10,MAX_FILE=12*1024*1024,MAX_TOTAL=40*1024*1024;
  const types=['image/jpeg','image/png','image/webp'];
  function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('pocket-places-evidence-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('images',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not open screenshot storage.'));});}
  async function transaction(mode,action){const db=await open();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('images',mode);let result;const request=action(tx.objectStore('images'));request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(Error('Screenshot could not be stored. Export your list before clearing any browser data.'));});}finally{db.close();}}
  function validate(files){if(files.length>LIMIT)throw Error('Choose up to 10 screenshots at a time.');if(files.some(f=>!types.includes(f.type)))throw Error('Use JPG, PNG, or WebP screenshots.');if(files.some(f=>f.size>MAX_FILE))throw Error('Each screenshot must be under 12 MB.');if(files.reduce((n,f)=>n+f.size,0)>MAX_TOTAL)throw Error('Choose screenshots totaling less than 40 MB.');}
  async function add(files){validate(files);const created=[];try{for(const file of files){const item={id:crypto.randomUUID(),name:file.name||'Shared screenshot',blob:file,text:'',added:new Date().toISOString()};await transaction('readwrite',s=>s.put(item));created.push(item);}return created;}catch(e){for(const item of created)await transaction('readwrite',s=>s.delete(item.id)).catch(()=>{});throw e;}}
  globalThis.PocketEvidence={LIMIT,validate,add,get:id=>transaction('readonly',s=>s.get(id)),put:item=>transaction('readwrite',s=>s.put(item)),remove:id=>transaction('readwrite',s=>s.delete(id))};
})();
