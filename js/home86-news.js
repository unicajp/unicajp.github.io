import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {collection,doc,onSnapshot,setDoc,deleteDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
const modal=document.getElementById('ivModal'),interview=document.getElementById('unicoInterview');
const navLabel=modal.querySelector('.iv-modal-nav>span'),interviewNavLabel=navLabel?.textContent||'UNICA INTERVIEW';
const reader=document.createElement('section');reader.className='home86-news-reader';reader.hidden=true;
reader.innerHTML='<button type="button" id="news86Back">お知らせ一覧へ</button><h2 id="home86NewsHeading" tabindex="-1">お知らせ</h2><div id="news86Content"></div><section class="home86-news-editor" id="news86Editor" hidden><h3>お知らせ管理</h3><label for="news86Select">公開済みのお知らせ</label><select id="news86Select"><option value="">新しいお知らせ</option></select><label for="news86Title">見出し</label><input id="news86Title" maxlength="70" /><label for="news86Text">本文</label><textarea id="news86Text" maxlength="3000"></textarea><label for="news86Photo">写真（任意）</label><input id="news86Photo" type="file" accept="image/jpeg,image/png,image/webp" /><img id="news86PhotoPreview" alt="登録する写真" hidden /><button type="button" id="news86PhotoRemove">写真を外す</button><label for="news86Link">リンク（任意・https://）</label><input id="news86Link" type="url" maxlength="500" placeholder="https://" /><button type="button" id="news86Save">内容を確認して公開する</button><button type="button" id="news86Delete" hidden>削除</button><p id="news86Message" role="status"></p></section>';
modal.querySelector('.iv-page-main').append(reader);
const $=id=>reader.querySelector('#'+id),escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let api,rows=[],loaded=false,loadError=false,editing='',photo='',busy=false,photoPending=false,photoTicket=0,shownId=null;
// Read state belongs to this browser and login; opening the list never marks articles read.
const readCache=new Map();
const readKey=()=> 'unicaWorldNewsReadV1:'+String(api?.auth?.currentUser?.uid||'guest');
function readIds(){const key=readKey();if(!readCache.has(key)){let ids=[];try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))ids=value.filter(id=>typeof id==='string');}catch{}readCache.set(key,new Set(ids));}return readCache.get(key);}
const unread=item=>!readIds().has(item.id);
function updateUnread(){const count=rows.filter(unread).length,badge=document.getElementById('home86NewsNew'),button=document.getElementById('home86NewsOpen');if(badge)badge.hidden=!count;if(button)button.setAttribute('aria-label',count?'お知らせ一覧を開く・未読'+count+'件':'お知らせ一覧を開く');}
function markRead(item){const ids=readIds();if(ids.has(item.id))return;ids.add(item.id);try{localStorage.setItem(readKey(),JSON.stringify([...ids]));}catch{}updateUnread();}
window.addEventListener('storage',event=>{if(event.key!==null&&event.key!==readKey())return;readCache.delete(readKey());updateUnread();if(!reader.hidden&&!shownId)show();});
const admin=()=>api?.auth.currentUser?.uid==='I1foe78gS2bApFhweosGaLQq4FW2';
const link=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:'';}catch{return '';}};
const date=v=>v?.toDate?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(v.toDate()):'';
function restoreInterview(){reader.hidden=true;interview.hidden=false;if(navLabel)navLabel.textContent=interviewNavLabel;modal.querySelector('.iv-modal-panel').setAttribute('aria-labelledby','ivTitle');}
document.getElementById('openUnicoInterview').addEventListener('click',restoreInterview);
modal.querySelectorAll('[data-close-interview]').forEach(el=>el.addEventListener('click',restoreInterview));
function openNews(manage=false,id=null){document.getElementById('openUnicoInterview').click();interview.hidden=true;reader.hidden=false;if(navLabel)navLabel.textContent='NEWS & MUSIC';modal.querySelector('.iv-modal-panel').setAttribute('aria-labelledby','home86NewsHeading');reader.closest('.iv-modal-panel').scrollTop=0;$('news86Editor').hidden=!(manage&&admin());show(id);$('home86NewsHeading').focus({preventScroll:true});}
function show(id){
 shownId=id||null;const item=rows.find(row=>row.id===id),content=$('news86Content');
 $('home86NewsHeading').textContent=item?.title||'お知らせ';$('news86Back').hidden=!item;
 if(item){
  if(!reader.hidden)markRead(item);
  const image=String(item.photo||'');content.innerHTML='<p>'+escape(date(item.createdAt))+'</p>'+(image.startsWith('data:image/jpeg;base64,')?'<img src="'+escape(image)+'" alt="お知らせの写真" />':'')+'<p class="news-body">'+escape(item.text)+'</p>'+(link(item.link)?'<a href="'+escape(link(item.link))+'" target="_blank" rel="noopener noreferrer">リンクを開く ↗</a>':'');
 }else{
  const count=rows.filter(unread).length;
  content.innerHTML=(rows.length?'<p class="news116-list-count">'+rows.length+'件'+(count?' · 未読'+count+'件':'')+'</p>':'')+'<div class="home86-news-list">'+(rows.length?rows.map(row=>'<button type="button" data-news-id="'+escape(row.id)+'"><span class="news116-list-meta"><time>'+escape(date(row.createdAt))+'</time>'+(unread(row)?'<span class="news116-new">NEW</span>':'')+'</span><strong>'+escape(row.title)+'</strong><span class="news116-list-arrow" aria-hidden="true">›</span></button>').join(''):'<p>'+(loadError?'お知らせを読み込めませんでした。':loaded?'お知らせは準備中です。':'お知らせを読み込み中…')+'</p>')+'</div>';
  content.querySelectorAll('[data-news-id]').forEach(button=>button.onclick=()=>{show(button.dataset.newsId);reader.closest('.iv-modal-panel').scrollTop=0;$('home86NewsHeading').focus({preventScroll:true});});
 }
}
$('news86Back').onclick=()=>{show();reader.closest('.iv-modal-panel').scrollTop=0;$('home86NewsHeading').focus({preventScroll:true});};
function photoView(){const img=$('news86PhotoPreview');img.hidden=!photo;if(photo)img.src=photo;else img.removeAttribute('src');}
function edit(id=''){if(busy&&!photoPending)return;photoPending=false;busy=false;$('news86Save').disabled=false;editing=id;const row=rows.find(row=>row.id===id);$('news86Title').value=row?.title||'';$('news86Text').value=row?.text||'';$('news86Link').value=row?.link||'';photo=row?.photo||'';photoTicket++;$('news86Photo').value='';photoView();$('news86Delete').hidden=!row;$('news86Message').textContent='';}
$('news86Select').onchange=event=>edit(event.target.value);
$('news86PhotoRemove').onclick=()=>{if(busy&&!photoPending)return;photoPending=false;busy=false;$('news86Save').disabled=false;photoTicket++;photo='';$('news86Photo').value='';photoView();};
$('news86Photo').onchange=async event=>{const file=event.target.files[0];if(!file||!admin()||busy&&!photoPending)return;const ticket=++photoTicket;busy=true;photoPending=true;$('news86Save').disabled=true;$('news86Message').textContent='写真を準備中…';try{if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20*1024*1024)throw Error('写真は20MB以下のJPEG・PNG・WebPを選んでください。');const url=URL.createObjectURL(file);const img=new Image();try{img.src=url;await img.decode();}finally{URL.revokeObjectURL(url);}const canvas=document.createElement('canvas');const ratio=Math.min(1,1000/img.naturalWidth,1000/img.naturalHeight);canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(img,0,0,canvas.width,canvas.height);let result=canvas.toDataURL('image/jpeg',.72);if(result.length>220000)result=canvas.toDataURL('image/jpeg',.42);if(result.length>220000)throw Error('写真の容量が大きいため、少し小さな画像を選んでください。');if(ticket===photoTicket){photo=result;photoView();$('news86Message').textContent='写真を準備できました。公開ボタンで保存します。';}}catch(error){if(ticket===photoTicket)$('news86Message').textContent=error.message||'写真を読み込めませんでした。';}finally{if(ticket===photoTicket){busy=false;photoPending=false;$('news86Save').disabled=false;}}};
$('news86Save').onclick=async()=>{if(!admin()||busy)return;const title=$('news86Title').value.trim(),text=$('news86Text').value.trim(),rawLink=$('news86Link').value.trim();if(!title||!text||rawLink&&!link(rawLink)){$('news86Message').textContent='見出し・本文を入力し、リンクはhttps://で指定してください。';return;}if(!confirm('「'+title+'」を公開しますか？'))return;busy=true;$('news86Save').disabled=true;try{const ref=editing?doc(api.db,'worldNews',editing):doc(collection(api.db,'worldNews'));const value={title,text,photo,link:rawLink?link(rawLink):'',updatedAt:serverTimestamp()};if(!editing)value.createdAt=serverTimestamp();await setDoc(ref,value,{merge:true});editing=ref.id;refresh();show(ref.id);$('news86Delete').hidden=false;$('news86Message').textContent='公開しました。';}catch{$('news86Message').textContent='保存できませんでした。通信状態とお知らせ用ルールの公開を確認してください。';}finally{busy=false;$('news86Save').disabled=false;}};
$('news86Delete').onclick=async()=>{if(!admin()||!editing||busy||!confirm('このお知らせを削除しますか？'))return;busy=true;try{await deleteDoc(doc(api.db,'worldNews',editing));edit();$('news86Message').textContent='削除しました。';}catch{$('news86Message').textContent='削除できませんでした。';}finally{busy=false;}};
function refresh(){document.getElementById('home86NewsManage').hidden=!admin();if(!admin())$('news86Editor').hidden=true;updateUnread();const select=$('news86Select');select.innerHTML='<option value="">新しいお知らせ</option>'+rows.map(row=>'<option value="'+escape(row.id)+'">'+escape(row.title)+'</option>').join('');select.value=rows.some(row=>row.id===editing)?editing:'';const total=document.getElementById('prefectureTotalMembers')?.textContent;const directory=document.querySelector('.home86-directory');if(directory&&total)directory.textContent='うにメン '+total+' ›';}
let starting=false,initialized=false;
async function init(){
 if(initialized||starting)return;starting=true;
 try{
  // The home buttons are built by another script at DOMContentLoaded.
  // Firebase can already be ready before that event, especially on a repeat visit.
  if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  for(let i=0;i<150&&(!window.UNICA_FIREBASE?.db||!document.getElementById('home86NewsOpen')||!document.getElementById('home86NewsManage'));i++)await new Promise(resolve=>setTimeout(resolve,100));
  api=window.UNICA_FIREBASE;const openButton=document.getElementById('home86NewsOpen'),manageButton=document.getElementById('home86NewsManage');
  if(!api?.db||!api.auth||!openButton||!manageButton)return;
  initialized=true;openButton.onclick=()=>openNews();manageButton.onclick=()=>openNews(true);
  onAuthStateChanged(api.auth,()=>{refresh();if(!reader.hidden&&!shownId)show();});
  onSnapshot(collection(api.db,'worldNews'),snapshot=>{rows=snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0));loaded=true;loadError=false;refresh();if(!reader.hidden)show(shownId);},()=>{loaded=true;loadError=true;refresh();if(!reader.hidden)show(shownId);});
  const total=document.getElementById('prefectureTotalMembers');if(total)new MutationObserver(refresh).observe(total,{childList:true,subtree:true});refresh();
 }finally{starting=false;}
}
window.addEventListener('unica:firebase-ready',()=>{init();if(initialized)refresh();});
window.addEventListener('unica:auth-provider-changed',()=>{init();if(initialized)refresh();});
init();
