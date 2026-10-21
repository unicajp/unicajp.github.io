import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {collection,doc,onSnapshot,query,where,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
const root=document.createElement('section');root.id='birthday151';root.hidden=true;root.setAttribute('aria-label','今日のお誕生日');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function today(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));return{year:+p.year,month:+p.month,day:+p.day,key:`${p.year}-${p.month}-${p.day}`};}
let api,authBound=false,owner='',generation=0,rows=[],wishes=[],ready=false,failure=false,day=today(),stopWishes,stopMembers;
const busy=new Set(),messages=new Map();
function mount(){const target=document.getElementById('phase1241Renewal')||document.getElementById('worldHome');if(target&&root.parentElement!==target)target.prepend(root);return !!document.getElementById('phase1241Renewal');}
if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect();});observer.observe(document.getElementById('worldHome')||document.body,{childList:true,subtree:true});}
function currentUser(){return api?.auth.currentUser;}
function linked(){return !!currentUser()?.providerData?.some(p=>p.providerId==='google.com');}
function targets(){return rows.filter(p=>p.uid&&p.birthdayPublic!==false&&Number(p.birthMonth)===day.month&&Number(p.birthDay)===day.day).sort((a,b)=>Number(a.number||0)-Number(b.number||0)||a.uid.localeCompare(b.uid));}
function senders(id){return new Set(wishes.filter(w=>w.targetUid===id&&Number(w.year)===day.year&&typeof w.senderUid==='string'&&w.senderUid&&w.senderUid!==id).map(w=>w.senderUid));}
function render(){
 const list=targets();root.hidden=!list.length;if(!list.length){root.replaceChildren();return;}
 const focus=document.activeElement?.closest?.('[data-b151-send]')?.dataset.b151Send;
 root.innerHTML=`<header class="b151-heading"><span aria-hidden="true">✦</span><div><small>TODAY'S BIRTHDAY</small><h2>今日は、特別な日。</h2></div><time datetime="${day.key}">${day.month}/${day.day}</time></header><div class="b151-people">${list.map(p=>{const own=p.uid===owner,ids=senders(p.uid),sent=ids.has(owner),pending=busy.has(p.uid);return `<article class="b151-person"><span class="b151-icon">${window.UNICA_BLOOM_BADGE?.html?.(p)||'<span aria-hidden="true">✦</span>'}</span><div class="b151-copy"><h3>${esc(p.name||'うにメン')}さん${own?'<small>あなたのお誕生日</small>':''}</h3><p>${own?'お誕生日おめでとう！':'お誕生日おめでとうございます'}</p><span>${ready?`<b>${ids.size}</b>人が${own?'お祝いしてくれました':'お祝い'}`:failure?'お祝いを読み込めませんでした':owner?'お祝いを確認中…':'ログインしてお祝いできます'}</span></div>${own?'':`<button type="button" data-b151-send="${esc(p.uid)}" ${pending||sent||(owner&&!ready&&!failure)?'disabled':''} class="${sent?'is-sent':''}">${pending?'送信中…':sent?'お祝い済み':failure?'再読み込み':linked()?'おめでとう！':'ログインしてお祝い'}</button>`}<p class="b151-status" role="status">${esc(messages.get(p.uid)||'')}</p></article>`;}).join('')}</div><p class="b151-note">お祝いは、お一人につき年に1回。今日だけのボタンです。</p>`;
 if(focus)root.querySelector(`[data-b151-send="${CSS.escape(focus)}"]`)?.focus({preventScroll:true});
}
function receiveRows(list){if(!Array.isArray(list))return;rows=list.filter(p=>p&&typeof p==='object');render();}
window.addEventListener('unica:member-directory',e=>{if(stopMembers){stopMembers();stopMembers=null;}receiveRows(e.detail);});
function listenMembers(){if(Array.isArray(window.UNICA_MEMBER_DIRECTORY_ROWS)){receiveRows(window.UNICA_MEMBER_DIRECTORY_ROWS);return;}if(!stopMembers)stopMembers=onSnapshot(collection(api.db,'users'),s=>receiveRows(s.docs.map(d=>({...d.data(),uid:d.id}))),()=>{rows=[];render();});}
function listenWishes(){stopWishes?.();stopWishes=null;ready=false;failure=false;wishes=[];if(!owner){render();return;}const rev=generation,year=day.year;stopWishes=onSnapshot(query(collection(api.db,'birthdayWishes'),where('year','==',year)),s=>{if(rev!==generation||day.year!==year)return;wishes=s.docs.map(d=>d.data());ready=true;failure=false;render();},()=>{if(rev!==generation)return;ready=false;failure=true;render();});render();}
function refreshDate(){const next=today();if(day.key===next.key)return;const changedYear=day.year!==next.year;day=next;messages.clear();if(changedYear)listenWishes();else render();}
function init(){if(authBound||!window.UNICA_FIREBASE?.db)return;api=window.UNICA_FIREBASE;authBound=true;onAuthStateChanged(api.auth,user=>{generation++;owner=user?.uid||'';messages.clear();busy.clear();stopMembers?.();stopMembers=null;if(owner)listenMembers();listenWishes();});}
['unica:firebase-ready','unica:auth-provider-changed'].forEach(e=>window.addEventListener(e,init));init();
window.addEventListener('unica:firebase-member-restored',()=>render());document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDate();});window.addEventListener('focus',refreshDate);setInterval(refreshDate,30000);
function celebrate(id){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const card=[...root.querySelectorAll('[data-b151-send]')].find(b=>b.dataset.b151Send===id)?.closest('article');if(!card)return;const mark=document.createElement('span');mark.className='b151-celebrate';mark.setAttribute('aria-hidden','true');mark.textContent='✦  ✧  ✦';card.append(mark);setTimeout(()=>mark.remove(),950);}
root.addEventListener('click',async e=>{
 const button=e.target.closest('[data-b151-send]');if(!button)return;refreshDate();const target=targets().find(p=>p.uid===button.dataset.b151Send),sender=currentUser(),rev=generation,eventDay=day;
 if(!target||target.uid===owner)return;
 if(!sender||sender.uid!==owner||!linked()){window.UNICA_MEMBER_GATE?.open?.(true);if(!window.UNICA_MEMBER_GATE?.open)document.getElementById('openMemberGate')?.click();return;}
 if(failure){listenWishes();return;}if(!ready||busy.has(target.uid)||senders(target.uid).has(owner))return;
 busy.add(target.uid);messages.delete(target.uid);render();let created=false;
 try{
  const wishRef=doc(api.db,'birthdayWishes',`${eventDay.year}_${target.uid}_${sender.uid}`);
  await runTransaction(api.db,async tx=>{
   const [wish,member,birthday]=await Promise.all([tx.get(wishRef),tx.get(doc(api.db,'users',sender.uid)),tx.get(doc(api.db,'users',target.uid))]);
   if(generation!==rev||currentUser()?.uid!==sender.uid||!linked())throw Error('ログインが変わりました。もう一度お試しください。');
   if(today().key!==eventDay.key)throw Error('日付が変わりました。誕生日当日にお祝いできます。');
   if(!member.exists())throw Error('うにメン登録後にお祝いできます。');
   const p=birthday.exists()?birthday.data():null;if(!p||p.birthdayPublic===false||Number(p.birthMonth)!==eventDay.month||Number(p.birthDay)!==eventDay.day)throw Error('この方のお祝い受付は終了しました。');
   if(wish.exists()){created=false;return;}
   tx.set(wishRef,{senderUid:sender.uid,targetUid:target.uid,year:eventDay.year,senderName:String(member.data().name||'うにメン'),targetName:String(p.name||'うにメン'),createdAt:serverTimestamp()});created=true;
  });
  if(generation!==rev)return;
  if(!senders(target.uid).has(sender.uid))wishes.push({senderUid:sender.uid,targetUid:target.uid,year:eventDay.year});
  messages.set(target.uid,created?'お祝いを届けました。ありがとうございます！':'すでにお祝い済みです。');
 }catch(error){if(generation===rev){messages.set(target.uid,error.code==='permission-denied'?'お祝いを保存できませんでした。時間をおいてもう一度お試しください。':error.message||'通信を確認して、もう一度お試しください。');render();}}
 finally{if(generation===rev){busy.delete(target.uid);render();if(created)celebrate(target.uid);}}
});
