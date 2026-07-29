import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDbd5CZCWKd-CYlvwAvR7AyY3G94_CdkgU', authDomain: 'unica-world.firebaseapp.com', projectId: 'unica-world',
  storageBucket: 'unica-world.firebasestorage.app', messagingSenderId: '640407918994', appId: '1:640407918994:web:64e30aa04e3496da46094b'
};
const app=getApps()[0]||initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const member=()=>{try{return JSON.parse(localStorage.getItem('unicaWorldMemberV4')||localStorage.getItem('unicaWorldMemberV3')||'null')}catch{return null}};
let members=[], selectedMonth=new Date().getMonth()+1, celebrationTimer=null, uid=null, myWishes=new Set(), wishRows=[];

function toast(text){const el=$('#miniToast');if(!el)return;el.textContent=text;el.classList.add('is-show','is-visible');setTimeout(()=>el.classList.remove('is-show','is-visible'),2300)}
function publicBirthdays(){return members.filter(x=>x&&x.birthdayPublic!==false&&Number(x.birthMonth)>=1&&Number(x.birthMonth)<=12&&Number(x.birthDay)>=1&&Number(x.birthDay)<=31)}
function membersForMonth(month){return publicBirthdays().filter(x=>Number(x.birthMonth)===Number(month)).sort((a,b)=>Number(a.birthDay)-Number(b.birthDay)||String(a.name||'').localeCompare(String(b.name||''),'ja'))}
function todayMembers(){const n=new Date();return publicBirthdays().filter(x=>Number(x.birthMonth)===n.getMonth()+1&&Number(x.birthDay)===n.getDate())}
function formatNames(rows,max=3){const names=rows.slice(0,max).map(x=>`${x.name||'うにメン'}さん`);return names.join('・')+(rows.length>max?`ほか${rows.length-max}人`:'')}
function isToday(x){const n=new Date();return Number(x.birthMonth)===n.getMonth()+1&&Number(x.birthDay)===n.getDate()}
function wishKey(targetUid){return `${new Date().getFullYear()}_${targetUid}`}
function wishCount(targetUid){return new Set(wishRows.filter(x=>x.targetUid===targetUid).map(x=>x.senderUid)).size}
function wishButton(row,compact=false){const wished=myWishes.has(wishKey(row.uid)); const count=wishCount(row.uid);return `<button class="birthday-wish-button${wished?' is-wished':''}${compact?' is-compact':''}" type="button" data-birthday-wish="${esc(row.uid||'')}" ${row.uid===uid?'disabled':''} aria-label="${esc(row.name||'うにメン')}さんをお祝いする"><span>㊗️</span><b>${count}</b></button>`}
function memberName(row){return `<button type="button" class="birthday-member-name" data-member-uid="${esc(row.uid||'')}">${esc(row.name||'うにメン')}</button>`}

function renderHome(){
  const month=new Date().getMonth()+1, rows=membersForMonth(month), today=todayMembers();
  $('#birthdayMonthLabel')&&($('#birthdayMonthLabel').textContent=`${month}月`);
  $('#birthdayMonthCount')&&($('#birthdayMonthCount').textContent=`${rows.length}人`);
  $('#birthdayMonthSummary')&&($('#birthdayMonthSummary').textContent=rows.length?`${formatNames(rows)}がお誕生日です。`:`${month}月のお誕生日メンバーはまだいません。`);
  const list=$('#birthdayMonthList');
  if(list) list.innerHTML=rows.length?rows.map(row=>`<div class="birthday-mini-member"><div>${memberName(row)}<small>${month}月${Number(row.birthDay)}日</small></div>${wishButton(row,true)}</div>`).join(''):'<p class="birthday-month-empty">今月のお誕生日メンバーが登録されると、ここに表示されます。</p>';
  const celebration=$('#birthdayTodayCelebration');
  if(celebration){celebration.hidden=!today.length;if(today.length){celebration.innerHTML=`<span>🎉</span><div><small>HAPPY BIRTHDAY</small><strong>今日は${formatNames(today,4)}のお誕生日！</strong><p>㊗️ボタンからお祝いを届けられます。</p></div><button type="button" data-open-birthday-calendar>お祝いする</button>`;startCelebrationTicker(today)}else stopCelebrationTicker()}
}
function renderMonthButtons(){const wrap=$('#birthdayCalendarMonths');if(!wrap)return;wrap.innerHTML=Array.from({length:12},(_,i)=>{const m=i+1,c=membersForMonth(m).length;return `<button type="button" role="tab" aria-selected="${m===selectedMonth}" class="${m===selectedMonth?'is-active':''}" data-birthday-month="${m}"><strong>${m}</strong><small>月</small><em>${c}</em></button>`}).join('')}
function renderCalendar(){const rows=membersForMonth(selectedMonth);$('#birthdayCalendarMonthTitle')&&($('#birthdayCalendarMonthTitle').textContent=`${selectedMonth}月のお誕生日`);$('#birthdayCalendarMonthCount')&&($('#birthdayCalendarMonthCount').textContent=`${rows.length}人`);const list=$('#birthdayCalendarList');if(list)list.innerHTML=rows.length?rows.map(row=>`<article class="birthday-calendar-member"><div>${memberName(row)}<small>うにメン No.${String(Number(row.number||0)).padStart(4,'0')}</small></div><time>${selectedMonth}月${Number(row.birthDay)}日</time>${isToday(row)?'<em>今日！</em>':''}${wishButton(row)}</article>`).join(''):`<div class="birthday-calendar-empty"><span>🎂</span><strong>${selectedMonth}月のお誕生日メンバーはいません</strong></div>`;renderMonthButtons()}

