(()=>{'use strict';
const GOAL=30,$=s=>document.querySelector(s);let lastCount=null,loadTicket=0,timer=null,returnFocus=null;
function card(){
 const el=document.createElement('section');el.id='scentReleaseEvent';el.className='scent-release-event sre-mission-entry';
 el.innerHTML=`<button id="sreMissionOpen" class="sre-mission-button" type="button" aria-haspopup="dialog" aria-controls="sreMissionModal"><span class="sre-mission-copy"><span class="sre-mission-song">ミルクの匂い <em>弾き語り ver.</em></span><strong>RELEASEミッション</strong><small id="sreMiniStatus" aria-live="polite">達成率を読み込み中…</small></span><b class="sre-mission-arrow" aria-hidden="true">›</b></button>`;return el;
}
function modal(){
 const el=document.createElement('div');el.id='sreMissionModal';el.className='sre-mission-modal';el.setAttribute('aria-hidden','true');
 el.innerHTML=`<div class="sre-mission-backdrop" data-close-mission></div><section class="sre-mission-panel" role="dialog" aria-modal="true" aria-labelledby="sreMissionTitle"><nav><button type="button" data-close-mission>‹ 戻る</button><span>RELEASE MISSION</span><button type="button" data-close-mission aria-label="閉じる">×</button></nav><div class="sre-mission-detail"><p class="sre-detail-kicker">みんなで叶えるリリース</p><h2 id="sreMissionTitle">ミルクの匂い<small>弾き語り ver.</small><span>RELEASEミッション</span></h2><p class="sre-detail-lead">ぷにゅか診断の最初の<strong>5問</strong>を、<strong>30人</strong>が達成すると「ミルクの匂い - 弾き語り ver.」のリリースが決定します。</p><div class="sre-detail-progress" aria-live="polite"><div><strong id="sreCount">—</strong><span> / 30人</span><b id="srePercent">—</b></div><div class="sre-detail-track" role="progressbar" aria-label="RELEASEミッション達成率" aria-valuemin="0" aria-valuemax="100"><i id="sreProgress"></i></div><p id="sreNext">参加人数を読み込み中…</p></div><p class="sre-detail-note">25問すべてを終えなくても、5問で参加できます。参加人数は1人につき1人分です。</p><button class="sre-detail-diagnose" id="sreDiagnose" type="button"><span>ぷにゅか診断へ<small>まず5問で、ぷにゅか誕生</small></span><b aria-hidden="true">›</b></button></div></section>`;return el;
}
function render(n){
 lastCount=Math.max(0,Math.floor(Number(n)||0));const percent=Math.min(100,Math.round(lastCount/GOAL*100)),remain=Math.max(0,GOAL-lastCount);
 $('#sreCount').textContent=String(lastCount);$('#srePercent').textContent=percent+'％';$('#sreProgress').style.width=percent+'%';
 const track=$('.sre-detail-track');track.setAttribute('aria-valuenow',String(percent));
 $('#sreNext').textContent=remain?`リリース決定まで、あと${remain}人`:'30人達成！ リリース決定！';
 $('#sreMiniStatus').textContent=`達成率 ${percent}％ · ${lastCount}/30人${remain?'':' · 達成！'}`;
 $('#scentReleaseEvent').classList.toggle('is-complete',remain===0);
}
async function load(){
 const ticket=++loadTicket;
 try{
  for(let i=0;i<50&&!window.UNICA_FIREBASE?.loadPunyakoMembers;i++)await new Promise(r=>setTimeout(r,120));
  if(!window.UNICA_FIREBASE?.loadPunyakoMembers)throw Error('not-ready');
  const rows=await window.UNICA_FIREBASE.loadPunyakoMembers();if(ticket!==loadTicket)return;if(!Array.isArray(rows))throw Error('invalid-data');
  render(rows.filter(row=>row?.punyakoJourney?.seedComplete).length);
 }catch(e){if(ticket!==loadTicket)return;$('#sreNext').textContent='参加人数を取得できませんでした。開き直してお試しください。';if(lastCount===null)$('#sreMiniStatus').textContent='詳細・達成率を見る';}
}
function open(){returnFocus=document.activeElement;$('#sreMissionModal').classList.add('is-open');$('#sreMissionModal').setAttribute('aria-hidden','false');document.body.classList.add('sre-mission-open');$('#sreMissionModal button[data-close-mission]').focus();load();}
function close(){const m=$('#sreMissionModal');m.classList.remove('is-open');m.setAttribute('aria-hidden','true');document.body.classList.remove('sre-mission-open');returnFocus?.focus();}
function mount(){
 if($('#scentReleaseEvent'))return true;const root=$('#phase1241Renewal'),artist=root?.querySelector('.artist-renewal-zone');if(!root||!artist)return false;
 root.insertBefore(card(),artist);document.body.append(modal());$('#sreMissionOpen').onclick=open;
 document.querySelectorAll('[data-close-mission]').forEach(el=>el.onclick=close);
 $('#sreDiagnose').onclick=()=>{close();$('#openScent16')?.click();};
 window.addEventListener('keydown',event=>{const m=$('#sreMissionModal');if(!m.classList.contains('is-open'))return;if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'){const nodes=[...m.querySelectorAll('button')].filter(el=>el.getClientRects().length),first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 load();return true;
}
function refresh(){clearTimeout(timer);timer=setTimeout(load,350);}
function start(){if(mount())return;let tries=0;const id=setInterval(()=>{if(mount()||++tries>50)clearInterval(id)},120);}
['unica:punyako-seed-complete','unica:punyako-avatar-updated','unica:punyako-diagnosis-complete'].forEach(event=>window.addEventListener(event,refresh));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
