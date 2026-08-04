const $ = (s, r=document) => r.querySelector(s);
const modal = $('#scent16Modal');
const screen = $('#scent16Screen');
const MEMBER_KEY = 'unicaWorldMemberV4';
const LOCAL_RESULT_KEY = 'unicaScent16ResultV1';
const JST_DATE = () => new Intl.DateTimeFormat('sv-SE', { timeZone:'Asia/Tokyo' }).format(new Date());
const member = () => { try { return JSON.parse(localStorage.getItem(MEMBER_KEY)||'null'); } catch { return null; } };
const safe = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp = (n,min,max)=>Math.max(min,Math.min(max,n));
const waitFirebase = async () => {
  if (window.UNICA_FIREBASE?.uid) return window.UNICA_FIREBASE;
  await new Promise(resolve => window.addEventListener('unica:firebase-ready', resolve, {once:true}));
  return window.UNICA_FIREBASE;
};

const DIMENSIONS = [
  ['kindness','💗 やさしさ'],['positivity','🌈 前向きさ'],['action','🌼 行動力'],['sensitivity','🌙 感受性'],['sociability','☀️ 社交性']
];

const TYPES = [
 {id:'sakura',flower:'🌸',name:'さくらの匂い',meaning:'やさしさ・新しいはじまり',centroid:[5,4,3,5,4],personality:'人の気持ちの変化によく気づき、場をやわらかくする春風のような人。',strength:'思いやりが自然で、緊張している人にも安心を届けられます。',weakness:'周りを優先しすぎて、自分の本音を後回しにしがちです。'},
 {id:'rose',flower:'🌹',name:'ばらの匂い',meaning:'愛・誇り・情熱',centroid:[4,4,5,4,4],personality:'大切なものにまっすぐで、静かな情熱を持つ華やかな人。',strength:'責任感と表現力があり、決めたことを最後まで育てます。',weakness:'理想が高くなりすぎると、自分にも周りにも厳しくなります。'},
 {id:'sunflower',flower:'🌻',name:'ひまわりの匂い',meaning:'あこがれ・前向き',centroid:[4,5,5,3,5],personality:'明るさと行動力で、周りまで元気にする太陽のような人。',strength:'迷っている人の背中を押し、空気を前向きに変えられます。',weakness:'頑張りすぎて、疲れていることに気づかないことがあります。'},
 {id:'tulip',flower:'🌷',name:'チューリップの匂い',meaning:'思いやり・まっすぐな愛',centroid:[5,4,4,4,3],personality:'誠実で、好きな人や大切なことを丁寧に守る人。',strength:'約束を大切にし、信頼を少しずつ積み重ねられます。',weakness:'気持ちを内側にため込み、言葉にするまで時間がかかります。'},
 {id:'gerbera',flower:'🌼',name:'ガーベラの匂い',meaning:'希望・前進',centroid:[3,5,5,3,4],personality:'新しいことを楽しみながら進める、軽やかな挑戦者。',strength:'失敗を経験に変え、何度でも前を向けます。',weakness:'興味が移りやすく、途中の仕上げが雑になることがあります。'},
 {id:'cosmos',flower:'🌺',name:'コスモスの匂い',meaning:'調和・乙女の真心',centroid:[5,4,2,5,3],personality:'人との調和を大切にし、静かに寄り添える繊細な人。',strength:'言葉にならない気持ちまで受け止める共感力があります。',weakness:'空気を読みすぎて、自分の希望を引っ込めてしまいます。'},
 {id:'gypsophila',flower:'💐',name:'カスミソウの匂い',meaning:'感謝・幸福',centroid:[5,4,2,4,4],personality:'目立たなくても人を支え、感謝を忘れない温かな人。',strength:'小さな変化や努力を見つけ、言葉にして伝えられます。',weakness:'自分の価値を控えめに見積もりすぎることがあります。'},
 {id:'waterlily',flower:'🪷',name:'スイレンの匂い',meaning:'清らかな心・信頼',centroid:[3,4,3,5,2],personality:'静かな場所で考えを深める、落ち着きと芯のある人。',strength:'感情に流されず、物事の本質を見つめられます。',weakness:'一人で抱え込み、助けを求めるのが遅くなりがちです。'},
 {id:'lavender',flower:'🪻',name:'ラベンダーの匂い',meaning:'沈黙・癒やし',centroid:[5,3,2,5,2],personality:'やさしい距離感で、人の心をそっと休ませる癒やしタイプ。',strength:'聞き上手で、相手が安心して本音を話せる空気を作ります。',weakness:'刺激が多い場所では疲れやすく、急な変化が苦手です。'},
 {id:'lilybell',flower:'🌿',name:'すずらんの匂い',meaning:'再び幸せが訪れる',centroid:[5,5,3,4,3],personality:'小さな幸せを見つけ、周囲にも希望を分けられる人。',strength:'落ち込んだ場面でも、無理のない明るさを届けられます。',weakness:'つらい時にも笑顔を保ち、本音を隠してしまうことがあります。'},
 {id:'margaret',flower:'🌼',name:'マーガレットの匂い',meaning:'真実の愛・信頼',centroid:[4,3,3,4,5],personality:'人とのつながりを大切にし、素直な会話を楽しむ人。',strength:'初対面でも自然に距離を縮め、輪を作れます。',weakness:'人の反応を気にしすぎて、気持ちが揺れやすくなります。'},
 {id:'dahlia',flower:'🌺',name:'ダリアの匂い',meaning:'華麗・気品',centroid:[3,4,5,5,3],personality:'感性と実行力を両方持ち、理想を形にできるクリエイター。',strength:'独自の美意識があり、印象に残るものを生み出します。',weakness:'完成度を求めすぎて、始めるまで時間がかかります。'},
 {id:'hydrangea',flower:'🪻',name:'あじさいの匂い',meaning:'家族・和気あいあい',centroid:[4,3,2,5,4],personality:'環境に合わせて表情を変えながら、大切な人を守る人。',strength:'相手や状況に応じて、しなやかに対応できます。',weakness:'周囲に合わせすぎると、自分らしさを見失いがちです。'},
 {id:'camellia',flower:'🌹',name:'ツバキの匂い',meaning:'控えめな美・誇り',centroid:[3,3,4,4,2],personality:'静かでも自分の基準を持ち、丁寧に歩み続ける人。',strength:'派手さに頼らず、実力と誠実さで信頼を得ます。',weakness:'弱さを見せることに抵抗があり、無理をしやすいです。'},
 {id:'osmanthus',flower:'🌼',name:'キンモクセイの匂い',meaning:'謙虚・真実',centroid:[4,4,3,5,3],personality:'さりげない存在感で、記憶に残るやさしさを持つ人。',strength:'目立たないところでも丁寧に働き、空気を整えます。',weakness:'評価されなくても我慢し、気持ちをためてしまいます。'},
 {id:'freesia',flower:'🌺',name:'フリージアの匂い',meaning:'親愛・無邪気',centroid:[4,5,4,4,5],personality:'好奇心と親しみやすさで、新しい出会いを楽しめる人。',strength:'人を巻き込みながら、楽しい流れを作る力があります。',weakness:'気分の波で集中が途切れ、予定を詰め込みすぎることがあります。'}
];

