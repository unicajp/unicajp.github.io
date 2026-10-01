(()=>{
'use strict';

const $=(s,r=document)=>r.querySelector(s);

function isOpen(el){
  return !!el && (el.classList.contains('is-open') || el.getAttribute('aria-hidden')==='false');
}
function member(){
  try{
    return JSON.parse(localStorage.getItem('unicaWorldMemberV4')||localStorage.getItem('unicaWorldMemberV3')||'null');
  }catch(_){ return null; }
}
function toast(text){
  const el=$('#miniToast');
  if(!el)return;
  el.textContent=text;
  el.classList.add('is-visible','is-show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove('is-visible','is-show'),1800);
}
function openGuestLock(){
  const modal=$('#guestLockModal');
  if(!modal)return false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('guest-lock-open');
  window.setTimeout(()=>$('#guestLockRegister')?.focus(),120);
  return true;
}
function requireMember(){
  if(member())return true;
  openGuestLock();
  return false;
}

function openGame(){
  if(!requireMember())return;
  if(typeof window.UNICA_MILK_MATCH?.open==='function'){
    window.UNICA_MILK_MATCH.open();
    return;
  }
  toast('MILK BLOOMを読み込み中です。少し待ってもう一度押してください。');
}
function openDiagnosis(){
  if(!requireMember())return;
  if(typeof window.UNICA_SCENT16?.open==='function'){
    window.UNICA_SCENT16.open();
    return;
  }
  toast('ぷにゅか診断を読み込み中です。少し待ってもう一度押してください。');
}
function openVote(){
  if(!requireMember())return;
  if(typeof window.UNICA_OPEN_VERSION_POLL_HISTORY==='function'){
    window.UNICA_OPEN_VERSION_POLL_HISTORY();
    return;
  }
  // The poll module is loaded as a module, so give it a short moment if Firebase is still initializing.
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(typeof window.UNICA_OPEN_VERSION_POLL_HISTORY==='function'){
      clearInterval(timer);
      window.UNICA_OPEN_VERSION_POLL_HISTORY();
    }else if(tries>=12){
      clearInterval(timer);
      toast('投票結果を読み込み中です。少し待ってもう一度押してください。');
    }
  },120);
}
function openPrefecture(){
  if(!requireMember())return;
  if(typeof window.UNICA_PREFECTURE_DIRECTORY?.open==='function'){
    window.UNICA_PREFECTURE_DIRECTORY.open();
    return;
  }
  toast('全国のうにメンを読み込み中です。少し待ってもう一度押してください。');
}
function openCommunity(){
  if(!requireMember())return;
  const modal=$('#communityModal');
  if(modal && !isOpen(modal)){
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('member-gate-open');
  }
}

const routes={
  game:openGame,
  scent:openDiagnosis,
  vote:openVote,
  prefecture:openPrefecture
};

// Run in capture phase so the visible compact cards do not depend on old hidden-card click chains.
document.addEventListener('click',event=>{
  const target=event.target instanceof Element ? event.target : null;
  if(!target)return;

  const card=target.closest('.simple-home-card[data-feature-key]');
  if(card){
    const key=card.dataset.featureKey;
    const fn=routes[key];
    if(!fn)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    fn();
    return;
  }

  if(target.closest('#sreDiagnose')){
    event.preventDefault();
    event.stopImmediatePropagation();
    openDiagnosis();
    return;
  }

  if(target.closest('#homeQuickCommentHistory')){
    event.preventDefault();
    event.stopImmediatePropagation();
    openCommunity();
    return;
  }
},true);

// Lightweight audit hooks for future debugging.
window.UNICA_HOME_LINKS={
  game:openGame,
  diagnosis:openDiagnosis,
  vote:openVote,
  prefecture:openPrefecture,
  community:openCommunity
};
})();