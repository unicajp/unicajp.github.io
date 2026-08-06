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
let latestComments = [];
let historyComments = [];
let commentHistoryLoaded = false;
let commentHistoryLoading = false;
let commentLikeRefreshToken = 0;
let memberDirectory = new Map();

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
function scentMiniBadge(ownerUid){ const profile=memberDirectory.get(String(ownerUid||''))||{}; const scent=profile.scentDiagnosis; if(!scent?.typeId)return ''; const type=window.UNICA_SCENT16?.typeById?.(scent.typeId); const flower=type?.flower||scent.flower||'🌸'; const name=scent.scentName||type?.name||'診断済み'; return `<span class="scent-mini-badge" title="${esc(name)}" aria-label="${esc(name)}">${esc(flower)}</span>`; }
function filteredComments(){ let rows=[...comments]; if(activeTab==='mine')rows=rows.filter(x=>x.ownerUid===uid); if(activeTab==='popular')rows.sort((a,b)=>Number(b.likeCount||0)-Number(a.likeCount||0)); else rows.sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0)); return rows; }

function cumulativeLikeRanking(){
  const byUid=new Map();
  comments.forEach(row=>{
    const ownerUid=String(row.ownerUid||'');
    if(!ownerUid)return;
    const profile=memberDirectory.get(ownerUid)||{};
    const current=byUid.get(ownerUid)||{uid:ownerUid,name:profile.name||row.name||'うにメン',avatar:profile.avatar||row.avatar||'🌸',number:Number(profile.number||0),likes:0};
    current.likes+=Math.max(0,Number(row.likeCount||0));
    if(row.name)current.name=row.name;
    if(row.avatar)current.avatar=row.avatar;
    if(profile.number)current.number=Number(profile.number);
    byUid.set(ownerUid,current);
  });
  return [...byUid.values()].sort((a,b)=>b.likes-a.likes||String(a.name).localeCompare(String(b.name),'ja')).slice(0,3);
}
function renderSupportLikeRanking(){
  const box=$('#supportLikeRankingList'); if(!box)return;
  const top=cumulativeLikeRanking(); const medals=['🥇','🥈','🥉']; const max=Math.max(1,...top.map(x=>x.likes));
  box.innerHTML=top.length?top.map((x,i)=>`<button type="button" class="support-ranking-row" data-member-uid="${esc(x.uid)}"><span class="support-ranking-rank">${medals[i]}</span><span class="support-ranking-name"><b>${esc(x.name)}${scentMiniBadge(x.uid)}</b><small>うにメンNo.${String(Number(x.number||0)).padStart(4,'0')}</small></span><span class="support-ranking-bar"><i style="width:${Math.max(5,x.likes/max*100)}%"></i></span><strong>♥ ${x.likes}</strong></button>`).join(''):'<p class="support-ranking-empty">いいねが集まるとランキングに表示されます。</p>';
}

