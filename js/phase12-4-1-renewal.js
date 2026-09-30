(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const make=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
function clickTarget(id){const e=document.getElementById(id);if(e){e.click();return true}return false}
function remember(key,label,icon){try{localStorage.setItem('unicaRecentFeature',JSON.stringify({key,label,icon,at:Date.now()}));}catch(_){} renderRecent();}
function renderRecent(){
  const box=$('#renewalRecent');if(!box)return;
  let r=null;try{r=JSON.parse(localStorage.getItem('unicaRecentFeature')||'null')}catch(_){}
  if(!r){box.classList.remove('is-visible');box.innerHTML='';return}
  box.classList.add('is-visible');
  box.innerHTML=`<span class="recent-icon">${r.icon||'✨'}</span><div><small>最近利用した機能</small><strong>${r.label||''}</strong><b>続きから開く ›</b></div>`;
  box.onclick=()=>{const b=document.querySelector(`[data-feature-key="${r.key}"]`);if(b)b.click()};
}
function statusText(key){
 if(key==='game'){const n=$('#milkLyricsHomeUnlocked')?.textContent||'0';return `歌詞を集めて遊ぶ`}
 if(key==='scent'){try{const r=JSON.parse(localStorage.getItem('unicaPunyakoDiagnosisV4Result')||'null');const j=JSON.parse(localStorage.getItem('unicaPunyakoJourneyV4')||'null');if(r?.typeId)return '育てたぷにゅかを見る';if(j?.seedComplete)return `続きから育てる`;return 'まず5問で誕生';}catch(_){return 'まず5問で誕生'}}
 if(key==='prefecture'){return '全国の仲間を見てみる'}
 if(key==='vote'){return '投票結果を見る'}
 return '開く';
}
function tryOpen(selectors=[], fallback){
  for(const sel of selectors){
    const e=document.querySelector(sel);
    if(e){e.click();return true;}
  }
  if(typeof fallback==='function'){try{return !!fallback()}catch(_){}}
  return false;
}
function openVote(){
  return tryOpen([
    '#openVersionPoll',
    '#openVoteResult',
    '[data-open-version-poll]',
    '[data-feature-key="vote"]',
    '.version-poll-open',
    '.version-poll-home-open',
    '.version-poll-card button',
    '.version-poll-card a'
  ],()=>{
    if(typeof window.openVersionPoll==='function'){window.openVersionPoll();return true}
    if(typeof window.openVersionPollModal==='function'){window.openVersionPollModal();return true}
    return false;
  });
}
function card({key,icon,title,desc,open}){
  const b=make('button',`simple-home-card card-${key}`);
  b.type='button';b.dataset.featureKey=key;
  b.innerHTML=`<span class="simple-home-icon">${icon}</span><strong>${title}</strong><small>${desc||statusText(key)}</small>`;
  b.addEventListener('click',()=>{remember(key,title,icon);open()});
  return b;
}
function build(){
 const stack=$('#worldHome .app-home-stack');if(!stack||$('#phase1241Renewal'))return;
 const root=make('div','phase1241-renewal phase1410-clean-home');root.id='phase1241Renewal';
 const recent=make('button','recent-feature-card');recent.type='button';recent.id='renewalRecent';root.append(recent);
 const fun=make('section','renewal-section renewal-section-simple','<div class="renewal-section-head"><div><small>ENJOY UNICA WORLD</small><h2>楽しむ</h2></div></div>');
 const grid=make('div','fun-grid fun-grid-simple');
 grid.append(
   card({key:'game',icon:'🎮',title:'MILK BLOOM',desc:'歌詞を集めて遊ぶ',open:()=>clickTarget('openMilkMatch')}),
   card({key:'scent',icon:'✦',title:'ぷにゅか診断',desc:'まず5問でぷにゅか誕生',open:()=>clickTarget('openScent16')}),
   card({key:'vote',icon:'🎧',title:'うにメン投票',desc:'投票結果を見る',open:()=>openVote()}),
   card({key:'prefecture',icon:'🗾',title:'全国のうにメン',desc:'全国の仲間を見てみる',open:()=>clickTarget('openPrefectureDirectory')})
 );
 fun.append(grid);root.append(fun);
 const artist=make('section','renewal-section artist-renewal-zone','<div class="renewal-section-head"><div><small>ARTIST & MUSIC</small><h2>うにかの音楽</h2></div><p>聴く・知る</p></div>');
 const release=$('.release-card',stack),people=$('.people-cards',stack);if(release)artist.append(release);if(people)artist.append(people);root.append(artist);
 root.append(make('section','renewal-contact','<small>SUPPORT</small><h3>お問い合わせ</h3><p>不具合・ご要望・その他のお問い合わせは<br>X（旧Twitter）のDMからお気軽にご連絡ください。</p><a href="https://x.com/unica_jpn" target="_blank" rel="noopener noreferrer">𝕏 DMを開く ↗</a>'));
 stack.prepend(root);
 ['#milkMatchHomeCard','#openMilkLyrics','.milk-release-countdown','#scent16HomeCard','#prefectureHomeCard'].forEach(sel=>{const e=$(sel,stack);if(e)e.classList.add('phase1241-hidden-home')});
 renderRecent();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
