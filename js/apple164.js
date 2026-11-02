(()=>{'use strict';
const modal=document.getElementById('apple164Modal'),openButton=document.getElementById('apple164Open'),bgm=document.getElementById('bgm');if(!modal||!openButton)return;
const panel=modal.querySelector('[role="dialog"]'),host=document.getElementById('apple164Frame'),status=document.getElementById('apple164Status');
let returnFocus=null,resumeWanted=false,oldOverflow='',timer=0;
function otherAudio(){const studio=document.getElementById('karaoke91');if(studio&&!studio.hidden)return true;return [...document.querySelectorAll('audio,video')].some(a=>a!==bgm&&!a.paused&&!a.ended&&!a.muted&&a.volume>0);}
function close(resume=true){if(modal.hidden)return;modal.hidden=true;clearTimeout(timer);host.replaceChildren();document.body.classList.remove('apple164-open');document.body.style.overflow=oldOverflow;const wanted=resumeWanted;resumeWanted=false;returnFocus?.focus({preventScroll:true});if(resume&&wanted&&bgm&&!document.hidden&&!otherAudio())bgm.play().then(()=>{if(bgm.paused)return;const icon=document.getElementById('playerIcon');if(icon)icon.textContent='Ⅱ';document.getElementById('playerToggle')?.setAttribute('aria-label','BGMを停止');}).catch(()=>{});}
function open(){if(!modal.hidden)return;
 // Stop the existing YouTube player first so two previews cannot overlap.
 const video=document.getElementById('release154Modal');if(video&&!video.hidden)video.querySelector('[data-close-release154]')?.click();
 returnFocus=document.activeElement;resumeWanted=!!bgm&&!bgm.paused;oldOverflow=document.body.style.overflow;modal.hidden=false;document.body.style.overflow='hidden';document.body.classList.add('apple164-open');if(bgm&&!bgm.paused)bgm.pause();
 const frame=document.createElement('iframe');frame.title='やわらかな想い — Apple Music試聴プレイヤー';frame.height='450';frame.allow='autoplay *; encrypted-media *; fullscreen *; clipboard-write';frame.setAttribute('frameborder','0');frame.setAttribute('sandbox','allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation');frame.src='https://embed.music.apple.com/jp/album/yawarakana-omoi-single/6829413405';
 status.textContent='Apple Musicプレイヤーを読み込んでいます…';timer=setTimeout(()=>{if(!modal.hidden)status.textContent='表示されない場合は「Apple Musicで開く」から試聴できます。';},12000);
 frame.addEventListener('load',()=>{clearTimeout(timer);if(!modal.hidden)status.textContent='プレイヤー内の再生ボタンを押して試聴できます。';},{once:true});frame.addEventListener('error',()=>{clearTimeout(timer);status.textContent='読み込めませんでした。「Apple Musicで開く」からお試しください。';},{once:true});host.replaceChildren(frame);panel.scrollTop=0;panel.querySelector('[data-close-apple164]').focus();
}
openButton.addEventListener('click',open);modal.querySelectorAll('[data-close-apple164]').forEach(button=>button.addEventListener('click',()=>close()));
// Apple embeds do not expose their playback state here: hold BGM for the entire open panel.
bgm?.addEventListener('play',()=>{if(!modal.hidden){resumeWanted=true;bgm.pause();}});
// A deliberate BGM operation wins and stops the embedded preview before it starts BGM.
document.getElementById('playerToggle')?.addEventListener('click',()=>{if(!modal.hidden)close(false);},true);
document.getElementById('trackSelect')?.addEventListener('change',()=>{if(!modal.hidden)close(false);},true);
modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(event.key!=='Tab')return;const nodes=[...panel.querySelectorAll('button,a[href],iframe')].filter(e=>e.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)close(false);});window.addEventListener('pagehide',()=>close(false));window.addEventListener('unica:karaoke-open',()=>close(false));
})();