function renderComments(){
  const m=member(); const list=$('#communityList'); if(!list)return;
  const rows=filteredComments();
  /* トップ表示用：注目5件＋新着10件。見た目は従来の小型カードを維持する。 */
  const toTopComment = row => ({
    id:String(row.id||''),
    ownerUid:String(row.ownerUid||''),
    name:String(row.name||'うにメン'),
    avatar:String(row.avatar||'🌸'),
    text:String(row.text||''),
    count:Number(row.likeCount||0),
    liked:myLikedCommentIds.has(row.id),
    createdAt:Number(row.createdAt?.seconds||0)
  });
  window.UNICA_TOP_SUPPORT_FEATURED = [...comments]
    .sort((a,b)=>Number(b.likeCount||0)-Number(a.likeCount||0) || Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0))
    .slice(0,5)
    .map(toTopComment);
  window.UNICA_TOP_SUPPORT_LATEST = [...comments]
    .sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0))
    .slice(0,10)
    .map(toTopComment);
  /* 旧処理との互換性を維持。 */
  window.UNICA_TOP_SUPPORT_COMMENTS = window.UNICA_TOP_SUPPORT_LATEST;
  list.innerHTML=rows.map(row=>`<article class="community-post-plus support-comment-card${row.ownerUid===uid?' is-me':''}" data-post-id="${esc(row.id)}"><header><button class="community-post-avatar member-name-button" data-member-uid="${esc(row.ownerUid)}" type="button">${esc(row.avatar||'🌸')}</button><div><button class="member-name-text" data-member-uid="${esc(row.ownerUid)}" type="button">${esc(row.name||'うにメン')}${scentMiniBadge(row.ownerUid)}${row.ownerUid===uid?'（あなた）':''}</button><small>${esc(row.prefecture||'')}${row.prefecture?'・':''}${esc(commentDate(row))}</small></div>${row.ownerUid===uid?`<button class="community-more" data-delete-remote="${esc(row.id)}" type="button">×</button>`:'<span></span>'}</header><p>${esc(row.text)}</p><div class="community-post-actions support-actions"><button class="${myLikedCommentIds.has(row.id)?'is-liked':''}" data-like-remote="${esc(row.id)}" type="button">${myLikedCommentIds.has(row.id)?'♥':'♡'} いいね <b>${Number(row.likeCount||0)}</b></button></div></article>`).join('') || `<div class="community-empty">${activeTab==='mine'?'まだ応援コメントを送っていません。':'まだ応援コメントはありません。'}</div>`;
  $('#homeCommunityPosts') && ($('#homeCommunityPosts').textContent=String(comments.length));
  $('#homeCommunityMembers') && ($('#homeCommunityMembers').textContent=String(comments.reduce((s,x)=>s+Number(x.likeCount||0),0)));
  /* トップは新着1件ではなく、累計いいねランキングTOP3を表示。 */
  const homeLatest=$('#communityHomeLatest');
  if(homeLatest){
    const top=cumulativeLikeRanking();
    const medals=['🥇','🥈','🥉'];
    homeLatest.classList.add('is-ranking');
    homeLatest.innerHTML=top.length
      ? `<div class="home-support-ranking-head"><strong>累計いいねランキング</strong><small>TOP 3</small></div><div class="home-support-ranking-list">${top.map((x,i)=>`<button type="button" class="home-support-ranking-row" data-member-uid="${esc(x.uid)}"><span>${medals[i]}</span><span class="home-support-ranking-person"><b>${esc(x.name)}</b><small>うにメンNo.${String(Number(x.number||0)).padStart(4,'0')}</small></span><em>♥ ${x.likes}</em></button>`).join('')}</div>`
      : `<div class="home-support-ranking-empty"><strong>ランキング集計中</strong><p>応援コメントにいいねが集まると表示されます。</p></div>`;
  }
  $$('#communityList [data-like-remote]').forEach(b=>b.onclick=async()=>{
    if(b.disabled) return;
    b.disabled=true;
    await toggleCommentLike(b.dataset.likeRemote);
    b.disabled=false;
  });
  $$('#communityList [data-delete-remote]').forEach(b=>b.onclick=()=>deleteRemoteComment(b.dataset.deleteRemote));
  $$('[data-member-uid]').forEach(b=>b.onclick=()=>openMemberPass(b.dataset.memberUid));
  renderSupportLikeRanking();
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
  if(!uid || !id) return null;
  const likeRef=doc(db,'supportComments',id,'likes',uid), commentRef=doc(db,'supportComments',id);
  try {
    let nextLiked=false;
    let nextCount=0;
    await runTransaction(db,async tx=>{
      const [l,c]=await Promise.all([tx.get(likeRef),tx.get(commentRef)]);
      if(!c.exists()) throw new Error('comment-not-found');
      const n=Math.max(0,Number(c.data().likeCount||0));
      if(l.exists()){
        nextLiked=false; nextCount=Math.max(0,n-1);
        tx.delete(likeRef);
        tx.update(commentRef,{likeCount:nextCount,updatedAt:serverTimestamp()});
      }else{
        nextLiked=true; nextCount=n+1;
        tx.set(likeRef,{uid,createdAt:serverTimestamp()});
        tx.update(commentRef,{likeCount:nextCount,updatedAt:serverTimestamp()});
        if(c.data().ownerUid&&c.data().ownerUid!==uid){
          const nr=doc(collection(db,'users',c.data().ownerUid,'notifications'));
          tx.set(nr,{type:'commentLike',text:`${member()?.name||'うにメン'}さんがあなたの応援コメントにいいねしました`,commentId:id,read:false,createdAt:serverTimestamp()});
        }
      }
    });
    if(nextLiked) myLikedCommentIds.add(id); else myLikedCommentIds.delete(id);
    const row=comments.find(x=>x.id===id); if(row) row.likeCount=nextCount;
    renderComments();
    return {liked:nextLiked,count:nextCount};
  } catch(error) {
    console.error('comment like',error);
    toast('いいねを更新できませんでした。Firestoreルールも更新してください。');
    return null;
  }
}
window.UNICA_TOGGLE_COMMENT_LIKE = toggleCommentLike;
async function deleteRemoteComment(id){ if(!confirm('この応援コメントを削除しますか？'))return; await deleteDoc(doc(db,'supportComments',id)); toast('応援コメントを削除しました。'); }
function validRemoteComments(rows){
  return rows.filter(row=>!String(row.id||'').startsWith('demo-')&&!String(row.ownerUid||'').startsWith('demo-'));
}
function mergeCommentRows(){
  const byId=new Map();
  for(const row of historyComments) byId.set(row.id,row);
  for(const row of latestComments) byId.set(row.id,row);
  comments=[...byId.values()].sort((a,b)=>Number(b.createdAt?.seconds||0)-Number(a.createdAt?.seconds||0));
}
function listenComments(){
  // 最初は最新30件だけをリアルタイム購読し、一覧をすぐ表示する。
  onSnapshot(query(collection(db,'supportComments'),orderBy('createdAt','desc'),limit(30)),snap=>{
    latestComments=validRemoteComments(snap.docs.map(d=>({id:d.id,...d.data()})));
    mergeCommentRows();
    renderComments();
    refreshMyCommentLikes(latestComments,{replace:!commentHistoryLoaded}).catch(()=>{});
  },error=>console.error('comments',error));

  // 応援コメント画面が開かれた時だけ、過去分を一度取得する。
  const modal=$('#communityModal');
  if(modal){
    const observer=new MutationObserver(()=>{
      if(modal.classList.contains('is-open')) ensureCommentHistoryLoaded();
    });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
  }
}
async function ensureCommentHistoryLoaded(){
  if(commentHistoryLoaded||commentHistoryLoading||!uid)return;
  commentHistoryLoading=true;
  try{
    const snap=await getDocs(query(collection(db,'supportComments'),orderBy('createdAt','desc'),limit(300)));
    historyComments=validRemoteComments(snap.docs.map(d=>({id:d.id,...d.data()})));
    commentHistoryLoaded=true;
    mergeCommentRows();
    renderComments();
    // 画面表示を止めず、過去分のいいね状態は小分けに並列取得する。
    const older=historyComments.filter(row=>!latestComments.some(x=>x.id===row.id));
    await refreshMyCommentLikes(older,{replace:false,batchSize:30});
  }catch(error){
    console.error('comment history',error);
  }finally{
    commentHistoryLoading=false;
  }
}
async function refreshMyCommentLikes(rows=comments,{replace=false,batchSize=30}={}){
  if(!uid||!rows.length){ if(replace){myLikedCommentIds=new Set();renderComments();} return; }
  const token=++commentLikeRefreshToken;
  const found=replace?new Set():new Set(myLikedCommentIds);
  for(let i=0;i<rows.length;i+=batchSize){
    const batch=rows.slice(i,i+batchSize);
    const results=await Promise.allSettled(batch.map(row=>getDoc(doc(db,'supportComments',row.id,'likes',uid))));
    if(token!==commentLikeRefreshToken && replace)return;
    results.forEach((result,index)=>{
      if(result.status==='fulfilled'&&result.value.exists()) found.add(batch[index].id);
      else if(result.status==='fulfilled') found.delete(batch[index].id);
    });
    myLikedCommentIds=new Set(found);
    renderComments();
    // 大量件数でもメインスレッドを占有し続けない。
    if(i+batchSize<rows.length) await new Promise(resolve=>setTimeout(resolve,0));
  }
}

