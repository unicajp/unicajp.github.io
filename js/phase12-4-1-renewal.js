(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const make=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e};
function clickTarget(id){const e=document.getElementById(id);if(e)e.click();}
function remember(key,label,icon){try{localStorage.setItem('unicaRecentFeature',JSON.stringify({key,label,icon,at:Date.now()}));}catch(_){} renderRecent();}
function renderRecent(){const box=$('#renewalRecent');if(!box)return;let r=null;try{r=JSON.parse(localStorage.getItem('unicaRecentFeature')||'null')}catch(_){}if(!r){box.classList.remove('is-visible');return}box.classList.add('is-visible');box.innerHTML=`<span class="recent-icon">${r.icon||'✨'}</span><div><small>最近利用した機能</small><strong>${r.label||''}</strong><b>続きから開く ›</b></div>`;box.onclick=()=>{const b=document.querySelector(`[data-feature-key="${r.key}"]`);if(b)b.click()};}
function statusText(key){
 if(key==='game'){const n=$('#milkLyricsHomeUnlocked')?.textContent||'0';return `歌詞 ${n}/9`}
 if(key==='scent'){return $('#scent16HomeCta')?.textContent?.includes('結果')?'診断済み':'1日1回診断'}
 if(key==='birthday'){return $('#birthdayMonthCount')?.textContent||'今月の予定'}
 if(key==='prefecture'){return $('#prefectureTotalMembers')?.textContent||'全国を見る'}
 if(key==='flowers')return '16種類公開';
 if(key==='lyrics'){const n=$('#milkLyricsHomeUnlocked')?.textContent||'0';return `${n}/9 CHAPTER`}
 return '開く';
}
function card({key,cls,icon,title,desc,badge,open}){const b=make('button',`fun-card ${cls}`);b.type='button';b.dataset.featureKey=key;b.innerHTML=`<span class="fun-icon">${icon}</span><strong>${title}</strong><small>${desc}</small><em data-status-for="${key}">${statusText(key)}</em>${badge?`<span class="feature-badge">${badge}</span>`:''}`;b.addEventListener('click',()=>{remember(key,title,icon);open()});return b}
function subLink({key,icon,title,status,open}){const b=make('button','fun-sub-link');b.type='button';b.dataset.subFeatureKey=key;b.innerHTML=`<span>${icon}</span><strong>${title}</strong><em data-sub-status-for="${key}">${status||''}</em><b>›</b>`;b.addEventListener('click',()=>{remember(key,title,icon);open()});return b}
function featureStack(main,sub){const w=make('div','fun-feature-stack');w.append(main);if(sub)w.append(sub);return w}
function build(){
 const stack=$('#worldHome .app-home-stack');if(!stack||$('#phase1241Renewal'))return;
 const root=make('div','phase1241-renewal');root.id='phase1241Renewal';
 root.append(make('section','renewal-announcement','<small>UNICA WORLD RENEWAL</small><h2>もっと見やすく、もっと楽しく。</h2><p>音楽を中心に、遊べる機能をひとつの一覧へ整理しました。</p><div class="renewal-tags"><span>🌸 匂い16診断</span><span>🎮 MILK BLOOM</span><span>🎂 誕生日</span></div>'));
 const artist=make('section','renewal-section artist-renewal-zone','<div class="renewal-section-head"><div><small>ARTIST & MUSIC</small><h2>うにかの音楽</h2></div><p>聴く・知る</p></div>');
 const release=$('.release-card',stack),people=$('.people-cards',stack);if(release)artist.append(release);if(people)artist.append(people);root.append(artist);
 const support=make('section','renewal-section support-renewal-zone','<div class="renewal-section-head"><div><small>SUPPORT MESSAGE</small><h2>応援コメント</h2></div><p>みんなの声</p></div>');const community=$('#communityHomeCard');if(community)support.append(community);root.append(support);
 const recent=make('button','recent-feature-card');recent.type='button';recent.id='renewalRecent';root.append(recent);
 const fun=make('section','renewal-section','<div class="renewal-section-head"><div><small>ENJOY UNICA WORLD</small><h2>楽しむ</h2></div><p>機能を選ぶ</p></div>');const grid=make('div','fun-grid');
 grid.append(
  featureStack(
   card({key:'game',cls:'game',icon:'🎮',title:'MILK BLOOM',desc:'歌詞を集めながら遊ぼう！',badge:'UPDATE',open:()=>clickTarget('openMilkMatch')}),
   subLink({key:'lyrics',icon:'📖',title:'歌詞図鑑',status:`解放 ${statusText('lyrics')}`,open:()=>clickTarget('openMilkLyrics')})
  ),
  featureStack(
   card({key:'scent',cls:'scent',icon:'🌸',title:'うにかの匂い16診断',desc:'あなただけの花と香りを見つけよう！',badge:'NEW',open:()=>clickTarget('openScent16')}),
   subLink({key:'flowers',icon:'🌼',title:'花図鑑',status:'全16種類',open:()=>{clickTarget('openScent16');setTimeout(()=>clickTarget('viewFlowerBook'),180)}})
  ),
  featureStack(
   card({key:'birthday',cls:'birthday',icon:'🎂',title:'誕生日',desc:'うにメンをみんなでお祝いしよう！',badge:'UPDATE',open:()=>clickTarget('openBirthdayCalendar')}),
   subLink({key:'album',icon:'💌',title:'お祝いアルバム',status:'思い出を見る',open:()=>document.querySelector('[data-open-birthday-album]')?.click()})
  ),
  featureStack(
   card({key:'prefecture',cls:'prefecture',icon:'🗾',title:'全国のうにメン',desc:'全国にいる仲間を見てみよう！',open:()=>clickTarget('openPrefectureDirectory')})
  )
 );fun.append(grid);root.append(fun);
 root.append(make('section','renewal-contact','<small>SUPPORT</small><h3>お問い合わせ</h3><p>不具合・ご要望・その他のお問い合わせは<br>X（旧Twitter）のDMからお気軽にご連絡ください。</p><a href="https://x.com/unica_jpn" target="_blank" rel="noopener noreferrer">𝕏 DMを開く ↗</a>'));
 stack.prepend(root);
 ['#milkMatchHomeCard','#openMilkLyrics','.milk-release-countdown','#birthdayBanner','#birthdayMonthCard','#scent16HomeCard','#prefectureHomeCard'].forEach(sel=>{const e=$(sel,stack);if(e)e.classList.add('phase1241-hidden-home')});
 renderRecent();
 setInterval(()=>{document.querySelectorAll('[data-status-for]').forEach(e=>e.textContent=statusText(e.dataset.statusFor));const ly=document.querySelector('[data-sub-status-for="lyrics"]');if(ly)ly.textContent=`解放 ${statusText('lyrics')}`},2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
