(()=>{'use strict';
const key='unicaUiSoundV130';let last=-1000,enabled=true;try{enabled=localStorage.getItem(key)!=='off';}catch{}
const base=document.getElementById('tapSound'),pool=[];let next=0,ctx;
function play(){
 const karaoke=document.getElementById('karaoke91');if(karaoke&&!karaoke.hidden&&['sing','edit'].includes(karaoke.dataset.screen))return;
 if(!enabled||document.hidden)return;const now=performance.now();if(now-last<65)return;last=now;
 if(base){if(pool.length<3){const a=base.cloneNode();a.preload='auto';pool.push(a);}const a=pool[next++%pool.length];a.volume=.25;a.currentTime=0;a.play()?.catch(()=>{});return;}
 try{ctx??=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime;o.type='sine';o.frequency.setValueAtTime(720,t);o.frequency.exponentialRampToValueAtTime(440,t+.055);g.gain.setValueAtTime(.04,t);g.gain.exponentialRampToValueAtTime(.0001,t+.065);o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+.07);}catch{}
}
window.UNICA_UI_SOUND={play};
const toggle=document.createElement('button');toggle.type='button';toggle.id='uiSoundToggle130';toggle.style.cssText='width:28px;height:28px;min-height:28px;padding:3px;border:0;border-radius:8px;background:#eee4f3;color:#886497;cursor:pointer';
function label(){toggle.setAttribute('aria-label',enabled?'操作音をOFFにする':'操作音をONにする');toggle.setAttribute('aria-pressed',String(enabled));toggle.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>'+ (enabled?'<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>':'<path d="m16 9 6 6m0-6-6 6"/>')+'</svg>';}
toggle.onclick=()=>{enabled=!enabled;try{localStorage.setItem(key,enabled?'on':'off');}catch{}label();if(enabled){last=-1000;play();}};
document.getElementById('musicPlayer')?.append(toggle);label();
const style=document.createElement('style');style.textContent='body.app-nav127 #siteHeader #musicPlayer{grid-template-columns:32px minmax(0,1fr) 46px 28px!important;gap:6px!important}body.app-nav127 #musicPlayer #volume{width:46px!important}#uiSoundToggle130:focus-visible{outline:2px solid #a47fb2;outline-offset:2px}.pk-pair-section{margin:24px 0 12px;font-size:19px}';document.head.append(style);
function quiet(target){if(target.closest('#scent16Modal,.home86-diagnosis,[data-feature-key=scent],#openScent16,[data-app-feature=diagnosis],#uiSoundToggle130'))return true;if(target.closest('[data-app-route=back]')&&document.getElementById('scent16Modal')?.classList.contains('is-open'))return true;const kr=document.getElementById('karaoke91');return kr&&!kr.hidden&&['sing','edit'].includes(kr.dataset.screen);}
window.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button,a[href],summary,[role=button],input[type=checkbox],input[type=radio]'):null;if(!event.isTrusted||!target||target.disabled||target.getAttribute('aria-disabled')==='true'||quiet(target))return;play();},true);
window.addEventListener('change',event=>{const t=event.target;if(event.isTrusted&&t.matches?.('select,input[type=range]')&&!t.disabled&&!quiet(t))play();},true);
})();