let memberPassRequestToken=0;
function memberJoinedDate(value){
  if(!value)return null;
  if(typeof value==='string'){
    const normalized=value.replace(/[.\/]/g,'-');
    const d=new Date(`${normalized}T00:00:00`);
    return Number.isNaN(d.getTime())?null:d;
  }
  if(typeof value?.toDate==='function')return value.toDate();
  if(Number.isFinite(value?.seconds))return new Date(value.seconds*1000);
  if(value instanceof Date)return value;
  return null;
}
function formatMemberJoined(value){
  const d=memberJoinedDate(value);
  if(!d)return '登録日の記録なし';
  return new Intl.DateTimeFormat('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d).replaceAll('/','.');
}
function memberJoinedDays(value){
  const d=memberJoinedDate(value);
  if(!d)return '—';
  const start=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const now=new Date(); const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  return `${Math.max(1,Math.floor((today-start)/86400000)+1)}日`;
}
async function openMemberPass(targetUid){
  if(!targetUid)return;
  const token=++memberPassRequestToken;
  const modal=$('#passportModal');
  // 一覧モーダルより先に、うにパスを即表示して読み込み待ちを分かりやすくする。
  $('#detailAvatar') && ($('#detailAvatar').textContent='🌸');
  $('#detailName') && ($('#detailName').textContent='読み込み中…');
  $('#detailNumber') && ($('#detailNumber').textContent='うにメンNo.----');
  $('#detailJoined') && ($('#detailJoined').textContent='読み込み中…');
  $('#detailDays') && ($('#detailDays').textContent='—');
  $('#detailPostCount') && ($('#detailPostCount').textContent='💌 —');
  $('#detailReactionCount') && ($('#detailReactionCount').textContent='♥ —');
  $('#detailBirthdayWishCount') && ($('#detailBirthdayWishCount').textContent='🎂 —');
  $('#detailPrefecture') && ($('#detailPrefecture').textContent='—');
  $('#detailBirthday') && ($('#detailBirthday').textContent='—');
  $('#detailOpenSettings')?.toggleAttribute('hidden',true); $('#detailScentRow')?.toggleAttribute('hidden',true);
  modal?.classList.add('is-open'); modal?.setAttribute('aria-hidden','false'); document.body.classList.add('member-gate-open','modal-open');
  try{
    const snap=await getDoc(doc(db,'users',targetUid));
    if(token!==memberPassRequestToken)return;
    if(!snap.exists()){toast('このうにメンの情報はまだありません。');modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');return;}
    const u=snap.data();
    const ownComments=comments.filter(row=>row.ownerUid===targetUid);
    const totalLikes=ownComments.reduce((sum,row)=>sum+Math.max(0,Number(row.likeCount||0)),0);
    const joinedValue=u.joined||u.joinedAt||u.registeredAt||u.createdAt||u.created;
    $('#detailAvatar') && ($('#detailAvatar').textContent=u.avatar||'🌸');
    $('#detailName') && ($('#detailName').textContent=u.name||'うにメン');
    $('#detailNumber') && ($('#detailNumber').textContent=u.number?`うにメンNo.${String(u.number).padStart(4,'0')}`:'うにメンNo.----');
    $('#detailJoined') && ($('#detailJoined').textContent=formatMemberJoined(joinedValue));
    $('#detailDays') && ($('#detailDays').textContent=memberJoinedDays(joinedValue));
    $('#detailPostCount') && ($('#detailPostCount').textContent=`💌 ${ownComments.length}`);
    $('#detailReactionCount') && ($('#detailReactionCount').textContent=`♥ ${totalLikes}`);
    const birthdayWishes=Number(window.UNICA_BIRTHDAY_WISH_COUNTS?.[targetUid]||0);
    $('#detailBirthdayWishCount') && ($('#detailBirthdayWishCount').textContent=`🎂 ${birthdayWishes}人`);
    $('#detailPrefecture') && ($('#detailPrefecture').textContent=u.prefecturePublic===false?'非公開':(u.prefecture||'—'));
    $('#detailBirthday') && ($('#detailBirthday').textContent=u.birthdayPublic===false?'非公開':(u.birthMonth&&u.birthDay?`${u.birthMonth}月${u.birthDay}日`:'—'));
    $('#detailTitle') && ($('#detailTitle').textContent=u.title||'はじまりのうにメン');
    const scent=u.scentDiagnosis; const scentRow=$('#detailScentRow');
    if(scent?.typeId){
      const scentType=window.UNICA_SCENT16?.typeById?.(scent.typeId);
      scentRow?.toggleAttribute('hidden',false);
      $('#detailScentFlower') && ($('#detailScentFlower').textContent=scentType?.flower||scent.flower||'🌸');
      $('#detailScentName') && ($('#detailScentName').textContent=scent.scentName||scentType?.name||'診断済み');
      $('#detailScentDate') && ($('#detailScentDate').textContent=`診断日：${String(scent.diagnosedDate||'—').replaceAll('-','/')}`);
      const mine=window.UNICA_SCENT16?.getMyResult?.();
      const match=(mine&&targetUid!==uid)?window.UNICA_SCENT16?.compatibility?.(mine,scent,uid,targetUid):null;
      $('#detailScentMatch') && ($('#detailScentMatch').textContent=match?`${match}% ${match>=95?'🌈 運命の香り':match>=90?'💖 ベストマッチ':''}`:'');
      const btn=$('#detailScentButton'); if(btn) btn.onclick=()=>{ modal?.classList.remove('is-open'); modal?.setAttribute('aria-hidden','true'); document.body.classList.remove('member-gate-open','modal-open'); document.getElementById('openScent16')?.click(); };
    }else scentRow?.toggleAttribute('hidden',true);
    $('#detailOpenSettings')?.toggleAttribute('hidden',targetUid!==uid);
  }catch(error){
    console.error('member pass',error);
    if(token===memberPassRequestToken){$('#detailName') && ($('#detailName').textContent='読み込みに失敗しました');$('#detailJoined') && ($('#detailJoined').textContent='もう一度お試しください');}
  }
}
window.UNICA_OPEN_MEMBER_PASS=openMemberPass;
window.addEventListener('unica:open-member-pass',event=>openMemberPass(event.detail?.uid));

function renderNotifications(){
  const unread=notificationRows.filter(n=>!n.read).length, badge=$('#notificationBadge'); if(badge){badge.hidden=unread===0;badge.textContent=String(unread);}
  const list=$('#notificationList'); if(!list)return;
  list.innerHTML=notificationRows.map(n=>`<article class="notification-row${n.read?'':' is-unread'}"><span>${n.type==='commentLike'?'♥':(n.type==='birthdayWish'?'🎂':'🔔')}</span><div><p>${esc(n.text||'新しい通知があります')}</p><small>${n.createdAt?.toDate?new Intl.DateTimeFormat('ja-JP',{dateStyle:'short',timeStyle:'short'}).format(n.createdAt.toDate()):'たった今'}</small></div></article>`).join('')||'<div class="notification-empty">通知はまだありません。</div>';
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
  onSnapshot(collection(db,'users'),snap=>{memberDirectory=new Map(snap.docs.map(d=>[d.id,{uid:d.id,...d.data()}]));if(comments.length)renderComments();});
  // 10秒ごとの全件再取得は行わず、コメント更新時と一覧を開いた時だけ必要分を取得する。
});
