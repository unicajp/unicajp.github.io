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
 diagnose.innerHTML='<div><small>KOKORO BLOOM</small><strong>こころに、<br>ぷにゅかを。</strong><p>まず5問。育てながら、自分を知る。</p><span>ぷにゅか診断をひらく <b>›</b></span></div><img src="assets/punyuka/stage1_base.webp" alt="" />';
 fun.append(diagnose);root.append(fun);
 const interview=make('button','home86-interview','<small>UNICA INTERVIEW</small><strong>うにこの声を、もう少し。</strong><p id="home86Question">歌のこと、日々のこと。うにこのインタビュー。</p><span id="home86Answer"></span><em>回答を読む <b>›</b></em>');interview.type='button';interview.id='home86Interview';interview.onclick=()=>{document.getElementById('openUnicoInterview')?.click();const id=interview.dataset.articleId;if(id)requestAnimationFrame(()=>{const panel=[...document.querySelectorAll('[data-answer]')].find(el=>el.dataset.answer===id);if(panel){panel.open=true;panel.scrollIntoView({block:'start'});}});};root.append(interview);
 const news=make('section','home86-news','<button type="button" id="home86NewsOpen" aria-label="お知らせ一覧を開く"><span class="home86-news-symbol" aria-hidden="true">✉</span><strong>お知らせ</strong><span class="news116-new" id="home86NewsNew" hidden>NEW</span><span class="home86-news-arrow" aria-hidden="true">›</span></button><button type="button" id="home86NewsManage" hidden>管理</button>');news.setAttribute('aria-label','お知らせ');root.append(news);
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
