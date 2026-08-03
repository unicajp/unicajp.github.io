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
let members=[], selectedMonth=1, celebrationTimer=null, uid=null, birthdayComments=[], selectedBirthdayUid='', dataReady={members:false,comments:false}, prompted=false;

function jstNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Tokyo'}))}
function dateKey(d=jstNow()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function todayParts(){const d=jstNow();return {year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate(),key:dateKey(d)}}
function toast(text){const el=$('#miniToast');if(!el)return;el.textContent=text;el.classList.add('is-show','is-visible');setTimeout(()=>el.classList.remove('is-show','is-visible'),2600)}
function publicBirthdays(){return members.filter(x=>x&&x.birthdayPublic!==false&&Number(x.birthMonth)>=1&&Number(x.birthMonth)<=12&&Number(x.birthDay)>=1&&Number(x.birthDay)<=31)}
function membersForMonth(month){return publicBirthdays().filter(x=>Number(x.birthMonth)===Number(month)).sort((a,b)=>Number(a.birthDay)-Number(b.birthDay)||String(a.name||'').localeCompare(String(b.name||''),'ja'))}
function todayMembers(){const n=todayParts();return publicBirthdays().filter(x=>Number(x.birthMonth)===n.month&&Number(x.birthDay)===n.day)}
function formatNames(rows,max=3){const names=rows.slice(0,max).map(x=>`${x.name||'うにメン'}さん`);return names.join('・')+(rows.length>max?`ほか${rows.length-max}人`:'')}
function isToday(x){const n=todayParts();return Number(x.birthMonth)===n.month&&Number(x.birthDay)===n.day}
function eventKey(targetUid,key=dateKey()){return `${key}_${targetUid}`}
function commentsFor(targetUid,key=dateKey()){return birthdayComments.filter(x=>x.targetUid===targetUid&&x.eventDate===key).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))}
function hasCommented(targetUid,key=dateKey()){return birthdayComments.some(x=>x.targetUid===targetUid&&x.senderUid===uid&&x.eventDate===key)}
function memberNo(row){return `うにメンNo.${String(Number(row.number||0)).padStart(4,'0')}`}
function memberName(row){return `<button type="button" class="birthday-member-name" data-member-uid="${esc(row.uid||'')}">${esc(row.name||'うにメン')}</button>`}
function stageForCount(count){if(count>=50)return {icon:'🌸',label:'満開',level:4};if(count>=30)return {icon:'🌺',label:'花が咲きました',level:3};if(count>=10)return {icon:'🌿',label:'すくすく成長中',level:2};return {icon:'🌱',label:'お祝いで育ちます',level:1}}
function wishButton(row,compact=false){
  if(!isToday(row))return '';
  const own=row.uid===uid, sent=hasCommented(row.uid), count=commentsFor(row.uid).length;
  return `<button class="birthday-wish-button${sent?' is-wished':''}${compact?' is-compact':''}" type="button" data-open-birthday-comment="${esc(row.uid||'')}" ${own?'disabled':''}><span class="birthday-wish-label">${own?'本人':sent?'お祝い済み':'💌 お祝いする'}</span><b>${count}</b></button>`
}

