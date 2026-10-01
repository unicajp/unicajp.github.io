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
function clickOriginal(id){
  const el=document.getElementById(id);
  if(!el)return false;
  el.click();
  return true;
}
function forceModal(id, bodyClass='modal-open'){
  const modal=document.getElementById(id);
  if(!modal)return false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  if(bodyClass)document.body.classList.add(bodyClass);
  return true;
}
function after(ms,fn){ window.setTimeout(fn,ms); }

function openGame(){
  clickOriginal('openMilkMatch');
  after(90,()=>{
    const modal=$('#milkMatchModal');
    if(modal && !isOpen(modal)){
      forceModal('milkMatchModal', null);
      document.body.style.overflow='hidden';
    }
  });
}
function openDiagnosis(){
  clickOriginal('openScent16');
  after(90,()=>{
    const modal=$('#scent16Modal');
    if(modal && !isOpen(modal) && member()){
      forceModal('scent16Modal','member-gate-open');
      try{ window.UNICA_SCENT16?.showIntro?.(); }catch(_){}
    }
  });
}
function openVote(){
  if(typeof window.UNICA_OPEN_VERSION_POLL_HISTORY==='function'){
    window.UNICA_OPEN_VERSION_POLL_HISTORY();
    return;
  }
  const btn=$('#versionPollHistory');
  if(btn){btn.click();return;}
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
  clickOriginal('openPrefectureDirectory');
  after(120,()=>{
    const modal=$('#prefectureDirectoryModal');
    if(modal && !isOpen(modal) && member()){
      forceModal('prefectureDirectoryModal','modal-open');
    }
  });
}
function openCommunity(){
  const btn=document.querySelector('[data-world-nav="community"]');
  if(btn && btn.id!=='homeQuickCommentHistory')btn.click();
  after(80,()=>{
    const modal=$('#communityModal');
    if(modal && !isOpen(modal) && member()){
      forceModal('communityModal','member-gate-open');
    }
  });
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