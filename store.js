/* One atomic browser record holds separate guest/account spaces and deletion markers. */
(() => {
  const KEY = 'no-big-deal-store-v2';
  const LEGACY = 'no-big-deal-attempts-v1';
  const kinds = ['job','internship','scholarship','other'];
  const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  function validItem(a) {
    return a && typeof a.id === 'string' && a.id.length > 0 && a.id.length <= 200 &&
      typeof a.name === 'string' && a.name.trim().length > 0 && a.name.length <= 160 &&
      kinds.includes(a.type) && ['waiting','rejected','accepted'].includes(a.status) &&
      date(a.applied) && (a.status !== 'rejected' || date(a.rejected));
  }
  function validRecord(r) {
    return r && typeof r.id === 'string' && r.id.length > 0 && r.id.length <= 200 &&
      Number.isSafeInteger(r.modified) && r.modified >= 0 && typeof r.change_id === 'string' &&
      r.change_id.length > 0 && r.change_id.length <= 200 && typeof r.deleted === 'boolean' &&
      (r.deleted ? r.payload === null : validItem(r.payload) && r.payload.id === r.id);
  }
  function load() {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (!state || !state.spaces || typeof state.active !== 'string' || !state.spaces[state.active]) throw Error('Saved tracker data is invalid. Export a backup before continuing.');
      for (const space of Object.values(state.spaces)) {
        if (!space || !Array.isArray(space.records) || !space.records.every(validRecord)) throw Error('Saved tracker data is invalid.');
      }
      return state;
    }
    const old = JSON.parse(localStorage.getItem(LEGACY) || '[]');
    if (!Array.isArray(old) || !old.every(validItem)) throw Error('Existing entries could not be loaded.');
    return {active:'guest', spaces:{guest:{records:old.map((payload, i) => ({id:payload.id,payload,deleted:false,modified:i+1,change_id:'migration'}))}}};
  }
  const listeners = [];
  function emit(source) { for (const listener of listeners) listener(source); }
  function commit(state, source) { localStorage.setItem(KEY, JSON.stringify(state)); emit(source); }
  function newer(a,b) { return a.modified > b.modified || a.modified === b.modified && a.change_id > b.change_id; }
  window.TrackerStore = {
    validItem,
    read() { const state=load();return state.spaces[state.active].records.filter(r => !r.deleted).map(r => r.payload); },
    identity() { return load().active; },
    records() { const s=load(); return s.spaces[s.active].records; },
    save(items) {
      if (!Array.isArray(items) || !items.every(validItem)) throw Error('Invalid opportunity.');
      const state=load(), space=state.spaces[state.active];
      const records=new Map(space.records.map(r=>[r.id,r]));
      let clock=Math.max(Date.now(), ...space.records.map(r=>r.modified));
      const stamp=(id,payload,deleted)=>({id,payload,deleted,modified:++clock,change_id:crypto.randomUUID()});
      const ids=new Set(items.map(a=>a.id));
      for (const item of items) {
        const old=records.get(item.id);
        if (!old || old.deleted || JSON.stringify(old.payload)!==JSON.stringify(item)) records.set(item.id,stamp(item.id,item,false));
      }
      for (const old of records.values()) if (!old.deleted && !ids.has(old.id)) records.set(old.id,stamp(old.id,null,true));
      space.records=[...records.values()];
      commit(state,'local');
    },
    activate(user) {
      if (typeof user !== 'string' || !/^[0-9a-f-]{36}$/i.test(user)) throw Error('Invalid account.');
      const state=load();
      if (state.active !== 'guest' && state.active !== user) throw Error('Sign out before switching accounts.');
      // Import the existing guest entries once per account, keeping their original IDs.
      if (!state.spaces[user]) state.spaces[user]=structuredClone(state.spaces.guest);
      state.active=user;commit(state,'account');
    },
    signOut() {const state=load();state.active='guest';commit(state,'account');},
    merge(user, remote) {
      if (!Array.isArray(remote) || !remote.every(validRecord)) throw Error('The server returned invalid entries. Your local data was kept.');
      const state=load();if(state.active!==user)return;
      const records=new Map(state.spaces[user].records.map(r=>[r.id,r]));
      for(const record of remote){const old=records.get(record.id);if(!old||newer(record,old))records.set(record.id,record);}
      state.spaces[user].records=[...records.values()];commit(state,'remote');
    },
    subscribe(listener) {listeners.push(listener);},
    rawBackup() { return localStorage.getItem(KEY) || localStorage.getItem(LEGACY) || '[]'; }
  };
  window.addEventListener('storage',e=>{if(e.key===KEY)emit('tab');});
})();
