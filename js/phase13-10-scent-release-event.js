(() => {
  'use strict';
  const GOAL = 50;
  const MILESTONES = [
    { n:10, label:'前奏', icon:'🌱', audio:'assets/audio/milk_no_nioi_acoustic_intro.mp3' },
    { n:20, label:'Aメロ', icon:'🌷', audio:'assets/audio/milk_no_nioi_acoustic_a.mp3' },
    { n:30, label:'Bメロ', icon:'🌼', audio:'assets/audio/milk_no_nioi_acoustic_b.mp3' },
    { n:40, label:'サビ', icon:'🌸', audio:'assets/audio/milk_no_nioi_acoustic_chorus.mp3' },
    { n:50, label:'RELEASE', icon:'🎹' }
  ];
  const $=(s,r=document)=>r.querySelector(s);
  let playing=null, playingBtn=null;

  function card(){
    const el=document.createElement('section'); el.id='scentReleaseEvent'; el.className='scent-release-event';
    el.innerHTML=`<div class="sre-kicker">50 SCENTS PROJECT</div><div class="sre-head"><div><h2>50人の匂いを集めよう</h2><p>みんなの匂いが集まるたび、<br>「ミルクの匂い - 弾き語り ver.」が少しずつ届きます。</p></div><span>🎹</span></div><div class="sre-count"><strong id="sreCount">—</strong><em>/ 50人</em></div><div class="sre-progress"><i id="sreProgress"></i></div><p class="sre-next" id="sreNext">診断人数を確認中…</p><div class="sre-milestones" id="sreMilestones"></div><button class="sre-diagnose" id="sreDiagnose" type="button">🌸 匂い診断に参加する</button><small class="sre-note">同じうにメンの再診断は人数に重複カウントされません。</small>`;
    return el;
  }
  function render(n){
    n=Math.max(0,Number(n)||0); $('#sreCount').textContent=n; $('#sreProgress').style.width=`${Math.min(100,n/GOAL*100)}%`;
    const next=MILESTONES.find(m=>n<m.n); $('#sreNext').textContent=next ? `${next.label}解放まで、あと${next.n-n}人。` : '50人達成！ 弾き語りver. RELEASE決定！';
    $('#sreMilestones').innerHTML=MILESTONES.map(m=>{const open=n>=m.n; return `<div class="sre-step ${open?'is-open':''}"><span>${open?'🔓':'🔒'}</span><b>${m.n}人</b><strong>${m.icon} ${m.label}</strong>${open&&m.audio?`<button type="button" data-sre-audio="${m.audio}">▶ 聴く</button>`:''}</div>`}).join('');
    document.querySelectorAll('[data-sre-audio]').forEach(b=>b.addEventListener('click',()=>listen(b)));
  }
  function listen(btn){
    if(playing){playing.pause();playing.currentTime=0;if(playingBtn)playingBtn.textContent='▶ 聴く'}
    if(playingBtn===btn){playing=playingBtn=null;return}
    const a=new Audio(btn.dataset.sreAudio);playing=a;playingBtn=btn;btn.textContent='■ 停止';
    a.play().catch(()=>{btn.textContent='▶ 聴く';playing=playingBtn=null;});
    a.addEventListener('ended',()=>{btn.textContent='▶ 聴く';playing=playingBtn=null},{once:true});
  }
  async function load(){
    try{
      for(let i=0;i<50;i++){if(window.UNICA_FIREBASE?.loadScentMembers)break;await new Promise(r=>setTimeout(r,120));}
      const rows=await window.UNICA_FIREBASE?.loadScentMembers?.(); render(Array.isArray(rows)?rows.length:0);
    }catch(e){console.warn('scent release event',e);$('#sreNext').textContent='診断人数を取得できませんでした。';}
  }
  function mount(){
    if($('#scentReleaseEvent'))return true; const root=$('#phase1241Renewal'), artist=root?.querySelector('.artist-renewal-zone'); if(!root||!artist)return false;
    root.insertBefore(card(),artist); $('#sreDiagnose').addEventListener('click',()=>$('#openScent16')?.click()); load(); return true;
  }
  function start(){if(mount())return;let t=0;const id=setInterval(()=>{if(mount()||++t>50)clearInterval(id)},120)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