async function sendBirthdayWish(targetUid){
  if(!uid||!targetUid||targetUid===uid)return;
  const key=wishKey(targetUid); if(myWishes.has(key)){toast('今年のお祝いは送信済みです。');return}
  const year=new Date().getFullYear(), sender=member();
  const wishRef=doc(db,'birthdayWishes',`${year}_${targetUid}_${uid}`);
  try{
    await runTransaction(db,async tx=>{const wishSnap=await tx.get(wishRef);if(wishSnap.exists())return;tx.set(wishRef,{targetUid,senderUid:uid,senderName:sender?.name||'うにメン',year,createdAt:serverTimestamp()});const notice=doc(collection(db,'users',targetUid,'notifications'));tx.set(notice,{type:'birthdayWish',text:`${sender?.name||'うにメン'}さんから誕生日のお祝いが届きました`,senderUid:uid,read:false,createdAt:serverTimestamp()})});
    myWishes.add(key);renderHome();renderCalendar();toast('誕生日のお祝いを届けました！');
  }catch(e){console.error('birthday wish',e);toast('お祝いを送れませんでした。Firestoreルールを確認してください。')}
}
function openCalendar(month=new Date().getMonth()+1){selectedMonth=Number(month)||new Date().getMonth()+1;renderCalendar();const modal=$('#birthdayCalendarModal');modal?.classList.add('is-open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open')}
function closeCalendar(){const modal=$('#birthdayCalendarModal');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open')}
function stopCelebrationTicker(){if(celebrationTimer)clearInterval(celebrationTimer);celebrationTimer=null;$$('.birthday-floating-message').forEach(x=>x.remove())}
function startCelebrationTicker(rows){stopCelebrationTicker();let i=0;const show=()=>{if(document.hidden||!rows.length||$('.birthday-floating-message'))return;const row=rows[i++%rows.length],el=document.createElement('div');el.className='birthday-floating-message';el.innerHTML=`<span>🎂</span><div><small>HAPPY BIRTHDAY</small><strong>${esc(row.name||'うにメン')}さん、お誕生日おめでとう！</strong></div>`;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('is-show'));setTimeout(()=>{el.classList.remove('is-show');setTimeout(()=>el.remove(),500)},6500)};setTimeout(show,1800);celebrationTimer=setInterval(show,14000)}
function bind(){
  $('#openBirthdayCalendar')?.addEventListener('click',()=>openCalendar());$$('[data-close-birthday-calendar]').forEach(x=>x.addEventListener('click',closeCalendar));
  document.addEventListener('click',e=>{const month=e.target.closest('[data-birthday-month]');if(month){selectedMonth=Number(month.dataset.birthdayMonth);renderCalendar();return}const wish=e.target.closest('[data-birthday-wish]');if(wish){e.preventDefault();e.stopPropagation();sendBirthdayWish(wish.dataset.birthdayWish);return}const person=e.target.closest('.birthday-member-name');if(person){window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid:person.dataset.memberUid}}));return}if(e.target.closest('[data-open-birthday-calendar]'))openCalendar()});
}
bind();
onAuthStateChanged(auth,user=>{if(!user)return;uid=user.uid;onSnapshot(collection(db,'users'),snap=>{members=snap.docs.map(d=>({uid:d.id,...d.data()}));renderHome();if($('#birthdayCalendarModal')?.classList.contains('is-open'))renderCalendar()});onSnapshot(collection(db,'birthdayWishes'),snap=>{wishRows=snap.docs.map(d=>({id:d.id,...d.data()}));myWishes=new Set(wishRows.filter(x=>x.senderUid===uid).map(x=>`${x.year}_${x.targetUid}`));window.UNICA_BIRTHDAY_WISH_COUNTS=wishRows.reduce((map,x)=>{(map[x.targetUid]||(map[x.targetUid]=new Set())).add(x.senderUid);return map},{});Object.keys(window.UNICA_BIRTHDAY_WISH_COUNTS).forEach(key=>window.UNICA_BIRTHDAY_WISH_COUNTS[key]=window.UNICA_BIRTHDAY_WISH_COUNTS[key].size);renderHome();if($('#birthdayCalendarModal')?.classList.contains('is-open'))renderCalendar()})});
