import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {
  getFirestore, collection, doc, setDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, runTransaction
} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDbd5CZCWKd-CYlvwAvR7AyY3G94_CdkgU',
  authDomain: 'unica-world.firebaseapp.com',
  projectId: 'unica-world',
  storageBucket: 'unica-world.firebasestorage.app',
  messagingSenderId: '640407918994',
  appId: '1:640407918994:web:64e30aa04e3496da46094b'
};

const app = getApps()[0] || initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const SONG_ID = 'milk-no-nioi';
const MEMBER_KEY = 'unicaWorldMemberV4';
const LEGACY_MEMBER_KEY = 'unicaWorldMemberV3';
let uid = null;
let activeTab = 'new';
let comments = [];
let myLikedCommentIds = new Set();
let songLiked = false;
let notificationRows = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const todayKey = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());
const nowTime = () => new Intl.DateTimeFormat('ja-JP', { timeZone:'Asia/Tokyo', hour:'2-digit', minute:'2-digit', hour12:false }).format(new Date());
function member(){ try { return JSON.parse(localStorage.getItem(MEMBER_KEY) || localStorage.getItem(LEGACY_MEMBER_KEY) || 'null'); } catch { return null; } }
function toast(text){ const el=$('#miniToast'); if(!el)return; el.textContent=text; el.classList.add('is-show'); setTimeout(()=>el.classList.remove('is-show'),2200); }
function openMemberGate(){ $('#memberGate')?.classList.add('is-open'); document.body.classList.add('member-gate-open'); }

function installUI(){
  const header = $('.site-header');
  if (header && !$('#phase10Utilities')) {
    const tools=document.createElement('div');
    tools.id='phase10Utilities'; tools.className='phase10-utilities';
    tools.innerHTML=`<button class="online-pill" id="phaseOnlineButton" type="button" aria-label="オンライン人数"><i></i><span><b id="phaseOnlineCount">0</b>人オンライン</span></button><button class="notification-button" id="notificationButton" type="button" aria-label="通知を開く">🔔<b id="notificationBadge" hidden>0</b></button>`;
    header.appendChild(tools);
  }
  const release=$('.release-card .release-copy');
  if(release && !$('#songLikeButton')) release.insertAdjacentHTML('beforeend',`<div class="song-like-box"><button id="songLikeButton" type="button"><span id="songLikeIcon">♡</span><strong>この曲が好き</strong></button><p><b id="songLikeCount">0</b>人が好き</p></div>`);
  const compact=$('.compact-song');
  if(compact && !$('#compactSongLikes')) compact.insertAdjacentHTML('beforeend',`<div class="compact-song-likes" id="compactSongLikes">♡ <b>0</b>人</div>`);
  const passGrid=$('.passport-detail-grid');
  if(passGrid && !$('#detailFavoriteSongs')) passGrid.insertAdjacentHTML('beforeend',`<div class="passport-detail-wide"><dt>好きな曲</dt><dd id="detailFavoriteSongs">まだありません</dd></div><div><dt>エール</dt><dd id="detailCheerCount">♡ 0</dd></div><div><dt>応援レベル</dt><dd id="detailSupportLevel">🌱 はじめての応援</dd></div>`);
  if(!$('#notificationModal')) document.body.insertAdjacentHTML('beforeend',`
  <div aria-hidden="true" class="world-modal" id="notificationModal"><div class="world-modal-backdrop" data-close-notifications></div><section aria-modal="true" class="world-modal-panel notification-panel" role="dialog" aria-labelledby="notificationTitle"><button class="world-modal-close" data-close-notifications type="button">×</button><p class="eyebrow">NOTIFICATIONS</p><h2 id="notificationTitle">通知</h2><div class="notification-actions"><button id="markAllNotifications" type="button">すべて既読</button></div><div id="notificationList" class="notification-list"></div></section></div>`);
}

function supportLevel(total){ if(total>=200)return '💎 プレミアサポーター'; if(total>=80)return '🌸 UNICAサポーター'; if(total>=20)return '🌼 いつもありがとう'; return '🌱 はじめての応援'; }
function updatePassport(){
  const m=member(); if(!m)return;
  $('#detailFavoriteSongs') && ($('#detailFavoriteSongs').textContent=songLiked?'♪ ミルクの匂い':'まだありません');
  let cheers=0; try{ cheers=JSON.parse(localStorage.getItem('unicaDailyCheersV1')||'[]').length||0; }catch{}
  $('#detailCheerCount') && ($('#detailCheerCount').textContent=`♡ ${cheers}`);
  $('#detailSupportLevel') && ($('#detailSupportLevel').textContent=supportLevel(cheers + comments.filter(c=>c.ownerUid===uid).length*5));
}