function renderHome(){
  const n=todayParts(), rows=membersForMonth(n.month), today=todayMembers();
  $('#birthdayMonthLabel')&&($('#birthdayMonthLabel').textContent=`${n.month}月`);
  $('#birthdayMonthCount')&&($('#birthdayMonthCount').textContent=`${rows.length}人`);
  $('#birthdayMonthSummary')&&($('#birthdayMonthSummary').textContent=rows.length?`${formatNames(rows)}がお誕生日です。`:`${n.month}月のお誕生日メンバーはまだいません。`);
  const list=$('#birthdayMonthList');
  if(list) list.innerHTML=rows.length?rows.map(row=>`<div class="birthday-mini-member"><div class="birthday-mini-info"><div class="birthday-mini-name-line">${memberName(row)}<small class="birthday-mini-number">${memberNo(row)}</small></div><small class="birthday-mini-date">${n.month}月${Number(row.birthDay)}日</small></div>${wishButton(row,true)}</div>`).join(''):'<p class="birthday-month-empty">今月のお誕生日メンバーが登録されると、ここに表示されます。</p>';
  const celebration=$('#birthdayTodayCelebration');
  if(celebration){
    celebration.hidden=!today.length;
    if(today.length){
      const total=today.reduce((s,x)=>s+commentsFor(x.uid).length,0), growth=stageForCount(total);
      celebration.innerHTML=`<span>${growth.icon}</span><div><small>TODAY'S BIRTHDAY</small><strong>今日は${formatNames(today,4)}のお誕生日！</strong><p>${growth.label}・お祝いコメント ${total}件</p></div><button type="button" data-open-birthday-comment="${esc(today.find(x=>x.uid!==uid)?.uid||today[0].uid)}">お祝いする</button>`;
      startCelebrationTicker(today)
    }else stopCelebrationTicker()
  }
}
function renderMonthButtons(){const wrap=$('#birthdayCalendarMonths');if(!wrap)return;wrap.innerHTML=Array.from({length:12},(_,i)=>{const m=i+1,c=membersForMonth(m).length;return `<button type="button" role="tab" aria-selected="${m===selectedMonth}" class="${m===selectedMonth?'is-active':''}" data-birthday-month="${m}"><strong>${m}</strong><small>月</small><em>${c}</em></button>`}).join('')}
function renderCalendar(){const rows=membersForMonth(selectedMonth);$('#birthdayCalendarMonthTitle')&&($('#birthdayCalendarMonthTitle').textContent=`${selectedMonth}月のお誕生日`);$('#birthdayCalendarMonthCount')&&($('#birthdayCalendarMonthCount').textContent=`${rows.length}人`);const list=$('#birthdayCalendarList');if(list)list.innerHTML=rows.length?rows.map(row=>`<article class="birthday-calendar-member"><div>${memberName(row)}<small>${memberNo(row)}</small></div><time>${selectedMonth}月${Number(row.birthDay)}日</time>${isToday(row)?'<em>今日！</em>':''}${wishButton(row)}</article>`).join(''):`<div class="birthday-calendar-empty"><span>🎂</span><strong>${selectedMonth}月のお誕生日メンバーはいません</strong></div>`;renderMonthButtons()}

