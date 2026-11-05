(() => {
  const store=window.TrackerStore;
  const config=window.TRACKER_SYNC_CONFIG || {};
  const SESSION='no-big-deal-session-v1';
  // Confirmation tokens are not needed for password sign-in; keep them out of copied URLs.
  if(location.hash.includes('access_token='))history.replaceState(null,'',location.pathname+location.search);
  const $=selector=>document.querySelector(selector);
  const dialog=$('#account-dialog'),message=$('#account-message'),status=$('#sync-status');
  function publicKey(key) {
    if(typeof key!=='string')return false;
    if(key.startsWith('sb_publishable_'))return true;
    try{return JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role==='anon';}catch{return false;}
  }
  const configured=/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url||'') && publicKey(config.publishableKey);
  let busy=false,again=false,debounce,epoch=0,authBusy=false;
  function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null');}catch{return null;}}
  function setStatus(text){status.textContent=text;}
  function accountUI(){
    const auth=session(),active=store.identity();
    $('#account-button').textContent=auth?'My account':'Sync devices';
    $('#auth-form').hidden=!!auth || !configured;
    $('#account-signed-in').hidden=!auth;
    $('#account-email').textContent=auth?.user?.email || '';
    $('#account-setup').hidden=configured;
    $('#sign-out').hidden=active==='guest' && !auth;
    if(!configured)setStatus('Saved on this device');
    else if(!auth)setStatus(active==='guest'?'Sign in to sync devices':'Sign in again to sync. Local entries are safe.');
  }
  async function request(path,body,token){
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(config.url+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:config.publishableKey,...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
      let data;try{data=await response.json();}catch{throw Error('The sync service returned an unreadable response.');}
      if(!response.ok){const error=Error(data.msg||data.message||data.error_description||'The sync service could not complete the request.');error.status=response.status;throw error;}
      return data;
    }finally{clearTimeout(timeout);}
  }
  function persistSession(data){
    if(!data?.access_token || !data?.refresh_token || !data?.user?.id)throw Error('Sign-in did not return a valid session.');
    const next={access_token:data.access_token,refresh_token:data.refresh_token,user:{id:data.user.id,email:data.user.email},expires_at:data.expires_at || Math.floor(Date.now()/1000)+(data.expires_in||3600)};
    localStorage.setItem(SESSION,JSON.stringify(next));return next;
  }
  async function token(){
    const refresh=async()=>{
      let auth=session();if(!auth)throw Error('Sign in to sync. Your local entries are safe.');
      if(auth.expires_at*1000>Date.now()+60000)return auth;
      const before=epoch;
      try{const data=await request('/auth/v1/token?grant_type=refresh_token',{refresh_token:auth.refresh_token});
        if(before!==epoch)throw Error('Account changed.');return persistSession(data);
      }catch(error){if([400,401].includes(error.status)&&before===epoch){localStorage.removeItem(SESSION);accountUI();}throw error;}
    };
    return navigator.locks?navigator.locks.request('no-big-deal-auth-refresh',refresh):refresh();
  }
  async function sync(){
    if(!configured || !session())return;
    if(!navigator.onLine){setStatus('Offline · changes will sync when connected');return;}
    if(busy){again=true;return;}
    busy=true;again=false;const before=epoch;
    try{
      setStatus('Syncing…');
      const auth=await token();if(before!==epoch)return;
      if(store.identity()!==auth.user.id)throw Error('Sign in again to connect this device.');
      const records=store.records();let remote=[];
      // Small idempotent batches keep free-tier requests modest, including deleted entries.
      for(let i=0;i<Math.max(1,records.length);i+=200){
        let offset=0;
        do {
          remote=await request(`/rest/v1/rpc/sync_tracker?limit=500&offset=${offset}`,{changes:offset?[]:records.slice(i,i+200)},auth.access_token);
          if(before!==epoch || session()?.user.id!==auth.user.id)return;
          store.merge(auth.user.id,remote);offset+=500;
        } while(remote.length===500);
      }
      setStatus('Synced · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
    }catch(error){
      setStatus(navigator.onLine?'Sync paused · entries are saved on this device':'Offline · changes will sync when connected');
      message.textContent=error.status===401?'Your session expired. Sign out and sign in again; your saved entries will be kept.':error.message;
    }finally{busy=false;if(again){again=false;debounce=setTimeout(sync,1000);}}
  }
  $('#account-button').addEventListener('click',()=>{accountUI();dialog.showModal();});
  $('#sync-now').addEventListener('click',sync);
  $('#create-account').addEventListener('click',()=>{$('#auth-form').dataset.mode='signup';$('#auth-submit').textContent='Create free account';$('#create-account').hidden=true;$('#back-to-sign-in').hidden=false;$('#auth-password').autocomplete='new-password';message.textContent='Your existing entries on this device will be added to this account.';});
  $('#back-to-sign-in').addEventListener('click',()=>{$('#auth-form').dataset.mode='signin';$('#auth-submit').textContent='Sign in';$('#create-account').hidden=false;$('#back-to-sign-in').hidden=true;$('#auth-password').autocomplete='current-password';message.textContent='';});
  $('#auth-form').addEventListener('submit',async event=>{
    event.preventDefault();if(authBusy)return;authBusy=true;$('#auth-submit').disabled=true;const before=epoch;
    try{
      if(!navigator.onLine)throw Error('Connect to the internet to sign in. You can still track entries offline.');
      const signup=$('#auth-form').dataset.mode==='signup';
      const body={email:$('#auth-email').value.trim(),password:$('#auth-password').value};
      const data=await request(signup?'/auth/v1/signup?redirect_to='+encodeURIComponent(new URL('./',location.href).href):'/auth/v1/token?grant_type=password',body);
      $('#auth-password').value='';if(before!==epoch)return;
      if(!data.access_token){message.textContent='Check your email to confirm your account, then return here and sign in.';$('#back-to-sign-in').click();message.textContent='Check your email to confirm your account, then sign in here.';return;}
      store.activate(data.user.id);persistSession(data);epoch++;accountUI();message.textContent='Your entries will merge with this account. Sign in to the same account on your other device.';await sync();
    }catch(error){message.textContent=error.message;}
    finally{authBusy=false;$('#auth-submit').disabled=false;}
  });
  $('#sign-out').addEventListener('click',()=>{
    if(!confirm('Sign out? Account entries remain saved on this device for your next sign-in. Your original local entries will be shown.'))return;
    epoch++;clearTimeout(debounce);localStorage.removeItem(SESSION);store.signOut();accountUI();message.textContent='Signed out. Sign in again to resume syncing.';
  });
  store.subscribe(source=>{if(source==='local'||source==='tab'){clearTimeout(debounce);debounce=setTimeout(sync,1000);}});
  window.addEventListener('online',sync);
  window.addEventListener('offline',()=>{if(session())setStatus('Offline · changes will sync when connected');});
  window.addEventListener('focus',sync);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  window.addEventListener('storage',event=>{if(event.key===SESSION){epoch++;accountUI();sync();}});
  // Poll only while visible; offline and local-only use makes no cloud requests.
  setInterval(()=>{if(!document.hidden)sync();},60000);
  try{accountUI();sync();}catch{setStatus('Local data needs attention · export a backup');}
})();