async function toggleSongLike(){
  if(!uid)return;
  if(!member()){ openMemberGate(); return; }
  const likeRef=doc(db,'songs',SONG_ID,'likes',uid);
  const songRef=doc(db,'songs',SONG_ID);
  try{
    await runTransaction(db, async tx=>{
      const [likeSnap,songSnap]=await Promise.all([tx.get(likeRef),tx.get(songRef)]);
      const current=Math.max(0,Number(songSnap.data()?.likeCount||0));
      if(likeSnap.exists()){
        tx.delete(likeRef); tx.set(songRef,{title:'ミルクの匂い',likeCount:Math.max(0,current-1),updatedAt:serverTimestamp()},{merge:true});
      }else{
        tx.set(likeRef,{uid,createdAt:serverTimestamp()}); tx.set(songRef,{title:'ミルクの匂い',likeCount:current+1,updatedAt:serverTimestamp()},{merge:true});
      }
    });
  }catch(error){ console.error(error); toast('好きの更新に失敗しました。'); }
}
function renderSongLike(count){
  $('#songLikeButton')?.classList.toggle('is-liked',songLiked);
  $('#songLikeIcon') && ($('#songLikeIcon').textContent=songLiked?'♥':'♡');
  $('#songLikeCount') && ($('#songLikeCount').textContent=String(count));
  const compact=$('#compactSongLikes'); if(compact)compact.innerHTML=`${songLiked?'♥':'♡'} <b>${count}</b>人`;
  updatePassport();
}
function listenSongLike(){
  onSnapshot(doc(db,'songs',SONG_ID),snap=>renderSongLike(Number(snap.data()?.likeCount||0)));
  onSnapshot(doc(db,'songs',SONG_ID,'likes',uid),snap=>{ songLiked=snap.exists(); getDoc(doc(db,'songs',SONG_ID)).then(s=>renderSongLike(Number(s.data()?.likeCount||0))); });
}

