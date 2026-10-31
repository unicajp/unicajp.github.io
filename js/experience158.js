(()=>{'use strict';
const scene=document.getElementById('release154');if(!scene)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
const petals=scene.querySelector('.r158-petals'),art=scene.querySelector('.r158-art'),bgm=document.getElementById('bgm');
// Fixed small DOM pool: no render loop, canvas, scroll handler or device sensors.
for(let n=0;n<9;n++){const p=document.createElement('i');p.style.cssText=`--left:${5+n*11}%;--size:${5+n%3*3}px;--duration:${15+n%4*3}s;--delay:-${n*3.1}s`;petals?.append(p);}
let visible=true;function activity(){scene.classList.toggle('is-paused',!visible||document.hidden);}
if('IntersectionObserver'in window){const o=new IntersectionObserver(rows=>{visible=rows[0].isIntersecting;activity();},{rootMargin:'40px'});o.observe(scene);}
document.addEventListener('visibilitychange',()=>{activity();updateDate();});
function audioState(){scene.classList.toggle('is-music-playing',!!bgm&&!bgm.paused&&!bgm.muted&&bgm.volume>0);}
for(const type of ['play','pause','ended','volumechange'])bgm?.addEventListener(type,audioState);audioState();
function updateDate(){const target=document.getElementById('release158Countdown');if(!target||document.hidden)return;const now=Date.now(),release=Date.UTC(2026,10,21,15);const days=Math.max(0,Math.ceil((release-now)/86400000));target.textContent=days?`リリースまで ${days} 日`:'2026.11.22 RELEASE';}
let dateTimer;function startDate(){updateDate();clearInterval(dateTimer);dateTimer=setInterval(updateDate,60000);}startDate();window.addEventListener('pagehide',()=>clearInterval(dateTimer));window.addEventListener('pageshow',startDate);
let tiltFrame=0,latest;
art?.addEventListener('pointermove',event=>{if(reduced.matches||!fine.matches)return;latest={x:event.clientX,y:event.clientY};if(tiltFrame)return;tiltFrame=requestAnimationFrame(()=>{tiltFrame=0;const r=art.getBoundingClientRect();scene.style.setProperty('--rx',`${(0.5-(latest.y-r.top)/r.height)*9}deg`);scene.style.setProperty('--ry',`${((latest.x-r.left)/r.width-0.5)*12}deg`);});},{passive:true});
art?.addEventListener('pointerleave',()=>{if(tiltFrame)cancelAnimationFrame(tiltFrame);tiltFrame=0;scene.style.setProperty('--rx','0deg');scene.style.setProperty('--ry','0deg');});
document.getElementById('top')?.addEventListener('pointerdown',event=>{
 if(reduced.matches||event.button>0)return;
 const card=event.target.closest('.home86-diagnosis,#home86Interview,#karaoke91Entry,#sreMissionOpen');if(!card)return;
 const old=card.querySelector('.r158-tap-ripple');old?.remove();const p=document.createElement('i'),r=card.getBoundingClientRect();p.className='r158-tap-ripple';p.setAttribute('aria-hidden','true');p.style.left=`${event.clientX-r.x-6}px`;p.style.top=`${event.clientY-r.y-6}px`;card.append(p);p.animate([{transform:'scale(0)',opacity:1},{transform:'scale(35)',opacity:0}],{duration:650,easing:'ease-out'});setTimeout(()=>p.remove(),700);
},{passive:true});
let messageTimer,cleanupTimer;
window.addEventListener('unica:release158-liked',()=>{
 const message=document.getElementById('release158LoveMessage');if(message){message.textContent='想いが、ひとつ咲きました。';message.classList.add('is-visible');clearTimeout(messageTimer);messageTimer=setTimeout(()=>message.classList.remove('is-visible'),2400);}
 const field=scene.querySelector('.r158-love-field');if(!field||reduced.matches)return;field.replaceChildren();clearTimeout(cleanupTimer);
 const b=document.getElementById('yawarakanaLikeButton').getBoundingClientRect(),r=scene.getBoundingClientRect(),x=b.x-r.x+b.width/2,y=b.y-r.y;
 for(let n=0;n<16;n++){const p=document.createElement('i'),a=n*Math.PI*2/16;p.style.setProperty('--x',`${x}px`);p.style.setProperty('--y',`${y}px`);field.append(p);p.animate([{transform:'translate(-50%,0) rotate(0deg) scale(.2)',opacity:0},{offset:.15,opacity:1},{transform:`translate(${Math.cos(a)*(75+n%3*20)}px,${-100+Math.sin(a)*90}px) rotate(${n*47}deg) scale(.8)`,opacity:0}],{duration:1400+n%4*100,easing:'cubic-bezier(.16,.62,.3,1)',fill:'forwards'});}
 cleanupTimer=setTimeout(()=>field.replaceChildren(),1900);
});
function decorate(){const h=document.getElementById('premium156WorldHeading');if(h&&!document.getElementById('world158Caption')){const p=document.createElement('div');p.className='r158-world-caption';p.id='world158Caption';p.innerHTML='<strong>歌の、もう少し先へ。</strong><span>聴く。遊ぶ。つながる。</span>';h.after(p);}}
// Existing home entries may mount after auth/module loading; stop once ready.
decorate();if(!document.getElementById('world158Caption')){const o=new MutationObserver(()=>{decorate();if(document.getElementById('world158Caption'))o.disconnect();});o.observe(document.getElementById('worldHome')||document.body,{childList:true,subtree:true});setTimeout(()=>o.disconnect(),15000);}
})();
