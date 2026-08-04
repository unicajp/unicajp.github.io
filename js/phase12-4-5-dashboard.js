(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let birthdaySummary=null,prefectureSummary=null;
function gameSummary(){
 let p={};try{p=JSON.parse(localStorage.getItem('unicaMilkMatchProgressV2')||'{}')}catch(_){}
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
 const used=p.date===today?Math.max(0,Math.min(5,Number(p.playsUsed||0))):0;
 const unlocked=Array.isArray(p.unlockedChapters)?new Set(p.unlockedChapters.map(Number)).size:Number($('#milkLyricsHomeUnlocked')?.textContent||0);
 return {stage:Math.max(1,Math.min(9,Number(p.storyStage||0)+1)),unlocked,remaining:Math.max(0,5-used)};
}
function member(){try{return JSON.parse(localStorage.getItem('unicaWorldMemberV4')||localStorage.getItem('unicaWorldMemberV3')||'null')}catch(_){return null}}
function statusCard(key){return $(`.fun-card[data-feature-key="${key}"]`)}
function dashboard(card,html,extra=''){if(!card)return;let box=card.querySelector('.fun-mini-dashboard');if(!box){box=document.createElement('span');box.className='fun-mini-dashboard';const em=card.querySelector('em[data-status-for]');if(em)em.hidden=true;card.append(box)}box.className=`fun-mini-dashboard ${extra}`.trim();box.innerHTML=html}
function renderGame(){const g=gameSummary();dashboard(statusCard('game'),`<span><small>到達</small><b>STAGE ${g.stage}</b></span><span><small>歌詞</small><b>${g.unlocked} / 9</b></span><span><small>本日</small><b>あと${g.remaining}回</b></span>`)}
function renderScent(){const m=member(),r=m?.scentDiagnosis||window.UNICA_SCENT16?.getMyResult?.();dashboard(statusCard('scent'),r?`<span class="mini-wide"><small>現在の香り</small><b>${safe(r.scentName||'診断済み')}</b></span><span><small>診断日</small><b>${safe(String(r.diagnosedDate||r.date||'').replaceAll('-','/'))||'最新'}</b></span>`:`<span class="mini-wide"><small>まだ診断していません</small><b>1日1回診断できます</b></span>`)}
function renderPassport(){const m=member();dashboard(statusCard('passport'),m?`<span><small>会員番号</small><b>No.${String(Number(m.number||0)).padStart(4,'0')}</b></span><span class="mini-wide"><small>プロフィール</small><b>${safe(m.scentDiagnosis?.scentName||m.prefecture||'うにパスを見る')}</b></span>`:`<span class="mini-wide"><small>うにメン限定</small><b>登録してカードを作ろう</b></span>`)}
function renderFlowers(){const m=member(),e=document.querySelector('[data-sub-status-for="flowers"]');if(e)e.textContent=m?.scentDiagnosis?.scentName?`現在 ${m.scentDiagnosis.scentName}`:'全16種類'}
function renderBirthdays(){const d=birthdaySummary;dashboard(statusCard('birthday'),d?.next?`<span class="mini-wide"><small>次のお誕生日</small><b>${d.next.month}/${d.next.day} ${safe(d.next.name)}さん${d.next.count>1?`ほか${d.next.count-1}人`:''}</b></span><span><small>あと</small><b>${d.next.days===0?'今日':d.next.days+'日'}</b></span>`:`<span class="mini-wide"><small>次のお誕生日</small><b>読み込み中…</b></span>`)}
function renderAlbum(){const d=birthdaySummary,e=document.querySelector('[data-sub-status-for="album"]');if(!e)return;if(d?.latestAlbum)e.textContent=`${safe(d.latestAlbum.date.replace(/^\d{4}-/, '').replace('-','/'))} ${safe(d.latestAlbum.name)}さん・${d.latestAlbum.comments}件`;else e.textContent=`${d?.albumCount||0}件の思い出`}
function renderPrefecture(){const d=prefectureSummary;dashboard(statusCard('prefecture'),d?.top?.length?`<span class="mini-ranking">${d.top.slice(0,3).map((x,i)=>`<i><b>${i+1}</b><em>${safe(x.name)}</em><strong>${x.count}人</strong></i>`).join('')}</span>`:`<span class="mini-wide"><small>全国ランキング</small><b>集計中…</b></span>`,'prefecture-dashboard')}
function renderAll(){renderGame();renderScent();renderBirthdays();renderAlbum();renderPrefecture();renderPassport();renderFlowers()}
window.addEventListener('unica:birthday-summary',e=>{birthdaySummary=e.detail;renderBirthdays();renderAlbum()});
window.addEventListener('unica:prefecture-summary',e=>{prefectureSummary=e.detail;renderPrefecture()});
function start(){const wait=()=>{if(!$('#phase1241Renewal'))return setTimeout(wait,120);renderAll();setInterval(renderAll,2500)};wait()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