function commentDate(row){ const date=row.date||''; return `${date===todayKey()?'今日':date}${row.time?' '+row.time:''}`; }
function filteredComments(){ let rows=[...comments]; if(activeTab==='mine')rows=rows.filter(x=>x.ownerUid===uid); if(activeTab==='popular')rows.sort((a,b)=>Number(b.likeCount||0)-Number(a.likeCount||0)); else rows.sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0)); return rows; }
function renderComments(){
  const m=member(); const list=$('#communityList'); if(!list)return;
  const rows=filteredComments();
  list.innerHTML=rows.map(row=>`<article class="community-post-plus support-comment-card${row.ownerUid===uid?' is-me':''}" data-post-id="${esc(row.id)}"><header><button class="community-post-avatar member-name-button" data-member-uid="${esc(row.ownerUid)}" type="button">${esc(row.avatar||'🌸')}</button><div><button class="member-name-text" data-member-uid="${esc(row.ownerUid)}" type="button">${esc(row.name||'うにメン')}${row.ownerUid===uid?'（あなた）':''}</button><small>${esc(row.prefecture||'')}${row.prefecture?'・':''}${esc(commentDate(row))}</small></div>${row.ownerUid===uid?`<button class="community-more" data-delete-remote="${esc(row.id)}" type="button">×</button>`:'<span></span>'}</header><p>${esc(row.text)}</p><div class="community-post-actions support-actions"><button class="${myLikedCommentIds.has(row.id)?'is-liked':''}" data-like-remote="${esc(row.id)}" type="button">${myLikedCommentIds.has(row.id)?'♥':'♡'} いいね <b>${Number(row.likeCount||0)}</b></button></div></article>`).join('') || `<div class="community-empty">${activeTab==='mine'?'まだ応援コメントを送っていません。':'まだ応援コメントはありません。'}</div>`;
  $('#homeCommunityPosts') && ($('#homeCommunityPosts').textContent=String(comments.length));
  $('#homeCommunityMembers') && ($('#homeCommunityMembers').textContent=String(comments.reduce((s,x)=>s+Number(x.likeCount||0),0)));
  const latest=[...comments].sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0))[0];
  const homeLatest=$('#communityHomeLatest');
  if(homeLatest) homeLatest.innerHTML=latest?`<span>${esc(latest.avatar||'🌸')}</span><div><button class="member-name-text" data-member-uid="${esc(latest.ownerUid)}" type="button">${esc(latest.name)}</button><p>${esc(latest.text)}</p></div><em>♥ ${Number(latest.likeCount||0)}</em>`:`<div><strong>まだ応援コメントはありません</strong><p>最初の応援コメントを書いてみよう！</p></div>`;
  $$('#communityList [data-like-remote]').forEach(b=>b.onclick=()=>toggleCommentLike(b.dataset.likeRemote));
  $$('#communityList [data-delete-remote]').forEach(b=>b.onclick=()=>deleteRemoteComment(b.dataset.deleteRemote));
  $$('[data-member-uid]').forEach(b=>b.onclick=()=>openMemberPass(b.dataset.memberUid));
  updateComposer(); updatePassport();
}
function updateComposer(){
  const m=member(), btn=$('#submitCommunityComment'), ta=$('#communityComment'); if(!btn||!ta)return;
  const posted=comments.some(c=>c.ownerUid===uid&&c.date===todayKey());
  ta.disabled=posted; btn.disabled=posted; btn.textContent=posted?'今日は送信済み':'応援を送る（あと1件）';
  $('#communityOnlineCount') && ($('#communityOnlineCount').textContent=String(comments.length));
  if(m){ $('#communityComposeAvatar') && ($('#communityComposeAvatar').textContent=m.avatar||'🌸'); $('#communityComposeName') && ($('#communityComposeName').textContent=m.name||'あなた'); }
}
async function submitRemoteComment(event){
  event.preventDefault(); event.stopImmediatePropagation();
  const m=member(), ta=$('#communityComment'); if(!m){openMemberGate();return;} const text=ta?.value.trim(); if(!text){toast('応援コメントを入力してください。');return;}
  if(comments.some(c=>c.ownerUid===uid&&c.date===todayKey())){toast('今日はすでに送信済みです。');return;}
  const ref=doc(collection(db,'supportComments'));
  await setDoc(ref,{ownerUid:uid,name:m.name||'うにメン',avatar:m.avatar||'🌸',prefecture:m.prefecture||'',text:text.slice(0,80),date:todayKey(),time:nowTime(),likeCount:0,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  ta.value=''; $('#communityCount') && ($('#communityCount').textContent='0 / 80'); toast('うにかへ応援コメントを送りました。');
}
async function toggleCommentLike(id){
  if(!uid)return; const likeRef=doc(db,'supportComments',id,'likes',uid), commentRef=doc(db,'supportComments',id);
  await runTransaction(db,async tx=>{ const [l,c]=await Promise.all([tx.get(likeRef),tx.get(commentRef)]); if(!c.exists())return; const n=Math.max(0,Number(c.data().likeCount||0)); if(l.exists()){tx.delete(likeRef);tx.update(commentRef,{likeCount:Math.max(0,n-1),updatedAt:serverTimestamp()});}else{tx.set(likeRef,{uid,createdAt:serverTimestamp()});tx.update(commentRef,{likeCount:n+1,updatedAt:serverTimestamp()}); if(c.data().ownerUid&&c.data().ownerUid!==uid){const nr=doc(collection(db,'users',c.data().ownerUid,'notifications'));tx.set(nr,{type:'commentLike',text:`${member()?.name||'うにメン'}さんがあなたの応援コメントにいいねしました`,commentId:id,read:false,createdAt:serverTimestamp()});}} });
}
async function deleteRemoteComment(id){ if(!confirm('この応援コメントを削除しますか？'))return; await deleteDoc(doc(db,'supportComments',id)); toast('応援コメントを削除しました。'); }
function listenComments(){
  onSnapshot(query(collection(db,'supportComments'),orderBy('createdAt','desc'),limit(300)),snap=>{comments=snap.docs.map(d=>({id:d.id,...d.data()})).filter(row=>!String(row.id||'').startsWith('demo-')&&!String(row.ownerUid||'').startsWith('demo-'));renderComments();},error=>console.error('comments',error));
}
async function refreshMyCommentLikes(){
  const ids=[]; for(const row of comments){ const s=await getDoc(doc(db,'supportComments',row.id,'likes',uid)); if(s.exists())ids.push(row.id); } myLikedCommentIds=new Set(ids); renderComments();
}

async function openMemberPass(targetUid){
  if(!targetUid)return; const snap=await getDoc(doc(db,'users',targetUid)); if(!snap.exists()){toast('このうにメンの情報はまだありません。');return;} const u=snap.data();
  $('#detailAvatar') && ($('#detailAvatar').textContent=u.avatar||'🌸'); $('#detailName') && ($('#detailName').textContent=u.name||'うにメン');
  $('#detailNumber') && ($('#detailNumber').textContent=u.number?`No.${String(u.number).padStart(4,'0')}`:'UNICA MEMBER');
  $('#detailPrefecture') && ($('#detailPrefecture').textContent=u.prefecturePublic===false?'非公開':(u.prefecture||'—'));
  $('#detailBirthday') && ($('#detailBirthday').textContent=u.birthdayPublic===false?'非公開':(u.birthMonth&&u.birthDay?`${u.birthMonth}月${u.birthDay}日`:'—'));
  $('#detailOpenSettings')?.toggleAttribute('hidden',targetUid!==uid);
  $('#passportModal')?.classList.add('is-open'); $('#passportModal')?.setAttribute('aria-hidden','false'); document.body.classList.add('member-gate-open');
}

function renderNotifications(){
  const unread=notificationRows.filter(n=>!n.read).length, badge=$('#notificationBadge'); if(badge){badge.hidden=unread===0;badge.textContent=String(unread);}
  const list=$('#notificationList'); if(!list)return;
  list.innerHTML=notificationRows.map(n=>`<article class="notification-row${n.read?'':' is-unread'}"><span>${n.type==='commentLike'?'♥':'🔔'}</span><div><p>${esc(n.text||'新しい通知があります')}</p><small>${n.createdAt?.toDate?new Intl.DateTimeFormat('ja-JP',{dateStyle:'short',timeStyle:'short'}).format(n.createdAt.toDate()):'たった今'}</small></div></article>`).join('')||'<div class="notification-empty">通知はまだありません。</div>';
}
async function markAllRead(){ await Promise.all(notificationRows.filter(n=>!n.read).map(n=>setDoc(doc(db,'users',uid,'notifications',n.id),{read:true},{merge:true}))); }
function listenNotifications(){ onSnapshot(query(collection(db,'users',uid,'notifications'),orderBy('createdAt','desc'),limit(50)),snap=>{notificationRows=snap.docs.map(d=>({id:d.id,...d.data()}));renderNotifications();}); }
function openNotifications(){ const m=$('#notificationModal'); m?.classList.add('is-open');m?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open'); }
function closeNotifications(){ const m=$('#notificationModal');m?.classList.remove('is-open');m?.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open'); }

function bindUI(){
  $('#songLikeButton')?.addEventListener('click',toggleSongLike);
  $('#notificationButton')?.addEventListener('click',openNotifications);
  $$('[data-close-notifications]').forEach(x=>x.addEventListener('click',closeNotifications));
  $('#markAllNotifications')?.addEventListener('click',markAllRead);
  $('#submitCommunityComment')?.addEventListener('click',submitRemoteComment,true);
  $$('[data-community-tab]').forEach(btn=>btn.addEventListener('click',e=>{e.stopImmediatePropagation();activeTab=btn.dataset.communityTab;$$('[data-community-tab]').forEach(x=>x.classList.toggle('is-active',x===btn));renderComments();},true));
  $('#phaseOnlineButton')?.addEventListener('click',()=>toast(`${$('#phaseOnlineCount')?.textContent||0}人が現在オンラインです。`));
  window.addEventListener('unica:online-count',e=>{ $('#phaseOnlineCount') && ($('#phaseOnlineCount').textContent=String(e.detail.count)); });
  $('#openPassButton')?.addEventListener('click',updatePassport);
  $('#statusOpenPass')?.addEventListener('click',updatePassport);
}

installUI(); bindUI();
onAuthStateChanged(auth,user=>{
  if(!user)return; uid=user.uid;
  listenSongLike(); listenComments(); listenNotifications();
  // Comment-like status is refreshed after each comment snapshot without requiring a collection-group index.
  const timer=setInterval(()=>{ if(comments.length)refreshMyCommentLikes().catch(()=>{}); },10000);
  window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});
  refreshMyCommentLikes().catch(()=>{});
});
