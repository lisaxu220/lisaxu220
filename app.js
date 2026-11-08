const KEY='no-big-deal-attempts-v1';
const milestones=[{at:1,name:'First brave no',icon:'✦',message:'You made the ask. That’s where it starts.'},{at:10,name:'Getting out there',icon:'✺',message:'Ten no’s. Ten chances you took.'},{at:25,name:'Taking chances',icon:'❋',message:'A quarter of the way. Look at you go.'},{at:50,name:'Halfway hero',icon:'◈',message:'Fifty no’s collected. That takes courage.'},{at:75,name:'Going all in',icon:'✹',message:'Seventy-five. Keep making room for possibility.'},{at:100,name:'The 100 club',icon:'★',message:'One hundred no’s. A hundred times you showed up.'}];
const labels={job:'Job',internship:'Internship',scholarship:'Scholarship',other:'Other'};
const $=s=>document.querySelector(s);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
let attempts=[],filter='all',selected=null,timer,storageInvalid=false;
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500);}
try{const data=window.TrackerStore.read();if(!Array.isArray(data)||data.some(a=>!a||typeof a.id!=='string'||typeof a.name!=='string'||!labels[a.type]||!['waiting','rejected','accepted'].includes(a.status)||!/^\d{4}-\d{2}-\d{2}$/.test(a.applied)||a.status==='rejected'&&!/^\d{4}-\d{2}-\d{2}$/.test(a.rejected)))throw Error();attempts=data;}catch{storageInvalid=true;notify('Saved data could not be loaded. Export a backup before continuing.');}
function save(next){if(storageInvalid){notify('Saved data could not be loaded. Export a backup before continuing.');return false;}try{window.TrackerStore.save(next);attempts=next;render();return true;}catch{notify('Could not save. Check browser storage or export your data.');return false;}}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(text,cls,action){const b=el('button',cls,text);b.type='button';b.addEventListener('click',action);return b;}
function dateLabel(value){return new Date(value+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function entryDates(a){
 const dates=[];
 if(a.appliedKnown!==false)dates.push(`Applied ${dateLabel(a.applied)}`);
 if(a.status==='rejected')dates.push(`Rejected ${dateLabel(a.rejected)}`);
 else if(a.status==='accepted'&&a.outcomeDate)dates.push(`Accepted ${dateLabel(a.outcomeDate)}`);
 else if(a.appliedKnown===false&&a.recordedDate)dates.push(`Recorded ${dateLabel(a.recordedDate)}`);
 return dates.join(' · ');
}
function showDetail(id){selected=id;const rejected=attempts.filter(a=>a.status==='rejected'),a=rejected.find(a=>a.id===id);if(!a)return;$('#detail-number').textContent=`COLLECTED NO. ${rejected.indexOf(a)+1}`;$('#detail-title').textContent=a.name;$('#detail-type').textContent=`${labels[a.type]} · ${entryDates(a)}`;$('#rejected-date').value=a.rejected;$('#detail').showModal();}
function celebrate(milestone){
 notify(`Badge unlocked: ${milestone.name}! ${milestone.message}`);
 clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),6500);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const burst=el('div','celebration');burst.setAttribute('aria-hidden','true');
 for(let i=0;i<24;i++){const piece=el('span','confetti');piece.style.setProperty('--x',`${Math.random()*100}vw`);piece.style.setProperty('--delay',`${Math.random()*.5}s`);piece.style.setProperty('--turn',`${Math.random()*720}deg`);piece.style.background=['#ed7958','#9badd4','#d8b958','#96b29a'][i%4];burst.append(piece);}
 document.body.append(burst);setTimeout(()=>burst.remove(),2800);
}
function renderRewards(count){
 const next=milestones.find(m=>m.at>count),earned=milestones.filter(m=>m.at<=count).length;
 $('#badge-count').textContent=`${earned} / ${milestones.length} BADGES`;
 $('#next-reward').textContent=next?`${next.at-count} more ${next.at-count===1?'no':'no’s'} to “${next.name}”`:'You’re in the 100 club. Every badge, well earned.';
 const progress=$('#reward-progress');progress.max=next?next.at:100;progress.value=Math.min(count,next?next.at:100);progress.setAttribute('aria-label',next?`Progress toward ${next.name}`:'All badges unlocked');
 const list=$('#badges');list.replaceChildren();
 for(const m of milestones){const unlocked=count>=m.at,item=el('li',`badge ${unlocked?'unlocked':'locked'}`),icon=el('span','badge-icon',m.icon);icon.setAttribute('aria-hidden','true');item.append(icon,el('strong','',m.name),el('span','badge-threshold',`${m.at} ${m.at===1?'rejection':'rejections'}`),el('span','badge-state',unlocked?'✓ Unlocked':'To unlock'));list.append(item);}
}
function changeStatus(id,status){
 const before=attempts.filter(a=>a.status==='rejected').length;
 if(!save(attempts.map(a=>a.id===id?{...a,status,rejected:status==='rejected'?today():null,outcomeDate:status==='accepted'?today():null}:a)))return;
 const count=attempts.filter(a=>a.status==='rejected').length;
 const milestone=milestones.find(m=>before<m.at&&count>=m.at);
 if(milestone){celebrate(milestone);return;}
 notify(status==='rejected'?'One more no. One more brave ask. ✦':status==='accepted'?'An unexpected yes! Take the win. ✳':'Back to waiting.');
}
function render(){const rejected=attempts.filter(a=>a.status==='rejected');renderRewards(rejected.length);$('#count').textContent=rejected.length;$('#total').textContent=attempts.length;$('#progress-copy').textContent=rejected.length>=100?'100 no’s collected. Keep taking chances!':rejected.length?`${100-rejected.length} more no’s. So many possibilities.`:'Every dot starts with an ask.';$('#board').replaceChildren();for(let i=0;i<100;i++){const a=rejected[i];let dot;if(a){dot=button('✦',`dot filled ${a.type}`,()=>showDetail(a.id));dot.setAttribute('aria-label',`Rejection ${i+1}: ${a.name}, ${dateLabel(a.rejected)}. Edit date`);dot.title=`${a.name} · ${dateLabel(a.rejected)}`;}else{dot=el('span','dot',String(i+1));dot.setAttribute('aria-label',`Milestone ${i+1}, still to come`);}$('#board').append(dot);}const list=$('#attempt-list');list.replaceChildren();const shown=attempts.filter(a=>filter==='all'||a.status===filter).slice().reverse();if(!shown.length){const empty=el('div','empty');empty.append(el('span','empty-icon','→'),el('h3','',attempts.length?'Nothing here just yet.':'Your next “no” starts with a hello.'),el('p','',attempts.length?'Your attempts will appear here when their status matches.':'Add your first attempt above. You don’t have to feel ready.'));list.append(empty);}for(const a of shown){const row=el('article','attempt-row'),info=el('div','attempt-info');info.append(el('h3','',a.name),el('p','',`${labels[a.type]} · ${entryDates(a)}`));const actions=el('div','row-actions');if(a.status==='waiting')actions.append(button('Rejected +1','outcome reject',()=>changeStatus(a.id,'rejected')),button('Accepted ✧','outcome',()=>changeStatus(a.id,'accepted')));else{if(a.status==='rejected')actions.append(button('Rejected · Edit date','status-badge',()=>showDetail(a.id)));else actions.append(el('span','status-badge accepted','Unexpected win ✧'));actions.append(button('Undo','undo',()=>changeStatus(a.id,'waiting')));}const remove=button('×','delete',()=>{if(confirm(`Delete “${a.name}”? This also removes its progress dot.`))save(attempts.filter(x=>x.id!==a.id));});remove.setAttribute('aria-label',`Delete ${a.name}`);actions.append(remove);row.append(el('span',`type-icon ${a.type}`,'→'),info,actions);list.append(row);}}
function updateEntryForm(){
 const status=$('#entry-status').value;
 $('#entry-date-label').textContent=status==='rejected'?'Date rejected':status==='accepted'?'Date accepted':'Date applied';
 $('#add-entry').replaceChildren(document.createTextNode(status==='rejected'?'Add rejection ':'Add an attempt '),el('span','','→'));
}
$('#entry-date').value=today();
$('#entry-status').addEventListener('change',updateEntryForm);
$('#attempt-form').addEventListener('submit',e=>{
 e.preventDefault();const name=$('#opportunity').value.trim();
 if(!name){$('#opportunity').setCustomValidity('Enter an opportunity.');$('#opportunity').reportValidity();return;}
 const status=$('#entry-status').value,date=$('#entry-date').value;
 if(!['rejected','waiting','accepted'].includes(status)||!date)return;
 const before=attempts.filter(a=>a.status==='rejected').length;
 // Keep the required legacy date field for existing sync schemas. The flag prevents
 // an outcome date being presented as an application date, without a database migration.
 const item={id:crypto.randomUUID(),name,type:$('#type').value,applied:date,appliedKnown:status==='waiting',recordedDate:date,status,rejected:status==='rejected'?date:null,outcomeDate:status==='accepted'?date:null};
 if(save([...attempts,item])){
  $('#opportunity').value='';$('#entry-date').value=today();$('#entry-status').value='rejected';updateEntryForm();
  const count=attempts.filter(a=>a.status==='rejected').length;
  const milestone=milestones.find(m=>before<m.at&&count>=m.at);
  if(milestone)celebrate(milestone);
  else notify(status==='rejected'?'Rejection collected. One more brave ask. ✦':status==='accepted'?'An unexpected yes! Take the win. ✳':'Attempt added. Fingers crossed.');
  $('#opportunity').focus();
 }
});
$('#opportunity').addEventListener('input',()=>$('#opportunity').setCustomValidity(''));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();}));
$('#save-date').addEventListener('click',()=>{const date=$('#rejected-date').value;if(!date){$('#rejected-date').reportValidity();return;}if(save(attempts.map(a=>a.id===selected?{...a,rejected:date}:a))){$('#detail').close();notify('Rejection date updated.');}});
$('#export').addEventListener('click',()=>{try{const url=URL.createObjectURL(new Blob([(storageInvalid?window.TrackerStore.rawBackup():JSON.stringify(attempts))],{type:'application/json'})),link=el('a');link.href=url;link.download=`no-big-deal-${today()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{notify('Browser storage is unavailable.');}});
window.TrackerStore.subscribe(source=>{if(source!=='local'){try{attempts=window.TrackerStore.read();render();}catch{notify('Could not load synced entries. Local data was kept.');}}});render();