const QUESTIONS = [
 ['kindness','誰かが困っていることに気づいたとき、どうする？'],['kindness','友達が落ち込んでいるとき、まず何をする？'],['kindness','意見が合わない人と話すとき、どんな姿勢になる？'],['kindness','忙しい日に頼まれごとをされたら？'],['kindness','小さな親切をしたあと、どう感じる？'],['kindness','誰かの成功を見たときの気持ちは？'],['kindness','相手のミスに気づいたときは？'],['kindness','知らない人にも気を配るほう？'],
 ['positivity','失敗した翌日はどう考える？'],['positivity','予定外のことが起きたら？'],['positivity','難しい課題を前にしたときは？'],['positivity','気分が沈んだとき、立ち直り方は？'],['positivity','周囲が不安そうなときは？'],['positivity','過去の失敗を思い出したら？'],['positivity','新しい一日を迎える気持ちは？'],['positivity','結果がすぐ出ないときは？'],
 ['action','面白いアイデアを思いついたら？'],['action','初めての場所へ行くときは？'],['action','締め切りが先の作業はいつ始める？'],['action','誰もやったことがないことに誘われたら？'],['action','迷ったとき、決断までの速さは？'],['action','やりたいことが複数あるときは？'],['action','問題が起きたとき、最初の一歩は？'],['action','目標を決めたあとの行動は？'],
 ['sensitivity','音楽を聴いて涙が出ることは？'],['sensitivity','季節の匂いや空気の変化に気づく？'],['sensitivity','人の声色の変化に気づく？'],['sensitivity','映画や物語の余韻はどれくらい残る？'],['sensitivity','きれいな景色を見たときは？'],['sensitivity','部屋の雰囲気や光にこだわる？'],['sensitivity','言葉の裏にある気持ちを考える？'],['sensitivity','思い出の品を大切にする？'],
 ['sociability','初対面の集まりでは？'],['sociability','休日はどんな過ごし方が好き？'],['sociability','うれしい出来事があったら？'],['sociability','人前で話すことは？'],['sociability','新しい友達を作ることは？'],['sociability','グループで意見をまとめる役は？'],['sociability','メッセージの返信は？'],['sociability','人と長時間過ごしたあとは？']
].map((q,i)=>({id:i+1,dim:q[0],text:q[1]}));
const OPTIONS = [
  ['とても当てはまる',5],['わりと当てはまる',4],['どちらともいえない',3],['あまり当てはまらない',2],['ほとんど当てはまらない',1]
];
const DAILY_MESSAGES = [
 'あなたのやさしさは、今日も誰かの心をそっとほどきます。','小さな一歩でも、昨日とは違う景色につながっています。','無理に咲こうとしなくても、あなたのペースで大丈夫です。','気づいた幸せを、今日はひとつだけ言葉にしてみて。','あなたが大切にしているものを、自分にも向けてあげてください。','迷ったときは、心が少し軽くなる方を選んでみて。'
];
let answers = [];
let questionIndex = 0;
let currentResult = null;
let membersCache = [];

