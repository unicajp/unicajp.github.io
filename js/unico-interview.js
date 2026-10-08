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
let api,config=null,countReady=false,busy=false,pending=[],articles=[],selected=null,editing=null,adminOpen=false;
const owner=()=>!!api?.auth.currentUser&&api.auth.currentUser.uid==='I1foe78gS2bApFhweosGaLQq4FW2';
const linked=()=>api?.auth.currentUser?.providerData.some(p=>p.providerId==='google.com');
const date=v=>v?.toDate?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(v.toDate()):'';
function message(t){$('#ivMessage').textContent=t;}
function requestInterviewLogin(){
 const gate=document.getElementById('openMemberGate');if(gate){closeInterview();gate.click();}else if($('#ivLogin'))$('#ivLogin').hidden=false;
}
function permissions(){
 syncReadReceipts();
 if($('#ivLogin')&&linked())$('#ivLogin').hidden=true;$('#ivManage').hidden=!owner();$('#ivToggle').textContent=config?.enabled?'質問箱の受付を停止':'質問箱の受付を開始';$('#ivSubmit').disabled=busy||!config?.enabled||!countReady;root.querySelectorAll('[data-comments]').forEach(panel=>{if(panel._commentRows)renderComments(panel,panel._commentRows);});
 if(!owner()){$('#ivAdmin').hidden=true;$('#ivInbox').replaceChildren();pending=[];selected=null;adminOpen=false;editing=null;$('#ivQuestion').value='';$('#ivAnswer').value='';}
}
function publicRender(){
 const answerOpen=new Map([...root.querySelectorAll('[data-answer]')].map(el=>[el.dataset.answer,el.open]));
 stopCommentViews();
 const sorted=[...articles].sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0));
 $('#ivArticles').innerHTML=sorted.length?sorted.map((a,i)=>`<details class="iv-answer" data-answer="${esc(a.id)}" ${(answerOpen.has(a.id)?answerOpen.get(a.id):i===0)?'open':''}><summary><small>Q${String(i+1).padStart(2,'0')}</small><span>${esc(a.question)}</span><b aria-hidden="true">＋</b></summary><div class="iv-answer-body"><span class="iv-speaker">うにこ / UNICA</span><p>${esc(a.answer)}</p><time>${date(a.updatedAt)}</time>${readShell(a.id)}${commentShell(a.id)}</div></details>`).join(''):'<p class="iv-empty">最初のインタビューを準備しています。公開をお楽しみに。</p>';
 bindComments();bindReadButtons();
 if(owner()&&adminOpen)renderEditList();
}
function renderEditList(){
 $('#ivEditList').innerHTML=articles.map(a=>`<button type="button" data-edit="${esc(a.id)}">${esc(a.question)}</button>`).join('');
 $('#ivEditList').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editing=b.dataset.edit;selected=null;const a=articles.find(x=>x.id===editing);$('#ivQuestion').value=a.question;$('#ivAnswer').value=a.answer;$('#ivDeleteArticle').hidden=false;$('#ivSource').textContent='公開済みの記事を編集しています。';});
}
function renderInbox(){
 $('#ivInbox').innerHTML=pending.length?pending.map(q=>`<article class="iv-inbox-item"><small>${date(q.createdAt)}</small><p>${esc(q.body)}</p><div><button type="button" data-select="${esc(q.id)}">この質問を使う</button><button type="button" data-close="${esc(q.id)}">受付から外す</button></div></article>`).join(''):'<p>未回答の質問はありません。</p>';
 $('#ivInbox').querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{selected=b.dataset.select;editing=null;$('#ivQuestion').value=pending.find(q=>q.id===selected).body;$('#ivAnswer').value='';$('#ivDeleteArticle').hidden=true;$('#ivSource').textContent='質問箱の質問を選択中。回答を入力して公開すると未回答件数から外れます。';});
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
$('#ivNew').onclick=()=>{editing=null;selected=null;$('#ivQuestion').value='';$('#ivAnswer').value='';$('#ivDeleteArticle').hidden=true;$('#ivSource').textContent='あなたが用意した質問と、ボーカルから届いた回答を入力してください。';};
$('#ivPublish').onclick=async()=>{
 if(!owner()||busy)return;const question=$('#ivQuestion').value.trim(),answer=$('#ivAnswer').value.trim();if(!question||question.length>500||!answer||answer.length>5000){message('質問は1〜500文字、回答は1〜5,000文字で入力してください。');return;}
 if(!confirm('この質問と回答を、みんなに公開しますか？'))return;
 busy=true;$('#ivPublish').disabled=true;
 try{const ref=editing?doc(api.db,'interviewArticles',editing):doc(collection(api.db,'interviewArticles'));const data={question,answer,updatedAt:serverTimestamp()};if(selected)await closeQuestion(selected,{ref,data});else await setDoc(ref,data);$('#ivNew').click();await loadInbox();message('質問と回答を公開しました。');}
 catch{message('公開できませんでした。質問がすでに処理されていないか、通信状態を確認してください。');}finally{busy=false;$('#ivPublish').disabled=false;permissions();}
};
$('#ivDeleteArticle').onclick=async()=>{if(!owner()||!editing||!confirm('この記事を公開一覧から削除しますか？'))return;try{await deleteDoc(doc(api.db,'interviewArticles',editing));$('#ivNew').click();message('公開記事を削除しました。');}catch{message('削除できませんでした。');}};
const commentViews=new Map(),commentStops=new Map(),commentCounts=new Map();
const commentTime=v=>v?.toDate?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(v.toDate()):'送信中';
function commentQuery(id){return query(collection(api.db,'interviewComments'),where('articleId','==',id));}
function commentShell(id){return `<details class="iv-comments" data-comments="${esc(id)}"><summary>感想 <span data-comment-count>${commentCounts.get(id)??'—'}</span>件 <i aria-hidden="true">›</i></summary><div class="iv-comment-list" aria-live="polite"></div><form class="iv-comment-form"><label>うにこの回答への感想を書く<textarea maxlength="300" placeholder="この回答を読んで感じたことを…" required></textarea></label><small>感想は公開されます。300文字まで。</small><button class="iv-primary" type="submit">感想を送る</button><p class="iv-comment-message" role="status"></p></form></details>`;}
function stopCommentViews(){
 root.querySelectorAll('[data-comments]').forEach(panel=>commentViews.set(panel.dataset.comments,{open:panel.open,draft:panel.querySelector('textarea').value}));
 commentStops.forEach(stop=>stop());commentStops.clear();
}
function renderComments(panel,rows){
 const list=panel.querySelector('.iv-comment-list');
 list.innerHTML=rows.length?rows.map(r=>`<article class="iv-comment"><div><strong>${esc(r.authorName)}</strong><time>${commentTime(r.createdAt)}</time>${owner()?`<button type="button" data-delete-comment="${esc(r.id)}">削除</button>`:''}</div><p>${esc(r.text)}</p></article>`).join(''):'<p class="iv-empty">まだ感想はありません。最初のひとことをどうぞ。</p>';
 list.querySelectorAll('[data-delete-comment]').forEach(button=>button.onclick=async()=>{if(!owner()||!confirm('この感想を削除しますか？'))return;try{await deleteDoc(doc(api.db,'interviewComments',button.dataset.deleteComment));}catch{panel.querySelector('.iv-comment-message').textContent='削除できませんでした。';}});
}
function watchComments(panel){
 const id=panel.dataset.comments;if(commentStops.has(id))return;
 panel.querySelector('.iv-comment-list').textContent='感想を読み込み中…';
 const stop=onSnapshot(commentQuery(id),snap=>{if(!panel.isConnected)return;const rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0)||b.id.localeCompare(a.id));commentCounts.set(id,rows.length);panel.querySelector('[data-comment-count]').textContent=String(rows.length);panel._commentRows=rows;renderComments(panel,rows);},()=>{if(panel.isConnected)panel.querySelector('.iv-comment-list').textContent='感想を読み込めませんでした。ページを再読み込みしてください。';});commentStops.set(id,stop);
}
function bindComments(){
 root.querySelectorAll('[data-comments]').forEach(panel=>{
 const id=panel.dataset.comments,saved=commentViews.get(id);if(saved){panel.open=saved.open;panel.querySelector('textarea').value=saved.draft;}
 getCountFromServer(commentQuery(id)).then(snap=>{if(panel.isConnected&&!panel.open){commentCounts.set(id,snap.data().count);panel.querySelector('[data-comment-count]').textContent=String(snap.data().count);}}).catch(()=>{});
 panel.addEventListener('toggle',()=>{if(panel.open)watchComments(panel);else{commentStops.get(id)?.();commentStops.delete(id);}});
 panel.querySelector('form').onsubmit=async event=>{
 event.preventDefault();const form=event.currentTarget,msg=form.querySelector('.iv-comment-message'),input=form.querySelector('textarea'),button=form.querySelector('button');if(button.disabled)return;
 if(!linked()){msg.textContent='投稿には、うにメン登録とGoogle連携が必要です。';requestInterviewLogin();return;}
 const text=input.value.trim();if(!text||text.length>300){msg.textContent='感想は1〜300文字で入力してください。';return;}
 button.disabled=true;
 try{const uid=api.auth.currentUser.uid;const ref=doc(collection(api.db,'interviewComments'));
 await runTransaction(api.db,async tx=>{const [member,article]=await Promise.all([tx.get(doc(api.db,'users',uid)),tx.get(doc(api.db,'interviewArticles',id))]);if(!member.exists()||!article.exists())throw Error('not-available');tx.set(ref,{articleId:id,authorUid:uid,authorName:String(member.data().name||'うにメン'),text,createdAt:serverTimestamp()});});input.value='';commentViews.set(id,{open:true,draft:''});msg.textContent='感想を投稿しました。';}
 catch{msg.textContent='投稿できませんでした。会員登録・通信状態を確認してください。';}finally{button.disabled=false;}
 };
 if(panel.open)watchComments(panel);
 });
}

