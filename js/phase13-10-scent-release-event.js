(()=>{'use strict';
const GOAL=30,$=(s,r=document)=>r.querySelector(s);let lastCount=0;
function card(){
  const e=document.createElement('section');
  e.id='scentReleaseEvent';
  e.className='scent-release-event punyako-release-project';
  e.innerHTML=`
    <div class="sre-summary punyako-release-card" aria-live="polite">
      <div class="sre-summary-top"><span>PUNYAKO DIAGNOSIS PROJECT</span><em>30 MEMBERS GOAL</em></div>
      <h3 class="punyako-release-title"><b>ぷにゃこ診断 30人達成で</b><strong>「ミルクの匂い - 弾き語り ver.」<br>RELEASE決定!!</strong></h3>
      <div class="sre-summary-main">
        <strong><b id="sreCount">—</b><small>/30人</small></strong>
        <div><span id="sreNext">診断人数を集計しています…</span><i><u id="sreProgress"></u></i></div>
        <b id="srePercent">0%</b>
      </div>
      <button class="sre-diagnose-inline" id="sreDiagnose" type="button"><span>✦</span><div><b>ぷにゃこ診断</b><small>25の物語から、あなたのぷにゅかを見つけよう。</small></div><i>›</i></button>
    </div>`;
  return e;
}
function render(n){
  lastCount=Math.max(0,Number(n)||0);
  const pc=Math.min(100,Math.round(lastCount/GOAL*100));
  const remain=Math.max(0,GOAL-lastCount);
  const count=$('#sreCount'),pct=$('#srePercent'),bar=$('#sreProgress'),next=$('#sreNext'),root=$('#scentReleaseEvent');
  if(count)count.textContent=lastCount;
  if(pct)pct.textContent=pc+'%';
  if(bar)bar.style.width=pc+'%';
  if(next)next.textContent=remain>0?`RELEASE決定まであと${remain}人`:'30人達成！ RELEASE決定!!';
  root?.classList.toggle('is-complete',remain===0);
}
async function load(){
  try{
    for(let i=0;i<50&&!window.UNICA_FIREBASE?.loadScentMembers;i++)await new Promise(r=>setTimeout(r,120));
    const rows=await window.UNICA_FIREBASE?.loadScentMembers?.();
    const count=Array.isArray(rows)?rows.filter(row=>String(row?.scentDiagnosis?.typeId||'').startsWith('punyuka_')).length:0;
    render(count);
  }catch(e){
    console.warn(e);
    const next=$('#sreNext');if(next)next.textContent='診断人数を取得できませんでした';
  }
}
function mount(){
  if($('#scentReleaseEvent'))return true;
  const root=$('#phase1241Renewal'),artist=root?.querySelector('.artist-renewal-zone');
  if(!root||!artist)return false;
  root.insertBefore(card(),artist);
  $('#sreDiagnose')?.addEventListener('click',()=>$('#openScent16')?.click());
  load();
  return true;
}
function start(){if(mount())return;let t=0,id=setInterval(()=>{if(mount()||++t>50)clearInterval(id)},120)}
window.addEventListener('unica:scent-diagnosis-saved',()=>setTimeout(load,250));
window.addEventListener('unica:punyako-diagnosis-complete',()=>setTimeout(load,250));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
