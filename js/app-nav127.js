(()=>{'use strict';
const $=s=>document.querySelector(s),header=$('#siteHeader'),player=$('#musicPlayer');if(!header||!player)return;
header.append(player);document.body.classList.add('app-nav127');
$('#trackSelect')?.querySelectorAll('option').forEach(o=>o.textContent=o.dataset.title||o.textContent);
const paths={back:'<path d="m14 6-6 6 6 6"/><path d="M8 12h12"/>',variety:'<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',unico:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',pass:'<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>'};
const icon=key=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key]}</svg>`;
const nav=document.createElement('nav');nav.id='appNav127';nav.setAttribute('aria-label','アプリメニュー');nav.innerHTML=[['back','戻る'],['variety','バラエティ'],['home','ホーム'],['unico','うにこ'],['pass','うにパス']].map(([key,label])=>`<button type="button" data-app-route="${key}" aria-label="${label}" ${key==='variety'?'aria-expanded="false" aria-controls="appVariety127"':''}>${icon(key)}<span>${label}</span></button>`).join('');document.body.append(nav);
const sheet=document.createElement('section');sheet.id='appVariety127';sheet.hidden=true;sheet.setAttribute('aria-label','バラエティコーナー');sheet.innerHTML='<button class="app127-shade" type="button" aria-label="メニューを閉じる"></button><div class="app127-sheet"><header><strong>バラエティ</strong><button type="button" data-sheet-close aria-label="メニューを閉じる">×</button></header><div class="app127-choices">'+[['diagnosis','ぷにゅか診断','こころを知る'],['studio','うにか STUDIO','歌う・聴く'],['interview','インタビュー','うにこに聞いてみた'],['members','うにメン','仲間を見る']].map(([key,title,copy],i)=>`<button type="button" data-app-feature="${key}">${icon(['variety','unico','back','pass'][i])}<strong>${title}</strong><small>${copy}</small></button>`).join('')+'</div></div>';document.body.append(sheet);
const visible=e=>!!e&&!e.hidden&&getComputedStyle(e).visibility!=='hidden'&&e.getClientRects().length>0;
function layer(){const dialogs=[...document.querySelectorAll('[role="dialog"]')].filter(visible);const z=e=>{let n=0;for(let p=e;p;p=p.parentElement)n=Math.max(n,Number.parseInt(getComputedStyle(p).zIndex)||0);return n;};return dialogs.sort((a,b)=>z(a)-z(b)).at(-1);}
function sheetOpen(open){sheet.hidden=!open;nav.querySelector('[data-app-route=variety]').setAttribute('aria-expanded',String(open));if(open)sheet.querySelector('[data-app-feature]').focus();}
function closeLayer(dialog,back=false){
 if(!dialog)return true;
 let button;
 if(back&&dialog.closest('#scent16Modal'))button=$('#scent16NavBack');
 if(back&&dialog.closest('#passportModal.is-profile-editing'))button=$('#passEditBack');
 if(back&&dialog.closest('#ivModal')&&visible($('#news86Back')))button=$('#news86Back');
 if(back&&dialog.closest('#karaoke91'))button=['#krBackEdit','#krHome'].map($).find(visible);
 if(!visible(button))button=[...dialog.querySelectorAll('button')].find(b=>visible(b)&&!b.disabled&&(b.matches('[aria-label="閉じる"],[aria-label="トップへ戻る"],#krClose,[data-close-interview],[data-close-mission],[data-close-celebration]')||[...b.attributes].some(a=>a.name.startsWith('data-close-'))));
 if(!button||button.disabled)return false;button.click();return back||!visible(dialog);
}
function leave(){sheetOpen(false);for(let i=0;i<12;i++){const dialog=layer();if(!dialog)return true;if(!closeLayer(dialog))return false;}return !layer();}
const scrolls=[];
function route(key){if(key==='back'){if(!sheet.hidden){sheetOpen(false);return;}const dialog=layer();if(dialog){closeLayer(dialog,true);return;}window.scrollTo({top:scrolls.pop()||0,behavior:'smooth'});return;}
 if(key==='variety'){sheetOpen(sheet.hidden);return;}
 if(!leave())return;
 if(key==='home'){window.scrollTo({top:0,behavior:'smooth'});}
 if(key==='unico'){scrolls.push(window.scrollY);$('#unico')?.scrollIntoView({behavior:'smooth',block:'start'});}
 if(key==='pass')$('#openUniPassDirect')?.click();
 nav.querySelectorAll('[data-app-route]').forEach(b=>{const active=b.dataset.appRoute===key;b.classList.toggle('is-current',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
}
nav.addEventListener('click',e=>{const b=e.target.closest('[data-app-route]');if(b)route(b.dataset.appRoute);});
sheet.querySelectorAll('.app127-shade,[data-sheet-close]').forEach(b=>b.onclick=()=>sheetOpen(false));
sheet.querySelectorAll('[data-app-feature]').forEach(b=>b.onclick=()=>{const key=b.dataset.appFeature;if(!leave())return;if(key==='diagnosis')window.UNICA_SCENT16?.open();if(key==='studio')$('#karaoke91Entry')?.click();if(key==='interview')$('#openUnicoInterview')?.click();if(key==='members')window.UNICA_PREFECTURE_DIRECTORY?.open();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!sheet.hidden){sheetOpen(false);e.preventDefault();}});
const resize=()=>document.documentElement.style.setProperty('--app127-header',(header.getBoundingClientRect().height+22)+'px');new ResizeObserver(resize).observe(header);new ResizeObserver(()=>document.documentElement.style.setProperty('--app128-nav',nav.getBoundingClientRect().height+'px')).observe(nav);resize();nav.querySelector('[data-app-route=home]').classList.add('is-current');nav.querySelector('[data-app-route=home]').setAttribute('aria-current','page');
window.UNICA_APP_NAV={route};
})();
