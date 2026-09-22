(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
function installNeutralAvatar(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function html(profile={},size='normal'){
    const label=profile?.name?`${profile.name}のBLOOM AVATAR`:'BLOOM AVATAR';
    return `<span class="unica-bloom-avatar ${size==='tiny'?'is-tiny':''}" title="${esc(label)}" aria-label="${esc(label)}"><span class="ub-placeholder" aria-hidden="true">✦</span></span>`;
  }
  window.UNICA_BLOOM_BADGE={html,render:(el,p,size)=>{if(el)el.innerHTML=html(p,size)}};
  let st=$('#unicaBloomBadgeStyle'); if(!st){st=document.createElement('style');st.id='unicaBloomBadgeStyle';document.head.appendChild(st)}
  st.textContent=`.unica-bloom-avatar{position:relative;display:inline-grid;place-items:center;width:30px;height:30px;flex:0 0 30px;border-radius:50%;box-sizing:border-box;background:linear-gradient(145deg,#fff,#f1f4f8);border:1.5px solid #cbd4df;box-shadow:0 2px 7px rgba(42,55,88,.12);vertical-align:middle;overflow:hidden}.unica-bloom-avatar.is-tiny{width:24px;height:24px;flex-basis:24px}.unica-bloom-avatar .ub-placeholder{display:grid;place-items:center;width:100%;height:100%;font:800 12px/1 system-ui,sans-serif;color:#8291a4}.unica-bloom-avatar.is-tiny .ub-placeholder{font-size:10px}.unica-bloom-avatar small,.unica-bloom-avatar [class*=birth]{display:none!important}.emoji-builder,#settingsEditIcon{display:none!important}`;
}
function maintenance(){
  const modal=$('#scent16Modal'),screen=$('#scent16Screen');
  if(!modal||!screen)return;
  modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  const title=$('#scent16Title'); if(title)title.textContent='KOKORO BLOOM';
  screen.innerHTML=`<div class="kokoro-maintenance"><span aria-hidden="true">✦</span><small>KOKORO BLOOM</small><h3>ただいまメンテナンス中です</h3><p>新しい診断体験へ向けて準備しています。<br>公開までしばらくお待ちください。</p></div>`;
}
function install(){
  installNeutralAvatar();
  document.addEventListener('click',e=>{const open=e.target.closest('#openScent16,[data-feature-key="scent"]');if(!open)return;e.preventDefault();e.stopImmediatePropagation();maintenance();},true);
  const open=$('#openScent16'); if(open){open.setAttribute('aria-label','KOKORO BLOOM（メンテナンス中）');const c=open.querySelector('.scent16-home-copy');if(c)c.innerHTML='<small>NEW KOKORO EXPERIENCE</small><strong>KOKORO BLOOM</strong><em id="scent16HomeSummary">新しい診断体験を準備中です。</em>';const b=$('#scent16HomeCta');if(b)b.textContent='メンテナンス中'}
  const cleanup=()=>{document.querySelectorAll('[data-sub-feature-key="flowers"],.name-flower-button,.mind-flower-view,.flower-memory').forEach(x=>x.remove())};
  cleanup(); new MutationObserver(cleanup).observe(document.body,{childList:true,subtree:true});
}
window.UNICA_MIND_GARDEN={open:maintenance,v2:false,maintenance:true};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
