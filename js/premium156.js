(()=>{'use strict';
const icons={bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>'};
const svg=key=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[key]+'</svg>';
function mark(selector,key){const el=document.querySelector(selector);if(!el||el.dataset.premium156Icon)return;el.dataset.premium156Icon='1';if(el.id==='notificationButton'){for(const node of [...el.childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();el.insertAdjacentHTML('afterbegin',svg(key));}else el.innerHTML=svg(key);}
function enhance(){
 mark('#notificationButton','bell');mark('.home86-news-symbol','mail');mark('#unico .profile-avatar>span','mic');mark('#unika .profile-avatar>span','music');
 const copy=document.querySelector('#release154 .release154-copy'),date=copy?.querySelector('.release154-date');if(copy&&date&&!copy.querySelector('.premium156-lyric')){const p=document.createElement('p');p.className='premium156-lyric';p.textContent='特別なことじゃなくていい。';date.before(p);}
 const stack=document.querySelector('#worldHome .app-home-stack');if(stack&&!document.getElementById('premium156WorldHeading')){const head=document.createElement('div');head.id='premium156WorldHeading';head.className='premium156-heading';head.innerHTML='<span>UNICA WORLD</span><i aria-hidden="true"></i>';stack.before(head);}
}
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});});observer.observe(document.body,{childList:true,subtree:true});enhance();
})();
