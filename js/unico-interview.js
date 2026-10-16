import {createParticipation} from './interview-participation135.js?v=14.137';
import {onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';
import {doc,collection,getDoc,getDocs,onSnapshot,runTransaction,setDoc,deleteDoc,serverTimestamp,query,where,getCountFromServer} from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js';
const root=document.getElementById('unicoInterview');
const $=s=>root.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const interviewModal=document.getElementById('ivModal'),interviewEntry=document.getElementById('openUnicoInterview');
let interviewReturnFocus=null;
function openInterview(){
 interviewReturnFocus=document.activeElement;interviewModal.classList.add('is-open');interviewModal.setAttribute('aria-hidden','false');document.body.classList.add('iv-modal-open');interviewModal.querySelector('button[data-close-interview]').focus();
}
function closeInterview(){
 interviewModal.classList.remove('is-open');interviewModal.setAttribute('aria-hidden','true');document.body.classList.remove('iv-modal-open');interviewReturnFocus?.focus();
}
interviewEntry.addEventListener('click',event=>{event.preventDefault();openInterview();});
interviewModal.querySelectorAll('[data-close-interview]').forEach(el=>el.addEventListener('click',closeInterview));
window.addEventListener('keydown',event=>{
 if(!interviewModal.classList.contains('is-open'))return;
 if(event.key==='Escape'){event.preventDefault();closeInterview();}
 if(event.key==='Tab'){
  const nodes=[...interviewModal.querySelectorAll('button:not([disabled]),a[href],textarea,input,select,summary')].filter(el=>el.getClientRects().length);
  if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
let articleLoadTimer=null;
let api,config=null,countReady=false,busy=false,pending=[],articles=[],selected=null,editing=null,adminOpen=false,articleLoadState='loading',articleLoadCode='';
const owner=()=>!!api?.auth.currentUser&&api.auth.currentUser.uid==='I1foe78gS2bApFhweosGaLQq4FW2';
const linked=()=>api?.auth.currentUser?.providerData.some(p=>p.providerId==='google.com');
const date=v=>v?.toDate?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(v.toDate()):'';
function message(t){$('#ivMessage').textContent=t;}
function requestInterviewLogin(id=null){
 participation.remember(id??([...root.querySelectorAll('[data-answer]')].find(e=>e.open)?.dataset.answer||''));
 const gate=document.getElementById('openMemberGate');if(gate){closeInterview();gate.click();}else if($('#ivLogin'))$('#ivLogin').hidden=false;
}
function permissions(){
 participation.auth();
 if($('#ivLogin')&&linked())$('#ivLogin').hidden=true;$('#ivManage').hidden=!owner();$('#ivToggle').textContent=config?.enabled?'質問箱の受付を停止':'質問箱の受付を開始';$('#ivSubmit').disabled=busy||!config?.enabled||!countReady;
 if(!owner()){$('#ivAdmin').hidden=true;$('#ivInbox').replaceChildren();pending=[];selected=null;adminOpen=false;editing=null;$('#ivQuestion').value='';$('#ivAnswer').value='';}
}
const participation=createParticipation({root,esc,owner,linked,getApi:()=>api,login:requestInterviewLogin,rerender:()=>publicRender()});
// Display the oldest published answer first, matching the input sequence.
function orderedArticles(){return [...articles].sort((a,b)=>((a.createdAt||a.updatedAt)?.toMillis?.()||0)-((b.createdAt||b.updatedAt)?.toMillis?.()||0)||a.id.localeCompare(b.id));}
const viewedArticleKey='unicaInterviewViewedArticlesV1';
const viewedArticles=new Set();
try{const saved=JSON.parse(localStorage.getItem(viewedArticleKey)||'[]');if(Array.isArray(saved))saved.filter(id=>typeof id==='string').forEach(id=>viewedArticles.add(id));}catch{}
function renderHomeInterview(){
 const entry=document.getElementById('home86Interview');if(!entry)return;
 const unread=articleLoadState==='ready'?articles.filter(a=>!viewedArticles.has(a.id)).length:0;
 const badge=document.getElementById('home86InterviewNew');if(badge)badge.hidden=unread===0;
 entry.setAttribute('aria-label','うにこに聞いてみた・質問箱を開く'+(unread?'（未読'+unread+'件）':''));
}
function bindArticleViews(){
 root.querySelectorAll('[data-answer]').forEach(panel=>panel.addEventListener('toggle',()=>{
  if(!panel.open)return;
  viewedArticles.add(panel.dataset.answer);
  panel.querySelector('.iv-new-badge')?.remove();
  try{localStorage.setItem(viewedArticleKey,JSON.stringify([...viewedArticles]));}catch{}
  renderHomeInterview();
 }));
}
function publicRender(){
 renderHomeInterview();
 if(articleLoadState!=='ready'){
  const text=articleLoadState==='loading'?'インタビューを読み込み中…':articleLoadCode==='permission-denied'?'インタビューの閲覧がFirebaseルールで拒否されています。記事が削除されたとは限りません。':'インタビューを読み込めませんでした。通信状態を確認して再読み込みしてください。';
  $('#ivArticles').replaceChildren();const note=document.createElement('p');note.className='iv-empty';note.textContent=text;$('#ivArticles').append(note);if(articleLoadState==='error'){const retry=document.createElement('button');retry.type='button';retry.textContent='再読み込み';retry.onclick=()=>location.reload();$('#ivArticles').append(retry);}return;
 }
 const answerOpen=new Map([...root.querySelectorAll('[data-answer]')].map(el=>[el.dataset.answer,el.open]));
 participation.capture();
 const sorted=orderedArticles();
 $('#ivArticles').innerHTML=sorted.length?sorted.map((a,i)=>`<details class="iv-answer" data-answer="${esc(a.id)}" ${(answerOpen.get(a.id)===true)?'open':''}><summary><small>Q${String(i+1).padStart(2,'0')}</small><span>${esc(a.question)}${viewedArticles.has(a.id)?'':'<em class="iv-new-badge">NEW</em>'}</span><b aria-hidden="true">＋</b></summary><div class="iv-answer-body"><span class="iv-speaker">うにこ / UNICA</span><p>${esc(a.answer)}</p><time>${date(a.updatedAt)}</time>${participation.shell(a)}</div></details>`).join(''):'<p class="iv-empty">最初のインタビューを準備しています。公開をお楽しみに。</p>';
 bindArticleViews();participation.render(articles);
 if(owner()&&adminOpen)renderEditList();
}
function renderEditList(){
 $('#ivEditList').innerHTML=orderedArticles().map(a=>`<button type="button" data-edit="${esc(a.id)}">${esc(a.question)}</button>`).join('');
 $('#ivEditList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editing=b.dataset.edit;selected=null;participation.fill(editing);const a=articles.find(x=>x.id===editing);$('#ivQuestion').value=a.question;$('#ivAnswer').value=a.answer;$('#ivDeleteArticle').hidden=false;$('#ivSource').textContent='公開済みの記事を編集しています。';});
}
function renderInbox(){
 $('#ivInbox').innerHTML=pending.length?pending.map(q=>`<article class="iv-inbox-item"><small>${date(q.createdAt)}</small><p>${esc(q.body)}</p><div><button type="button" data-select="${esc(q.id)}">この質問を使う</button><button type="button" data-close="${esc(q.id)}">受付から外す</button></div></article>`).join(''):'<p>未回答の質問はありません。</p>';
 $('#ivInbox').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{selected=b.dataset.select;editing=null;participation.fill(null);$('#ivQuestion').value=pending.find(q=>q.id===selected).body;$('#ivAnswer').value='';$('#ivDeleteArticle').hidden=true;$('#ivSource').textContent='質問箱の質問を選択中。回答を入力して公開すると未回答件数から外れます。';});
 $('#ivInbox').querySelectorAll('[data-close]').forEach(b=>b.onclick=async()=>{if(!confirm('この質問を未回答の受付から外しますか？ 本文は公開されません。'))return;try{await closeQuestion(b.dataset.close);await loadInbox();message('受付から外しました。');}catch{message('更新できませんでした。もう一度お試しください。');}});
}
async function loadInbox(){if(!owner())return;const loadingUid=api.auth.currentUser.uid;const snap=await getDocs(collection(api.db,'interviewQuestions'));if(!owner()||loadingUid!==api.auth.currentUser.uid)return;pending=snap.docs.map(d=>({id:d.id,...d.data()})).filter(q=>q.status==='pending').sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));renderInbox();}
async function closeQuestion(id,article=null){
 const qref=doc(api.db,'interviewQuestions',id),cref=doc(api.db,'interviewPublic','counter');
 await runTransaction(api.db,async tx=>{const [qs,cs]=await Promise.all([tx.get(qref),tx.get(cref)]);if(!qs.exists()||qs.data().status!=='pending')throw Error('already-closed');if(!cs.exists()||cs.data().pendingCount<1)throw Error('counter');if(article)tx.set(article.ref,article.data);tx.update(qref,{status:article?'answered':'closed',updatedAt:serverTimestamp()});tx.update(cref,{pendingCount:cs.data().pendingCount-1});});
}
$('#ivSubmit').onclick=async()=>{
 if(busy)return;if(!linked()||!localStorage.getItem('unicaWorldMemberV4')){message('質問の送信には、うにメン登録とGoogle連携が必要です。');requestInterviewLogin();return;}
 const body=$('#ivBody').value.trim();if(!body||body.length>500){message('質問は1〜500文字で入力してください。');return;}
 busy=true;permissions();
 try{const ref=doc(collection(api.db,'interviewQuestions')),counter=doc(api.db,'interviewPublic','counter');await runTransaction(api.db,async tx=>{const snap=await tx.get(counter);if(!snap.exists())throw Error('not-ready');tx.set(ref,{body,authorUid:api.auth.currentUser.uid,status:'pending',createdAt:serverTimestamp()});tx.update(counter,{pendingCount:snap.data().pendingCount+1,lastSubmissionId:ref.id});});$('#ivBody').value='';message('質問を受け付けました。内容は管理者だけが確認します。');}
 catch{message('送信できませんでした。通信状態を確認して、もう一度お試しください。');}finally{busy=false;permissions();}
};
$('#ivManage').onclick=async()=>{if(!owner())return;adminOpen=!adminOpen;$('#ivAdmin').hidden=!adminOpen;if(!adminOpen)return;try{await runTransaction(api.db,async tx=>{const ref=doc(api.db,'interviewPublic','config');const snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{ownerUid:'I1foe78gS2bApFhweosGaLQq4FW2',enabled:false});});await runTransaction(api.db,async tx=>{const ref=doc(api.db,'interviewPublic','counter');const snap=await tx.get(ref);if(!snap.exists())tx.set(ref,{pendingCount:0,lastSubmissionId:''});});await loadInbox();renderEditList();}catch{message('管理データを読み込めません。Firebaseの設定を確認してください。');}};
$('#ivToggle').onclick=async()=>{if(!owner())return;try{await setDoc(doc(api.db,'interviewPublic','config'),{ownerUid:'I1foe78gS2bApFhweosGaLQq4FW2',enabled:!config?.enabled});}catch{message('受付設定を変更できませんでした。');}};
$('#ivReload').onclick=()=>loadInbox().catch(()=>message('読み込めませんでした。'));
$('#ivCopy').onclick=async()=>{try{await navigator.clipboard.writeText(pending.map((q,i)=>`${i+1}. ${q.body}`).join('\n\n'));message('未回答の質問をコピーしました。ボーカルへの送信用に使えます。');}catch{message('コピーできませんでした。質問本文を選択してコピーしてください。');}};
$('#ivNew').onclick=()=>{participation.fill(null);editing=null;selected=null;$('#ivQuestion').value='';$('#ivAnswer').value='';$('#ivDeleteArticle').hidden=true;$('#ivSource').textContent='あなたが用意した質問と、ボーカルから届いた回答を入力してください。';};
$('#ivPublish').onclick=async()=>{
 if(!owner()||busy)return;const question=$('#ivQuestion').value.trim(),answer=$('#ivAnswer').value.trim();if(!question||question.length>500||!answer||answer.length>5000){message('質問は1〜500文字、回答は1〜5,000文字で入力してください。');return;}
 try{participation.input();}catch(e){message(e.message);return;}
 if(!confirm('この質問と回答を、みんなに公開しますか？'))return;
 busy=true;$('#ivPublish').disabled=true;
 try{const ref=editing?doc(api.db,'interviewArticles',editing):doc(collection(api.db,'interviewArticles'));const data={question,answer,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};if(selected)await closeQuestion(selected,{ref,data});else if(editing)await runTransaction(api.db,async tx=>{const current=await tx.get(ref);if(!current.exists())throw Error('article-deleted');const old=current.data();tx.set(ref,{...data,createdAt:old.createdAt||old.updatedAt});});else await setDoc(ref,data);try{await participation.save(ref.id);}catch{editing=ref.id;selected=null;$('#ivDeleteArticle').hidden=false;message('記事は公開しましたが、「みんなはどう？」の設定を保存できませんでした。追加ルールを確認して、記事を再編集してください。');await loadInbox();return;}$('#ivNew').click();await loadInbox();message('質問と回答を公開しました。');}
 catch{message('公開できませんでした。質問がすでに処理されていないか、通信状態を確認してください。');}finally{busy=false;$('#ivPublish').disabled=false;permissions();}
};
$('#ivDeleteArticle').onclick=async()=>{if(!owner()||!editing||!confirm('この記事を公開一覧から削除しますか？'))return;try{await deleteDoc(doc(api.db,'interviewArticles',editing));$('#ivNew').click();message('公開記事を削除しました。');}catch{message('削除できませんでした。');}};
async function init(){
 for(let i=0;i<80&&!window.UNICA_FIREBASE?.db;i++)await new Promise(r=>setTimeout(r,100));api=window.UNICA_FIREBASE;if(!api?.db){articleLoadState='error';publicRender();message('読み込みに時間がかかっています。ページを再読み込みしてください。');return;}
 participation.start(api);
 onSnapshot(doc(api.db,'interviewPublic','config'),s=>{config=s.exists()?s.data():null;permissions();message(config?.enabled?'':config?'質問箱の受付は停止中です。':'質問箱の受付はまだ開始されていません。');},()=>{config=null;permissions();message('質問箱の設定を読み込めませんでした。');});
 onSnapshot(doc(api.db,'interviewPublic','counter'),s=>{countReady=s.exists();$('#ivCount').textContent=countReady?String(s.data().pendingCount):'—';permissions();},()=>{$('#ivCount').textContent='—';countReady=false;permissions();message('質問件数を読み込めませんでした。');});
 const acceptArticles=snap=>{articles=snap.docs.map(d=>({id:d.id,...d.data()}));articleLoadState='ready';articleLoadCode='';clearTimeout(articleLoadTimer);publicRender();};
 const failArticles=error=>{clearTimeout(articleLoadTimer);articleLoadState='error';articleLoadCode=String(error?.code||'').replace('firestore/','');publicRender();};
 articleLoadTimer=setTimeout(()=>{if(articleLoadState!=='ready')failArticles({code:'timeout'});},20000);
 onSnapshot(collection(api.db,'interviewArticles'),{includeMetadataChanges:true},snap=>{if(snap.metadata?.fromCache&&snap.empty&&articleLoadState!=='ready')return;acceptArticles(snap);},failArticles);
 // A separate read recovers when the live listener stalls during startup.
 getDocs(collection(api.db,'interviewArticles')).then(snap=>{if(articleLoadState!=='ready'&&snap.metadata?.fromCache!==true)acceptArticles(snap);}).catch(error=>{if(articleLoadState!=='ready')failArticles(error);});
 onAuthStateChanged(api.auth,permissions);
}
init().catch(error=>{clearTimeout(articleLoadTimer);articleLoadState='error';articleLoadCode=String(error?.code||'');publicRender();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(api?.db)publicRender();},{once:true});
