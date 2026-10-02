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
 fun.setAttribute('aria-label','ゲーム・診断・投票・全国のうにメン');
 const grid=make('div','home-feature-links');
 grid.append(
   card({key:'game',title:'MILK BLOOM',open:openGame}),
   card({key:'scent',title:'ぷにゅか診断',open:openScent}),
   card({key:'vote',title:'うにメン投票',open:()=>memberRoute(openVote)}),
   card({key:'prefecture',title:'全国のうにメン',open:openPrefecture})
 );
 fun.append(grid);root.append(fun);
 const artist=make('section','renewal-section artist-renewal-zone','<div class="renewal-section-head"><div><small>ARTIST & MUSIC</small><h2>うにかの音楽</h2></div><p>聴く・知る</p></div>');
 const release=$('.release-card',stack),people=$('.people-cards',stack);if(release)artist.append(release);if(people)artist.append(people);root.append(artist);
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
