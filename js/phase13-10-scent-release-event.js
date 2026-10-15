(()=>{'use strict';
const GOAL=30,$=s=>document.querySelector(s);let lastCount=null,loadTicket=0,timer=null,returnFocus=null,celebrationFocus=null,autoTimer=null,confettiTimer=null,seenInSession=false;
const SEEN_KEY='unicaReleaseMission30CelebratedV1';
function card(){
 const el=document.createElement('section');el.id='scentReleaseEvent';el.className='scent-release-event sre-mission-entry';
 el.innerHTML=`<button id="sreMissionOpen" class="sre-mission-button" type="button" aria-haspopup="dialog" aria-controls="sreMissionModal"><span class="sre-mission-copy"><span class="sre-mission-song">ミルクの匂い <em>弾き語り ver.</em></span><strong>RELEASEミッション</strong><small id="sreMiniStatus" aria-live="polite">達成率を読み込み中…</small></span><b class="sre-mission-arrow" aria-hidden="true">›</b></button><div id="sreAchievementNote" class="sre-achievement-note" hidden><span>✦ 30人達成記念 · ご参加ありがとうございます</span><button type="button" id="sreCelebrateAgain">お祝いを見る ›</button></div>`;return el;
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
 const complete=remain===0;
 $('#scentReleaseEvent').classList.toggle('is-complete',complete);
 $('#sreAchievementNote').hidden=!complete;
 $('#sreMissionOpen .sre-mission-copy>strong').textContent=complete?'30人達成！ リリース決定！':'RELEASEミッション';
 $('.sre-detail-kicker').textContent=complete?'みんなで叶えたリリース':'みんなで叶えるリリース';
 $('.sre-detail-lead').textContent=complete?'ぷにゅか診断の最初の5問を30人が達成しました。「ミルクの匂い - 弾き語り ver.」のリリースが決定！参加してくれたみなさん、ありがとうございます。':'ぷにゅか診断の最初の5問を、30人が達成すると「ミルクの匂い - 弾き語り ver.」のリリースが決定します。';
 scheduleCelebration();
}
function celebrationModal(){
 const el=document.createElement('div');el.id='sreCelebration';el.className='sre-celebration';el.setAttribute('aria-hidden','true');
 el.innerHTML=`<div class="sre-celebration-backdrop" data-close-celebration></div><section class="sre-celebration-panel" role="dialog" aria-modal="true" aria-labelledby="sreCelebrationTitle" aria-describedby="sreCelebrationCopy"><div class="sre-confetti" aria-hidden="true"></div><button type="button" class="sre-celebration-close" data-close-celebration aria-label="お祝いを閉じる">×</button><small>MISSION COMPLETE</small><div class="sre-celebration-medal" aria-hidden="true"><span>✦</span><b>30</b><em>THANK YOU</em></div><h2 id="sreCelebrationTitle">30人達成！</h2><p class="sre-celebration-lead">みんなでリリースを<br>叶えました。</p><p class="sre-celebration-song">ミルクの匂い<small>弾き語り ver. · RELEASE決定</small></p><p id="sreCelebrationCopy">参加してくれたみなさん、<br>ありがとうございます。</p><p class="sre-celebration-note">公開日・公開先は、お知らせでご案内します。</p><button type="button" class="sre-celebration-primary" data-close-celebration>ありがとう！</button><button type="button" id="sreCelebrationDetails">達成の詳細を見る ›</button></section>`;return el;
}
function hasCelebrated(){if(seenInSession)return true;try{return localStorage.getItem(SEEN_KEY)==='1';}catch{return false;}}
function visible(el){if(!el||el.hidden||!el.getClientRects().length)return false;const css=getComputedStyle(el);return css.visibility!=='hidden'&&css.display!=='none'&&Number(css.opacity)>.01;}
function safeToCelebrate(){
 if(document.visibilityState==='hidden'||visible($('#intro'))||visible($('#karaoke91')))return false;
 if([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(visible))return false;
 const entry=$('#scentReleaseEvent');if(!visible(entry))return false;const box=entry.getBoundingClientRect();return box.top<innerHeight&&box.bottom>0;
}
function scheduleCelebration(){if(autoTimer||lastCount<GOAL||hasCelebrated())return;autoTimer=setTimeout(()=>{autoTimer=null;if(lastCount>=GOAL&&!hasCelebrated()&&safeToCelebrate())openCelebration();},350);}
function openCelebration(){
 if(lastCount<GOAL||$('#sreCelebration').classList.contains('is-open'))return;
 celebrationFocus=document.activeElement;seenInSession=true;try{localStorage.setItem(SEEN_KEY,'1');}catch{}
 const el=$('#sreCelebration');el.classList.add('is-open');el.setAttribute('aria-hidden','false');document.body.classList.add('sre-celebration-open');el.querySelector('.sre-celebration-primary').focus({preventScroll:true});
 const field=el.querySelector('.sre-confetti');field.replaceChildren();clearTimeout(confettiTimer);
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){for(let i=0;i<48;i++){const bit=document.createElement('i');bit.style.setProperty('--left',((i*37)%100)+'%');bit.style.setProperty('--delay',((i%9)*.13)+'s');bit.style.setProperty('--spin',(i%2?1:-1)*((i%5+1)*90)+'deg');bit.style.setProperty('--color',['#f6d38d','#dea1c6','#c9b2f6','#f5e5c5'][i%4]);field.append(bit);}confettiTimer=setTimeout(()=>field.replaceChildren(),5400);}
}
function closeCelebration(){const el=$('#sreCelebration');el.classList.remove('is-open');el.setAttribute('aria-hidden','true');document.body.classList.remove('sre-celebration-open');clearTimeout(confettiTimer);el.querySelector('.sre-confetti').replaceChildren();if(celebrationFocus?.isConnected&&visible(celebrationFocus))celebrationFocus.focus({preventScroll:true});}
function trapFocus(event,dialog,closeFn){if(event.key==='Escape'){event.preventDefault();closeFn();return;}if(event.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button')].filter(visible),first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
async function load(){
 if(!$('#sreCount'))return;
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
 root.insertBefore(card(),artist);document.body.append(modal(),celebrationModal());$('#sreMissionOpen').onclick=open;$('#sreCelebrateAgain').onclick=openCelebration;document.querySelectorAll('[data-close-celebration]').forEach(el=>el.onclick=closeCelebration);$('#sreCelebrationDetails').onclick=()=>{closeCelebration();open();};
 document.querySelectorAll('[data-close-mission]').forEach(el=>el.onclick=close);
 $('#sreDiagnose').onclick=()=>{close();$('#openScent16')?.click();};
 window.addEventListener('keydown',event=>{if($('#sreCelebration').classList.contains('is-open'))return trapFocus(event,$('#sreCelebration'),closeCelebration);if($('#sreMissionModal').classList.contains('is-open'))trapFocus(event,$('#sreMissionModal'),close);});
 new MutationObserver(scheduleCelebration).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','style']});
 window.addEventListener('scroll',scheduleCelebration,{passive:true});window.addEventListener('focus',()=>{refresh();scheduleCelebration();});document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='hidden'){refresh();scheduleCelebration();}});

 load();return true;
}
function refresh(){clearTimeout(timer);timer=setTimeout(load,350);}
function start(){if(mount())return;let tries=0;const id=setInterval(()=>{if(mount()||++tries>50)clearInterval(id)},120);}
['unica:punyako-seed-complete','unica:punyako-avatar-updated','unica:punyako-diagnosis-complete','unica:firebase-ready','unica:firebase-member-restored'].forEach(event=>window.addEventListener(event,refresh));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