function openModal(id){const el=$(id);el?.classList.add('is-open');el?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open')}
function closeModal(id){const el=$(id);el?.classList.remove('is-open');el?.setAttribute('aria-hidden','true');if(!$('.world-modal.is-open,#birthdayExperienceModal.is-open'))document.body.classList.remove('member-gate-open')}
function openCalendar(month=todayParts().month){selectedMonth=Number(month)||todayParts().month;renderCalendar();openModal('#birthdayCalendarModal')}
function closeCalendar(){closeModal('#birthdayCalendarModal')}

function renderCommentModal(targetUid){
  const target=members.find(x=>x.uid===targetUid);if(!target)return;
  selectedBirthdayUid=targetUid;const rows=commentsFor(targetUid), own=targetUid===uid, sent=hasCommented(targetUid), growth=stageForCount(rows.length);
  $('#birthdayCommentPerson').textContent=`${target.name||'うにメン'}さん`;
  $('#birthdayCommentDate').textContent=`${todayParts().month}月${todayParts().day}日`;
  $('#birthdayGrowthIcon').textContent=growth.icon;$('#birthdayGrowthLabel').textContent=growth.label;$('#birthdayCommentCount').textContent=`${rows.length}件`;
  const composer=$('#birthdayCommentComposer');composer.hidden=own||sent||!isToday(target);
  const done=$('#birthdayCommentDone');done.hidden=!sent||own;
  const ownNotice=$('#birthdayCommentOwnNotice');ownNotice.hidden=!own;
  $('#birthdayCommentInput').value='';
  const list=$('#birthdayCommentList');
  list.innerHTML=rows.length?rows.map(x=>`<article class="birthday-message-row"><button type="button" data-member-uid="${esc(x.senderUid)}">${esc(x.senderName||'うにメン')}</button><p>${esc(x.message||'')}</p><time>${x.createdAt?.toDate?.().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})||''}</time></article>`).join(''):'<div class="birthday-no-comments">最初のお祝いコメントを届けよう 💌</div>';
}
function openBirthdayComment(targetUid){const target=members.find(x=>x.uid===targetUid);if(!target)return;if(!isToday(target)){toast('お祝いコメントを書けるのは誕生日当日だけです。');return}renderCommentModal(targetUid);openModal('#birthdayCommentModal')}
async function submitBirthdayComment(){
  const target=members.find(x=>x.uid===selectedBirthdayUid), input=$('#birthdayCommentInput');if(!uid||!target||!isToday(target)||target.uid===uid)return;
  const message=String(input.value||'').trim();if(!message){toast('お祝いメッセージを入力してください。');return}if(message.length>120){toast('コメントは120文字以内で入力してください。');return}
  const n=todayParts(), sender=member()||members.find(x=>x.uid===uid)||{}, ref=doc(db,'birthdayComments',`${eventKey(target.uid,n.key)}_${uid}`);
  try{
    await runTransaction(db,async tx=>{
      const snap=await tx.get(ref);if(snap.exists())throw new Error('already');
      tx.set(ref,{eventKey:eventKey(target.uid,n.key),eventDate:n.key,birthMonth:n.month,birthDay:n.day,targetUid:target.uid,targetName:target.name||'うにメン',senderUid:uid,senderName:sender.name||'うにメン',message,createdAt:serverTimestamp()});
      const notice=doc(collection(db,'users',target.uid,'notifications'));tx.set(notice,{type:'birthdayComment',text:`${sender.name||'うにメン'}さんからお祝いコメントが届きました`,senderUid:uid,read:false,createdAt:serverTimestamp()});
    });
    toast('お祝いコメントを届けました！');input.value='';
  }catch(e){console.error(e);toast(e.message==='already'?'この方には今日すでに送信済みです。':'送信できませんでした。Firestoreルールを確認してください。')}
}

function albumGroups(){
  const map=new Map();birthdayComments.forEach(x=>{if(!x.eventKey)return;if(!map.has(x.eventKey))map.set(x.eventKey,{eventKey:x.eventKey,eventDate:x.eventDate,targetUid:x.targetUid,targetName:x.targetName||'うにメン',comments:[]});map.get(x.eventKey).comments.push(x)});
  return [...map.values()].sort((a,b)=>String(b.eventDate).localeCompare(String(a.eventDate))||String(a.targetName).localeCompare(String(b.targetName),'ja'))
}
function renderAlbum(){
  const groups=albumGroups(), list=$('#birthdayAlbumList');
  list.innerHTML=groups.length?groups.map(g=>`<button type="button" class="birthday-album-row" data-open-birthday-history="${esc(g.eventKey)}"><span>🎂</span><div><time>${esc(g.eventDate.replaceAll('-','/'))}</time><strong>${esc(g.targetName)}さん</strong></div><em>💌 ${g.comments.length}件</em><b>›</b></button>`).join(''):'<div class="birthday-no-comments">まだ誕生日アルバムはありません。</div>'
}
function openAlbum(){renderAlbum();openModal('#birthdayAlbumModal')}
function openHistory(key){const g=albumGroups().find(x=>x.eventKey===key);if(!g)return;$('#birthdayHistoryTitle').textContent=`${g.targetName}さんのお誕生日`;$('#birthdayHistoryDate').textContent=g.eventDate.replaceAll('-','/');$('#birthdayHistoryCount').textContent=`💌 ${g.comments.length}件`;$('#birthdayHistoryList').innerHTML=g.comments.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)).map(x=>`<article class="birthday-message-row"><button type="button" data-member-uid="${esc(x.senderUid)}">${esc(x.senderName||'うにメン')}</button><p>${esc(x.message||'')}</p></article>`).join('');closeModal('#birthdayAlbumModal');openModal('#birthdayHistoryModal')}

