(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const make=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
function guestLock(){const m=$('#guestLockModal');if(!m)return false;m.classList.add('is-open');m.setAttribute('aria-hidden','false');document.body.classList.add('guest-lock-open');return true}
function hasMember(){try{return Boolean(JSON.parse(localStorage.getItem('unicaWorldMemberV4')||localStorage.getItem('unicaWorldMemberV3')||'null'))}catch(_){return false}}
function memberRoute(fn){if(!hasMember()){guestLock();return false}try{return fn()!==false}catch(_){return false}}
function openGame(){return memberRoute(()=>window.UNICA_MILK_MATCH?.open?.())}
function openScent(){return memberRoute(()=>window.UNICA_SCENT16?.open?.())}
function openPrefecture(){return memberRoute(()=>window.UNICA_PREFECTURE_DIRECTORY?.open?.())}
function openVote(){
  if(typeof window.UNICA_OPEN_VERSION_POLL_HISTORY==='function'){
    window.UNICA_OPEN_VERSION_POLL_HISTORY();
    return true;
  }
  return false;
}
function card({key,title,open}){
  const b=make('button',`home-feature-link card-${key}`);
  b.type='button';b.dataset.featureKey=key;
  b.textContent=title;
  b.addEventListener('click',open);
  return b;
}
function build(){
 const stack=$('#worldHome .app-home-stack');if(!stack||$('#phase1241Renewal'))return;
 const root=make('div','phase1241-renewal phase1410-clean-home');root.id='phase1241Renewal';
 const fun=make('section','renewal-section renewal-section-simple');
 root.classList.add('home86');document.body.classList.add('home86-layout');
 fun.setAttribute('aria-label','こころを育てる');
 const diagnose=card({key:'scent',title:'ぷにゅか診断',open:openScent});diagnose.classList.add('home86-diagnosis');
 diagnose.innerHTML='<div><small>KOKORO BLOOM</small><strong>ぷにゅか診断</strong><p>5問からはじまる、こころの冒険</p><span class="home124-action" aria-hidden="true">›</span></div><img src="assets/punyuka/stage1_base.webp" alt="" />';
 fun.append(diagnose);root.append(fun);
 const interview=make('button','home86-interview','<span class="home86-interview-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M9 9h26a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H21l-10 7v-7H9a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 20h16M14 26h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span><span class="home86-interview-label"><em class="home124-kicker">UNICO TALK</em><strong>うにこに聞いてみた</strong><small>インタビュー ＋ 質問箱</small></span><span class="news116-new" id="home86InterviewNew" hidden>NEW</span><span class="home86-interview-arrow" aria-hidden="true">›</span>');interview.type='button';interview.id='home86Interview';interview.setAttribute('aria-label','うにこに聞いてみた・質問箱を開く');interview.onclick=()=>document.getElementById('openUnicoInterview')?.click();root.append(interview);
 const ask=make('button','home152-question','<span><strong>うにこに質問する</strong><small>あなたの質問が、次のインタビューに。</small></span><b aria-hidden="true">↗</b>');ask.id='home152Question';ask.type='button';ask.onclick=()=>window.UNICA_QUESTION_BOX?.open();root.append(ask);
 const news=make('section','home86-news','<button type="button" id="home86NewsOpen" aria-label="お知らせ一覧を開く"><span class="home86-news-symbol" aria-hidden="true">✉</span><strong>お知らせ</strong><span class="news116-new" id="home86NewsNew" hidden>NEW</span><span class="home86-news-arrow" aria-hidden="true">›</span></button><button type="button" id="home86NewsManage" hidden>管理</button>');news.setAttribute('aria-label','お知らせ');root.prepend(news);
 const release=$('.release-card',stack);if(release){release.classList.add('home86-release');const artist=make('section','artist-renewal-zone');artist.append(release);root.append(artist);}
 const community=make('section','home86-support');const comments=$('.home-comments');if(comments){comments.querySelector('header span').textContent='最新のひとこと';community.append(comments);}const supportButton=make('button','home86-support-open','みんなの応援を見る・書く <b>›</b>');supportButton.type='button';supportButton.onclick=()=>document.getElementById('homeQuickCommentHistory')?.click();community.append(supportButton);root.append(community);
 const members=make('nav','home86-members');members.setAttribute('aria-label','うにメンメニュー');const pass=make('button','home86-pass','うにパス <b>›</b>');pass.type='button';pass.onclick=()=>document.getElementById('openUniPassDirect')?.click();const directory=card({key:'prefecture',title:'うにメンを見る',open:openPrefecture});directory.classList.add('home86-directory');members.append(pass,directory);root.append(members);
 const people=$('.people-cards',stack);if(people){people.classList.add('home86-people');root.append(people);}
 stack.prepend(root);

 // SUPPORT is intentionally outside the home dashboard.
 // Put it after the final official SNS section near the absolute bottom of the page.
 const support=make(
   'section',
   'site-bottom-support',
   '<div class="site-bottom-support-copy"><small>SUPPORT</small><strong>お問い合わせ</strong><span>不具合・ご要望</span></div><a href="https://x.com/unica_jpn" target="_blank" rel="noopener noreferrer" aria-label="Xでお問い合わせする">Xで連絡 <b>↗</b></a>'
 );
 const connect=document.getElementById('connect');
 if(connect){
   connect.insertAdjacentElement('afterend',support);
 }else{
   document.querySelector('main')?.append(support);
 }
 ['#milkMatchHomeCard','#openMilkLyrics','.milk-release-countdown','#scent16HomeCard','#prefectureHomeCard'].forEach(sel=>{const e=$(sel,stack);if(e)e.classList.add('phase1241-hidden-home')});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