const REACTIONS=[['warm','ほっこりした'],['agree','共感した'],['more','もっと聞きたい']];
const readStates=new Map(),readCountStops=new Map(),readReceiptStops=new Map();
let readAuthUid=null;
const reactionKey=(id,kind)=>id+':'+kind;
function readState(id,kind){const key=reactionKey(id,kind);if(!readStates.has(key))readStates.set(key,{count:null,countError:false,pressed:false,receiptReady:false,pending:false,error:''});return readStates.get(key);}
function readShell(id){return `<div class="iv-reactions" data-reaction-group="${esc(id)}"><div class="iv-reaction-buttons">${REACTIONS.map(([kind,label])=>`<button type="button" class="iv-reaction-button" data-read-article="${esc(id)}" data-reaction="${kind}" aria-pressed="false" disabled><span>${label}</span><b>—</b></button>`).join('')}</div><p class="iv-reaction-note">いくつでも選べます。もう一度押すと解除できます。</p><p data-read-message role="status"></p></div>`;}
function renderReadButton(id){
 const errors=[];
 root.querySelectorAll('[data-read-article]').forEach(button=>{if(button.dataset.readArticle!==id)return;const kind=button.dataset.reaction,st=readState(id,kind),label=REACTIONS.find(x=>x[0]===kind)[1];
 button.querySelector('span').textContent=label;button.querySelector('b').textContent=st.count===null?'—':String(st.count);
 button.disabled=st.pending||st.count===null||(linked()&&!st.receiptReady);
 button.classList.toggle('is-selected',st.pressed);button.setAttribute('aria-pressed',String(st.pressed));button.setAttribute('aria-label',`${label}、${st.count===null?'読み込み中':st.count+'人'}${st.pressed?'、選択済み。押すと解除':''}`);
 if(st.error)errors.push(st.error);else if(st.countError)errors.push('件数を読み込めませんでした。通信状態とFirebaseルールを確認してください。');
 });const group=[...root.querySelectorAll('[data-reaction-group]')].find(x=>x.dataset.reactionGroup===id);if(group)group.querySelector('[data-read-message]').textContent=[...new Set(errors)].join(' ');
}
function syncReadReceipts(){
 if(!api?.db)return;const uid=linked()?api.auth.currentUser.uid:null;
 if(readAuthUid!==uid){readReceiptStops.forEach(stop=>stop());readReceiptStops.clear();readAuthUid=uid;readStates.forEach(st=>{st.pressed=false;st.receiptReady=!uid;st.pending=false;st.error='';});}
 const keys=new Set(articles.flatMap(a=>REACTIONS.map(([kind])=>reactionKey(a.id,kind))));
 for(const [key,stop] of readReceiptStops)if(!keys.has(key)){stop();readReceiptStops.delete(key);}
 articles.forEach(({id})=>REACTIONS.forEach(([kind])=>{const st=readState(id,kind),key=reactionKey(id,kind);if(!uid){st.receiptReady=true;renderReadButton(id);return;}
 if(!readReceiptStops.has(key))readReceiptStops.set(key,onSnapshot(doc(api.db,'interviewArticles',id,'reactions',uid,'choices',kind),snap=>{if(readAuthUid!==uid)return;st.pressed=snap.exists()&&snap.data().selected===true;st.receiptReady=true;st.error='';renderReadButton(id);},()=>{if(readAuthUid!==uid)return;st.receiptReady=false;st.error='選択状態を確認できませんでした。通信状態とFirebaseルールを確認してください。';renderReadButton(id);}));renderReadButton(id);}));
}
function reactionEffect(button){
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const spark=document.createElement('i');spark.className='iv-reaction-spark';spark.textContent='✦';spark.setAttribute('aria-hidden','true');button.appendChild(spark);setTimeout(()=>spark.remove(),750);
}
function bindReadButtons(){
 const keys=new Set(articles.flatMap(a=>REACTIONS.map(([kind])=>reactionKey(a.id,kind))));for(const [key,stop] of readCountStops)if(!keys.has(key)){stop();readCountStops.delete(key);readStates.delete(key);}
 articles.forEach(({id})=>REACTIONS.forEach(([kind])=>{const key=reactionKey(id,kind);if(!readCountStops.has(key))readCountStops.set(key,onSnapshot(doc(api.db,'interviewReactionCounts',id,'counts',kind),snap=>{const st=readState(id,kind);st.count=snap.exists()?Number(snap.data().count):0;st.countError=false;renderReadButton(id);},()=>{const st=readState(id,kind);st.count=null;st.countError=true;renderReadButton(id);}));}));syncReadReceipts();
 root.querySelectorAll('[data-read-article]').forEach(button=>button.onclick=async()=>{
 const id=button.dataset.readArticle,kind=button.dataset.reaction,st=readState(id,kind);if(st.pending)return;
 if(!linked()){message('リアクションには、うにメン登録とGoogle連携が必要です。');requestInterviewLogin();return;}
 const uid=api.auth.currentUser.uid,target=!st.pressed;st.pending=true;st.error='';renderReadButton(id);
 try{await runTransaction(api.db,async tx=>{
 const receipt=doc(api.db,'interviewArticles',id,'reactions',uid,'choices',kind),counter=doc(api.db,'interviewReactionCounts',id,'counts',kind);
 const [old,totals,article,member]=await Promise.all([tx.get(receipt),tx.get(counter),tx.get(doc(api.db,'interviewArticles',id)),tx.get(doc(api.db,'users',uid))]);
 if(!article.exists()||!member.exists())throw Error('not-available');const selected=old.exists()&&old.data().selected===true;if(selected===target)return;
 const count=totals.exists()?totals.data().count:0;if(!Number.isInteger(count)||count<0||(!target&&count===0))throw Error('invalid-count');
 tx.set(receipt,{selected:target,updatedAt:serverTimestamp()});tx.set(counter,{count:count+(target?1:-1)});
 });if(readAuthUid===uid){st.pressed=target;if(target&&button.isConnected)reactionEffect(button);}
 }catch{if(readAuthUid===uid)st.error='保存できませんでした。会員登録・通信状態・Firebaseルールを確認して、もう一度お試しください。';}
 finally{st.pending=false;renderReadButton(id);}
 });articles.forEach(({id})=>renderReadButton(id));
}

async function init(){
 for(let i=0;i<80&&!window.UNICA_FIREBASE?.db;i++)await new Promise(r=>setTimeout(r,100));api=window.UNICA_FIREBASE;if(!api?.db){message('読み込みに時間がかかっています。ページを再読み込みしてください。');return;}
 onSnapshot(doc(api.db,'interviewPublic','config'),s=>{config=s.exists()?s.data():null;permissions();message(config?.enabled?'':config?'質問箱の受付は停止中です。':'質問箱の受付はまだ開始されていません。');},()=>{config=null;permissions();message('質問箱の設定を読み込めませんでした。');});
 onSnapshot(doc(api.db,'interviewPublic','counter'),s=>{countReady=s.exists();$('#ivCount').textContent=countReady?String(s.data().pendingCount):'—';permissions();},()=>{$('#ivCount').textContent='—';countReady=false;permissions();message('質問件数を読み込めませんでした。');});
 onSnapshot(collection(api.db,'interviewArticles'),snap=>{articles=snap.docs.map(d=>({id:d.id,...d.data()}));publicRender();},()=>{$('#ivArticles').textContent='インタビューを読み込めませんでした。';});
 onAuthStateChanged(api.auth,permissions);
}
init();