function showLoginExperience(){
  if(prompted||!uid||!dataReady.members||!dataReady.comments)return;prompted=true;
  const today=todayMembers();if(!today.length)return;
  const key=`unicaBirthdayPrompt_${dateKey()}_${uid}`;if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');
  const mine=today.find(x=>x.uid===uid), body=$('#birthdayExperienceBody');
  if(mine){
    const count=commentsFor(uid).length,growth=stageForCount(count);
    body.innerHTML=`<div class="birthday-self-celebration"><div class="birthday-confetti" aria-hidden="true"></div><span class="birthday-big-cake">🎂</span><small>HAPPY BIRTHDAY</small><h2>お誕生日おめでとう！</h2><strong>${esc(mine.name||'うにメン')}さん</strong><p>今日はあなたの特別な日です。<br>うにメンのみんなから届くお祝いを楽しんでね。</p><div class="birthday-growth-preview"><b>${growth.icon}</b><span>${growth.label}</span><em>💌 ${count}件</em></div><button type="button" data-open-birthday-comment="${esc(uid)}">お祝いコメントを見る</button></div>`
  }else{
    const targets=today.filter(x=>x.uid!==uid), first=targets.find(x=>!hasCommented(x.uid))||targets[0];
    body.innerHTML=`<div class="birthday-friend-prompt"><span>🎉</span><small>TODAY'S BIRTHDAY</small><h2>今日は${esc(formatNames(targets,3))}の<br>お誕生日です！</h2><p>みんなが見られるお祝いコメントで、特別な一日を一緒にお祝いしましょう。</p><button type="button" data-open-birthday-comment="${esc(first.uid)}">💌 コメントでお祝いする</button><button type="button" class="birthday-later" data-close-birthday-experience>あとで</button></div>`
  }
  openModal('#birthdayExperienceModal');launchConfetti();
}
function launchConfetti(){const host=$('#birthdayExperienceModal .birthday-celebration-particles');if(!host)return;host.innerHTML='';for(let i=0;i<38;i++){const p=document.createElement('i');p.style.setProperty('--x',`${Math.random()*100}%`);p.style.setProperty('--d',`${1.8+Math.random()*2.2}s`);p.style.setProperty('--delay',`${Math.random()*.8}s`);p.textContent=['🌸','✨','🎉','💗'][i%4];host.appendChild(p)}}
function stopCelebrationTicker(){if(celebrationTimer)clearInterval(celebrationTimer);celebrationTimer=null;$$('.birthday-floating-message').forEach(x=>x.remove())}
function startCelebrationTicker(rows){stopCelebrationTicker();let i=0;const show=()=>{if(document.hidden||!rows.length||$('.birthday-floating-message'))return;const row=rows[i++%rows.length],el=document.createElement('div');el.className='birthday-floating-message';el.innerHTML=`<span>🎂</span><div><small>HAPPY BIRTHDAY</small><strong>${esc(row.name||'うにメン')}さん、お誕生日おめでとう！</strong><p>お祝いコメント ${commentsFor(row.uid).length}件</p></div>`;document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('is-show'));setTimeout(()=>{el.classList.remove('is-show');setTimeout(()=>el.remove(),500)},6500)};setTimeout(show,1800);celebrationTimer=setInterval(show,14000)}

function bind(){
  $('#openBirthdayCalendar')?.addEventListener('click',()=>openCalendar());$('#openBirthdayAlbum')?.addEventListener('click',openAlbum);$('#birthdayCommentSubmit')?.addEventListener('click',submitBirthdayComment);
  $$('[data-close-birthday-calendar]').forEach(x=>x.addEventListener('click',closeCalendar));
  document.addEventListener('click',e=>{
    const month=e.target.closest('[data-birthday-month]');if(month){selectedMonth=Number(month.dataset.birthdayMonth);renderCalendar();return}
    const comment=e.target.closest('[data-open-birthday-comment]');if(comment){e.preventDefault();closeModal('#birthdayExperienceModal');openBirthdayComment(comment.dataset.openBirthdayComment);return}
    const history=e.target.closest('[data-open-birthday-history]');if(history){openHistory(history.dataset.openBirthdayHistory);return}
    const person=e.target.closest('[data-member-uid]');if(person&&!person.matches('[data-open-birthday-comment]')){window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid:person.dataset.memberUid}}));return}
    if(e.target.closest('[data-open-birthday-calendar]'))openCalendar();if(e.target.closest('[data-open-birthday-album]'))openAlbum();
    if(e.target.closest('[data-close-birthday-comment]'))closeModal('#birthdayCommentModal');if(e.target.closest('[data-close-birthday-album]'))closeModal('#birthdayAlbumModal');if(e.target.closest('[data-close-birthday-history]'))closeModal('#birthdayHistoryModal');if(e.target.closest('[data-close-birthday-experience]'))closeModal('#birthdayExperienceModal');
  });
}
bind();selectedMonth=todayParts().month;
onAuthStateChanged(auth,user=>{if(!user)return;uid=user.uid;
  onSnapshot(collection(db,'users'),snap=>{members=snap.docs.map(d=>({uid:d.id,...d.data()}));dataReady.members=true;renderHome();if($('#birthdayCalendarModal')?.classList.contains('is-open'))renderCalendar();showLoginExperience()});
  onSnapshot(collection(db,'birthdayComments'),snap=>{birthdayComments=snap.docs.map(d=>({id:d.id,...d.data()}));dataReady.comments=true;window.UNICA_BIRTHDAY_WISH_COUNTS=birthdayComments.reduce((m,x)=>{(m[x.targetUid]||(m[x.targetUid]=new Set())).add(x.senderUid);return m},{});Object.keys(window.UNICA_BIRTHDAY_WISH_COUNTS).forEach(k=>window.UNICA_BIRTHDAY_WISH_COUNTS[k]=window.UNICA_BIRTHDAY_WISH_COUNTS[k].size);renderHome();if(selectedBirthdayUid&&$('#birthdayCommentModal')?.classList.contains('is-open'))renderCommentModal(selectedBirthdayUid);if($('#birthdayAlbumModal')?.classList.contains('is-open'))renderAlbum();showLoginExperience()});
});