function readResult(){ try{return JSON.parse(localStorage.getItem(LOCAL_RESULT_KEY)||'null')}catch{return null} }
function saveLocal(result){ localStorage.setItem(LOCAL_RESULT_KEY,JSON.stringify(result)); const m=member(); if(m){m.scentDiagnosis=result;localStorage.setItem(MEMBER_KEY,JSON.stringify(m));} }
function canDiagnoseToday(){ return readResult()?.diagnosedDate !== JST_DATE(); }
function typeById(id){ return TYPES.find(x=>x.id===id); }
function updateHome(){ const r=readResult()||member()?.scentDiagnosis; const f=$('#scent16HomeFlower'), s=$('#scent16HomeSummary'), c=$('#scent16HomeCta'); if(r){const t=typeById(r.typeId); if(f)f.textContent=t?.flower||'🌸'; if(s)s.textContent=`最新結果：${r.scentName||t?.name||'診断済み'}・${r.flowerMeaning||t?.meaning||''}`; if(c)c.textContent=canDiagnoseToday()?'再診断':'結果を見る';} }
function open(){ if(!member()){document.getElementById('openMemberGate')?.click();return;} modal?.classList.add('is-open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open');showIntro(); }
function close(){modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open');}

function showIntro(){ const r=readResult()||member()?.scentDiagnosis; const todayOk=canDiagnoseToday(); screen.innerHTML=`<div class="scent16-intro"><div class="scent16-intro-flower">${r?(typeById(r.typeId)?.flower||'🌸'):'💐'}</div><small>『ミルクの匂い』リリース記念</small><h3>うにかの匂い16診断</h3><p>40問から、あなたの花・匂い・花言葉・5つの個性を見つけます。<br>診断結果は最新の1件だけ保存されます。</p>${r?`<button class="scent16-primary" id="viewScentResult">最新結果を見る</button><button class="scent16-secondary" id="viewCompatibility">自分との相性ランキング</button>`:''}<button class="scent16-primary" id="startScent16" ${todayOk?'':'disabled'}>${todayOk?(r?'今日の診断を始める':'診断を始める'):'今日は診断済みです'}</button><p class="scent16-daily-note">1日1回まで。日本時間0時に再診断できます。</p></div>`;
 $('#startScent16')?.addEventListener('click',startDiagnosis); $('#viewScentResult')?.addEventListener('click',()=>showResult(r)); $('#viewCompatibility')?.addEventListener('click',showCompatibility);
}
function startDiagnosis(){answers=[];questionIndex=0;showQuestion();}
function showQuestion(){ const q=QUESTIONS[questionIndex], progress=Math.round((questionIndex/QUESTIONS.length)*100); screen.innerHTML=`<div class="scent16-progress"><div><i style="width:${progress}%"></i></div><small>${questionIndex+1} / ${QUESTIONS.length}</small></div><div class="scent16-question"><small>${DIMENSIONS.find(x=>x[0]===q.dim)?.[1]||''}</small><h3>${safe(q.text)}</h3><div class="scent16-options">${OPTIONS.map((o,i)=>`<button class="scent16-option" data-value="${o[1]}">${safe(o[0])}</button>`).join('')}</div></div><p class="scent16-daily-note">どの答えにも正解・不正解はありません。</p>`;
 screen.querySelectorAll('[data-value]').forEach(b=>b.addEventListener('click',()=>{answers.push({dim:q.dim,value:Number(b.dataset.value)});questionIndex++;if(questionIndex<QUESTIONS.length)showQuestion();else finishDiagnosis();}));
}
function calculate(){ const totals={}; DIMENSIONS.forEach(([k])=>totals[k]=[]);answers.forEach(a=>totals[a.dim].push(a.value)); const stats={};DIMENSIONS.forEach(([k])=>stats[k]=Math.round((totals[k].reduce((a,b)=>a+b,0)/totals[k].length)*20)); const vector=DIMENSIONS.map(([k])=>stats[k]/20); let best=TYPES[0],dist=Infinity; TYPES.forEach(t=>{const d=t.centroid.reduce((sum,v,i)=>sum+(v-vector[i])**2,0);if(d<dist){dist=d;best=t;}}); const daySeed=[...JST_DATE()+best.id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7); return {...best,typeId:best.id,scentName:best.name,flowerMeaning:best.meaning,stats,diagnosedDate:JST_DATE(),message:DAILY_MESSAGES[daySeed%DAILY_MESSAGES.length]}; }
async function finishDiagnosis(){ screen.innerHTML='<div class="scent16-intro"><div class="scent16-intro-flower">✨</div><h3>あなたの香りを探しています…</h3><p>花びらを集めて、結果を咲かせています。</p></div>'; await new Promise(r=>setTimeout(r,1100)); currentResult=calculate(); saveLocal(currentResult); try{const fb=await waitFirebase();await fb.saveScentDiagnosis(currentResult);}catch(e){console.warn(e);} updateHome(); showResult(currentResult,true); }
function star(v){return clamp(Math.round(v/20),1,5)}
function showResult(result, fresh=false){ if(!result)return showIntro(); const t=typeById(result.typeId)||result; currentResult={...t,...result}; screen.innerHTML=`<div class="scent16-result"><div class="scent16-result-bloom">${t.flower}</div>${fresh?'<small>あなたの匂いは…</small>':''}<h3>${safe(t.name)}</h3><span class="scent16-meaning">花言葉：${safe(t.meaning)}</span><div class="scent16-copy"><h4>性格</h4><p>${safe(t.personality)}</p></div><div class="scent16-traits"><div><strong>長所</strong><span>${safe(t.strength)}</span></div><div><strong>苦手になりやすいこと</strong><span>${safe(t.weakness)}</span></div></div><div class="scent16-stats">${DIMENSIONS.map(([k,label])=>`<div class="scent16-stat"><span>${label}</span><div class="scent16-stat-track"><i style="width:${clamp(result.stats?.[k]||60,0,100)}%"></i></div><b>${'★'.repeat(star(result.stats?.[k]||60))}</b></div>`).join('')}</div><div class="scent16-copy"><h4>今日のあなたへの一言</h4><p>${safe(result.message||'あなたらしい香りを大切に。')}</p></div><div class="scent16-actions"><button class="scent16-primary" id="shareScent16">📤 シェア</button><button class="scent16-secondary" id="compatScent16">❤️ 相性</button></div><button class="scent16-secondary" id="backScent16">戻る</button></div>`;
 $('#shareScent16')?.addEventListener('click',()=>showShare(result));$('#compatScent16')?.addEventListener('click',showCompatibility);$('#backScent16')?.addEventListener('click',showIntro);
}
function hashPair(a,b){return [...[a,b].sort().join('|')].reduce((h,c)=>(h*33+c.charCodeAt(0))>>>0,5381)}
function compatibility(a,b,uidA='',uidB=''){ const ta=typeById(a.typeId),tb=typeById(b.typeId); if(!ta||!tb)return 65; const va=ta.centroid,vb=tb.centroid; const dist=Math.sqrt(va.reduce((s,v,i)=>s+(v-vb[i])**2,0)); const base=96-dist*4.7; const jitter=(hashPair(uidA||ta.id,uidB||tb.id)%7)-3; return clamp(Math.round(base+jitter),65,99); }
async function showCompatibility(){ const mine=readResult()||member()?.scentDiagnosis;if(!mine){showIntro();return;} screen.innerHTML='<div class="scent16-rank-empty">相性ランキングを読み込んでいます…</div>'; try{membersCache=await (await waitFirebase()).loadScentMembers();}catch(e){console.warn(e);membersCache=[];} const myUid=window.UNICA_FIREBASE?.uid||''; const rows=membersCache.filter(x=>x.uid!==myUid).map(x=>({...x,score:compatibility(mine,x.scentDiagnosis,myUid,x.uid)})).sort((a,b)=>b.score-a.score||a.number-b.number); screen.innerHTML=`<div class="scent16-ranking-head"><div><small>あなたを中心にした専用表示</small><h3>❤️ 相性ランキング</h3></div><small>${rows.length}人</small></div>${rows.length?`<div class="scent16-rank-list">${rows.map((r,i)=>`<button class="scent16-rank-row${i<3?' is-top':''}" data-member-uid="${safe(r.uid)}"><b>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</b><span class="avatar">${safe(r.avatar)}</span><span><strong>${safe(r.name)}</strong><small>${safe(r.scentDiagnosis.scentName||typeById(r.scentDiagnosis.typeId)?.name||'診断済み')}</small></span><em>${r.score}%</em></button>`).join('')}</div>`:'<div class="scent16-rank-empty">診断済みのうにメンがまだいません。</div>'}<button class="scent16-secondary" id="backFromCompat">結果へ戻る</button>`;
 screen.querySelectorAll('[data-member-uid]').forEach(b=>b.addEventListener('click',()=>{close();window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid:b.dataset.memberUid}}));}));$('#backFromCompat')?.addEventListener('click',()=>showResult(mine));
}
function makeCard(result){ const t=typeById(result.typeId)||result; const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const c=canvas.getContext('2d');const g=c.createLinearGradient(0,0,1080,1920);g.addColorStop(0,'#fff9f4');g.addColorStop(.5,'#f0dce8');g.addColorStop(1,'#d9d2ec');c.fillStyle=g;c.fillRect(0,0,1080,1920);c.textAlign='center';c.fillStyle='#8c5870';c.font='42px sans-serif';c.fillText('「ミルクの匂い」リリース記念',540,130);c.font='bold 64px sans-serif';c.fillText('うにかの匂い16診断',540,220);c.font='180px sans-serif';c.fillText(t.flower,540,500);c.fillStyle='#5d3c4b';c.font='bold 80px sans-serif';c.fillText(t.name,540,650);c.font='40px sans-serif';c.fillText(`花言葉：${t.meaning}`,540,730);let y=890;c.textAlign='left';c.font='38px sans-serif';DIMENSIONS.forEach(([k,label])=>{c.fillStyle='#6f4b5b';c.fillText(label,130,y);c.fillStyle='#8d668f';c.fillText('★'.repeat(star(result.stats?.[k]||60)),620,y);y+=100;});c.textAlign='center';c.fillStyle='#6a4858';c.font='42px sans-serif';wrapText(c,result.message||'',540,1460,820,60);c.font='34px sans-serif';c.fillText('#うにかの匂い16診断',540,1740);c.font='bold 44px sans-serif';c.fillText('UNICA WORLD',540,1820);return canvas;}
function wrapText(ctx,text,x,y,maxWidth,lineHeight){const chars=[...text];let line='';const lines=[];chars.forEach(ch=>{const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test});if(line)lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));}
function showShare(result){ const t=typeById(result.typeId)||result;screen.innerHTML=`<div class="scent16-share-preview"><div><small>うにかの匂い16診断</small><div class="flower">${t.flower}</div><h3>${safe(t.name)}</h3><p>花言葉：${safe(t.meaning)}</p></div><p>${safe(result.message||'')}</p><footer>UNICA WORLD</footer></div><button class="scent16-primary" id="nativeShareScent">📤 X・Instagram・LINEへシェア</button><button class="scent16-secondary" id="saveScentCard">画像を保存</button><button class="scent16-secondary" id="copyScentLink">リンクをコピー</button><button class="scent16-secondary" id="backFromShare">結果へ戻る</button>`;
 $('#nativeShareScent')?.addEventListener('click',async()=>{const canvas=makeCard(result);const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));const file=new File([blob],'unica-scent16.png',{type:'image/png'});const text=`私の結果は「${t.name}」でした${t.flower}\n花言葉：${t.meaning}\n#うにかの匂い16診断 #UNICAWORLD`;try{if(navigator.canShare?.({files:[file]}))await navigator.share({title:'うにかの匂い16診断',text,url:location.href,files:[file]});else if(navigator.share)await navigator.share({title:'うにかの匂い16診断',text,url:location.href});else throw new Error();}catch(e){if(e.name!=='AbortError')downloadCanvas(canvas);}});
 $('#saveScentCard')?.addEventListener('click',()=>downloadCanvas(makeCard(result)));$('#copyScentLink')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);toast('リンクをコピーしました');}catch{toast('コピーできませんでした');}});$('#backFromShare')?.addEventListener('click',()=>showResult(result));
}
function downloadCanvas(canvas){const a=document.createElement('a');a.download='unica-scent16-result.png';a.href=canvas.toDataURL('image/png');a.click();}
function toast(text){const el=$('#miniToast');if(!el)return;el.textContent=text;el.classList.add('is-show');setTimeout(()=>el.classList.remove('is-show'),1800);}

$('#openScent16')?.addEventListener('click',open);document.querySelectorAll('[data-close-scent16]').forEach(x=>x.addEventListener('click',close));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('is-open'))close();});window.addEventListener('unica:firebase-member-restored',updateHome);window.addEventListener('unica:scent-diagnosis-saved',updateHome);updateHome();
