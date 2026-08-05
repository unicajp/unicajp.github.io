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


const CATEGORY_INFO = {
  kindness:{icon:'💗',title:'やさしさ',copy:'あなたの思いやりや、人との接し方を診断します。'},
  positivity:{icon:'🌈',title:'前向きさ',copy:'困難への向き合い方や、気持ちの切り替え方を診断します。'},
  action:{icon:'🌼',title:'行動力',copy:'一歩を踏み出す速さや、挑戦する力を診断します。'},
  sensitivity:{icon:'🌙',title:'感受性',copy:'音楽や景色、人の気持ちを受け取る感性を診断します。'},
  sociability:{icon:'☀️',title:'社交性',copy:'人との距離感や、コミュニケーションの傾向を診断します。'}
};

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

// 16タイプ×16タイプの基本相性表。端末ごとに計算結果が変わらないよう、タイプ定義から一度だけ生成します。
const TYPE_INDEX = new Map(TYPES.map((t,i)=>[t.id,i]));
const COMPATIBILITY_MATRIX = TYPES.map((a, ai)=>TYPES.map((b, bi)=>{
  if(ai===bi) return 88;
  const distance=Math.sqrt(a.centroid.reduce((sum,v,i)=>sum+(v-b.centroid[i])**2,0));
  const complement=a.centroid.reduce((sum,v,i)=>sum+(6-Math.abs(v-b.centroid[i])),0)/5;
  return clamp(Math.round(95-distance*4.2+(complement-4)*1.5),68,97);
}));

const QUESTIONS = [
 ['kindness','困っている人を見ると、自然と声をかけたくなる。'],
 ['kindness','相手の気持ちを考えて行動することが多い。'],
 ['kindness','意見が違っても、まずは相手の話を聞こうと思う。'],
 ['kindness','忙しい日でも、頼られるとできるだけ力になりたい。'],
 ['kindness','小さな親切でも、誰かの役に立てるとうれしい。'],
 ['kindness','人の成功を素直に喜ぶことができる。'],
 ['kindness','相手が失敗しても、責めるより励ましたいと思う。'],
 ['kindness','知らない人にも気を配ることが多い。'],
 ['positivity','失敗しても、次に活かそうと考えられる。'],
 ['positivity','予定外の出来事にも柔軟に対応できる。'],
 ['positivity','難しいことでも挑戦してみたいと思う。'],
 ['positivity','落ち込んでも、比較的早く気持ちを切り替えられる。'],
 ['positivity','周りが不安なときほど前向きな言葉をかけたい。'],
 ['positivity','過去よりも未来を考えることが多い。'],
 ['positivity','新しい一日は楽しみだと感じる。'],
 ['positivity','結果がすぐ出なくても努力を続けられる。'],
 ['action','思いついたことはすぐ行動に移すほうだ。'],
 ['action','初めての場所へ行くことにあまり抵抗はない。'],
 ['action','締め切りより前に行動を始めることが多い。'],
 ['action','新しいことに挑戦するのが好きだ。'],
 ['action','迷ったときでも比較的早く決断できる。'],
 ['action','やりたいことには積極的に取り組む。'],
 ['action','問題が起きたら、まず自分から動く。'],
 ['action','目標を決めると最後まで頑張ろうとする。'],
 ['sensitivity','音楽を聴いて感動することがよくある。'],
 ['sensitivity','季節の匂いや空気の変化によく気づく。'],
 ['sensitivity','人の声の変化から気持ちを感じ取ることがある。'],
 ['sensitivity','映画や物語の余韻が長く残る。'],
 ['sensitivity','きれいな景色を見ると心が動く。'],
 ['sensitivity','部屋の雰囲気や光にこだわることがある。'],
 ['sensitivity','相手の言葉の奥にある気持ちを考えることが多い。'],
 ['sensitivity','思い出の品を大切にしている。'],
 ['sociability','初対面の人とも比較的話しやすい。'],
 ['sociability','休日は誰かと過ごす時間も好きだ。'],
 ['sociability','うれしい出来事は誰かと共有したくなる。'],
 ['sociability','人前で話すことにあまり抵抗はない。'],
 ['sociability','新しい友達を作ることは楽しい。'],
 ['sociability','グループでは自然と意見をまとめることがある。'],
 ['sociability','メッセージの返信は比較的早いほうだ。'],
 ['sociability','人と長時間過ごしても、あまり疲れない。']
].map((q,i)=>({id:i+1,dim:q[0],text:q[1]}));
const OPTIONS = [
  ['⭐ とても当てはまる',5],['⭐ わりと当てはまる',4],['⭐ どちらともいえない',3],['⭐ あまり当てはまらない',2],['⭐ まったく当てはまらない',1]
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

function showIntro(){ const r=readResult()||member()?.scentDiagnosis; const todayOk=canDiagnoseToday(); screen.innerHTML=`<div class="scent16-intro"><div class="scent16-intro-flower">${r?(typeById(r.typeId)?.flower||'🌸'):'💐'}</div><small>『ミルクの匂い』リリース記念</small><h3>うにかの匂い16診断</h3><p>40問から、あなたの花・匂い・花言葉・5つの個性を見つけます。<br>結果は最新の1件だけ保存されます。</p><div class="scent16-count" id="scent16DiagnosisCount">診断済み人数を確認中…</div>${r?`<button class="scent16-primary" id="viewScentResult">${typeById(r.typeId)?.flower||'🌸'} 最新結果を見る</button><button class="scent16-secondary" id="viewCompatibility">❤️ 自分との相性ランキング</button>`:''}<button class="scent16-primary" id="startScent16" ${todayOk?'':'disabled'}>${todayOk?(r?'今日の診断を始める':'診断を始める'):'今日は診断済みです'}</button><button class="scent16-secondary" id="viewFlowerBook">🌼 16種類の花図鑑</button><p class="scent16-daily-note">1日1回まで。日本時間0時に再診断できます。</p></div>`;
 $('#startScent16')?.addEventListener('click',startDiagnosis); $('#viewScentResult')?.addEventListener('click',()=>showResult(r)); $('#viewCompatibility')?.addEventListener('click',showCompatibility); $('#viewFlowerBook')?.addEventListener('click',showFlowerBook); refreshDiagnosisCount();
}
function startDiagnosis(){answers=[];questionIndex=0;showCategoryIntro(QUESTIONS[0].dim);}
function showCategoryIntro(dim){
 const info=CATEGORY_INFO[dim]; const step=DIMENSIONS.findIndex(x=>x[0]===dim)+1;
 screen.innerHTML=`<div class="scent16-category-intro"><div class="scent16-category-icon">${info.icon}</div><small>STEP ${step} / 5</small><h3>${info.title}</h3><p>${info.copy}</p><button class="scent16-primary" id="beginCategory">${step===1?'診断を始める':'次のカテゴリーへ'}</button></div>`;
 $('#beginCategory')?.addEventListener('click',showQuestion);
}
function showQuestion(){
 const q=QUESTIONS[questionIndex], step=Math.floor(questionIndex/8)+1, progress=Math.round(((questionIndex+1)/QUESTIONS.length)*100);
 screen.innerHTML=`<div class="scent16-step-head"><span>STEP ${step} / 5</span><strong>${CATEGORY_INFO[q.dim].icon} ${CATEGORY_INFO[q.dim].title}</strong></div><div class="scent16-progress"><div><i style="width:${progress}%"></i></div><small>${questionIndex+1} / ${QUESTIONS.length}</small></div><div class="scent16-question"><small>この文章が、今の自分にどのくらい当てはまりますか？</small><h3>${safe(q.text)}</h3><div class="scent16-options">${OPTIONS.map(o=>`<button class="scent16-option" data-value="${o[1]}">${safe(o[0])}</button>`).join('')}</div></div>${questionIndex>0?'<button class="scent16-back-question" id="backQuestion">← ひとつ前の質問へ</button>':''}<p class="scent16-daily-note">どの答えにも正解・不正解はありません。今の気持ちに近いものを選んでください。</p>`;
 screen.querySelectorAll('[data-value]').forEach(b=>b.addEventListener('click',()=>{
   answers[questionIndex]={dim:q.dim,value:Number(b.dataset.value)}; questionIndex++;
   if(questionIndex>=QUESTIONS.length) return finishDiagnosis();
   const next=QUESTIONS[questionIndex]; if(next.dim!==q.dim) showCategoryIntro(next.dim); else showQuestion();
 }));
 $('#backQuestion')?.addEventListener('click',()=>{questionIndex=Math.max(0,questionIndex-1);showQuestion();});
}
function calculate(){
 const totals={}; DIMENSIONS.forEach(([k])=>totals[k]=[]);
 answers.filter(Boolean).forEach(a=>totals[a.dim].push(a.value));
 const stats={};
 DIMENSIONS.forEach(([k])=>{
   const values=totals[k];
   stats[k]=values.length?Math.round((values.reduce((a,b)=>a+b,0)/values.length)*20):60;
 });
 const vector=DIMENSIONS.map(([k])=>stats[k]/20);
 const signature=DIMENSIONS.map(([k])=>stats[k]).join('-');
 let best=TYPES[0], bestScore=Infinity;
 TYPES.forEach(t=>{
   const distance=t.centroid.reduce((sum,v,i)=>sum+(v-vector[i])**2,0);
   const profileSpread=Math.max(...t.centroid)-Math.min(...t.centroid);
   const answerSpread=Math.max(...vector)-Math.min(...vector);
   const shapePenalty=Math.abs(profileSpread-answerSpread)*0.08;
   const tieBreak=(hashPair(signature,t.id)%1000)/1000000;
   const score=distance+shapePenalty+tieBreak;
   if(score<bestScore){bestScore=score;best=t;}
 });
 const confidence=clamp(Math.round(100-bestScore*9),70,96);
 const daySeed=[...JST_DATE()+best.id].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7);
 return {...best,typeId:best.id,scentName:best.name,flowerMeaning:best.meaning,stats,confidence,diagnosedDate:JST_DATE(),message:DAILY_MESSAGES[daySeed%DAILY_MESSAGES.length]};
}
async function finishDiagnosis(){
 screen.innerHTML='<div class="scent16-analyzing"><div class="scent16-petal-orbit">🌸</div><h3>診断中…</h3><p>あなたの香りを探しています…</p><div class="scent16-analyzing-bar"><i></i></div></div>';
 await new Promise(r=>setTimeout(r,1800)); currentResult=calculate(); saveLocal(currentResult);
 try{const fb=await waitFirebase();await fb.saveScentDiagnosis(currentResult);}catch(e){console.warn(e);}
 updateHome();
 screen.innerHTML=`<div class="scent16-reveal"><small>あなたの香りは…</small><div class="scent16-reveal-flower">${currentResult.flower}</div><h3>${safe(currentResult.scentName)}</h3><div class="scent16-meaning-reveal"><span>花言葉</span><b>「${safe(currentResult.flowerMeaning)}」</b></div></div>`;
 await new Promise(r=>setTimeout(r,1800)); showResult(currentResult,true);
}
function star(v){return clamp(Math.round(v/20),1,5)}
function showResult(result, fresh=false){ if(!result)return showIntro(); const t=typeById(result.typeId)||result; currentResult={...t,...result}; screen.innerHTML=`<div class="scent16-result"><div class="scent16-result-bloom">${t.flower}</div>${fresh?'<small>あなたの匂いは…</small>':''}<h3>${safe(t.name)}</h3><span class="scent16-meaning">花言葉：${safe(t.meaning)}</span><small class="scent16-diagnosed-date">診断日：${safe((result.diagnosedDate||'').replaceAll('-','/'))}${result.confidence?` ・ 香りの一致度 ${clamp(result.confidence,0,100)}%`:''}</small><div class="scent16-copy"><h4>性格</h4><p>${safe(t.personality)}</p></div><div class="scent16-traits"><div><strong>長所</strong><span>${safe(t.strength)}</span></div><div><strong>苦手になりやすいこと</strong><span>${safe(t.weakness)}</span></div></div><div class="scent16-stats">${DIMENSIONS.map(([k,label])=>`<div class="scent16-stat"><span>${label}</span><div class="scent16-stat-track"><i style="width:${clamp(result.stats?.[k]||60,0,100)}%"></i></div><b>${'★'.repeat(star(result.stats?.[k]||60))}</b></div>`).join('')}</div><div class="scent16-copy"><h4>今日のあなたへの一言</h4><p>${safe(result.message||'あなたらしい香りを大切に。')}</p></div><div class="scent16-actions"><button class="scent16-primary" id="shareScent16">📤 シェア</button><button class="scent16-secondary" id="compatScent16">❤️ 相性</button></div><button class="scent16-secondary" id="backScent16">戻る</button></div>`;
 $('#shareScent16')?.addEventListener('click',()=>showShare(result));$('#compatScent16')?.addEventListener('click',showCompatibility);$('#backScent16')?.addEventListener('click',showIntro);
}
function hashPair(a,b){return [...[a,b].sort().join('|')].reduce((h,c)=>(h*33+c.charCodeAt(0))>>>0,5381)}
function compatibility(a,b,uidA='',uidB=''){ const ta=typeById(a.typeId),tb=typeById(b.typeId); if(!ta||!tb)return 68; const ai=TYPE_INDEX.get(ta.id),bi=TYPE_INDEX.get(tb.id); const base=COMPATIBILITY_MATRIX[ai][bi]; const statA=a.stats||{},statB=b.stats||{}; const statDistance=DIMENSIONS.reduce((sum,[k])=>sum+Math.abs((statA[k]??60)-(statB[k]??60)),0)/500; const statBonus=Math.round((1-statDistance)*4)-2; const jitter=(hashPair(uidA||ta.id,uidB||tb.id)%5)-2; return clamp(base+statBonus+jitter,65,99); }
async function showCompatibility(){ const mine=readResult()||member()?.scentDiagnosis;if(!mine){showIntro();return;} screen.innerHTML='<div class="scent16-rank-empty">相性ランキングを読み込んでいます…</div>'; try{membersCache=await (await waitFirebase()).loadScentMembers();}catch(e){console.warn(e);membersCache=[];} const myUid=window.UNICA_FIREBASE?.uid||''; const rows=membersCache.filter(x=>x.uid!==myUid).map(x=>({...x,score:compatibility(mine,x.scentDiagnosis,myUid,x.uid)})).sort((a,b)=>b.score-a.score||a.number-b.number); screen.innerHTML=`<div class="scent16-ranking-head"><div><small>あなたを中心にした専用表示</small><h3>❤️ 相性ランキング</h3></div><small>${rows.length}人</small></div>${rows.length?`<div class="scent16-rank-list">${rows.map((r,i)=>`<button class="scent16-rank-row${i<3?' is-top':''}" data-member-uid="${safe(r.uid)}"><b>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</b><span class="avatar">${safe(r.avatar)}</span><span><strong>${safe(r.name)}</strong><small>${safe(r.scentDiagnosis.scentName||typeById(r.scentDiagnosis.typeId)?.name||'診断済み')}</small></span><em>${r.score}%<small>${r.score>=95?'🌈 運命の香り':r.score>=90?'💖 ベストマッチ':''}</small></em></button>`).join('')}</div>`:'<div class="scent16-rank-empty">診断済みのうにメンがまだいません。</div>'}<button class="scent16-secondary" id="backFromCompat">結果へ戻る</button>`;
 screen.querySelectorAll('[data-member-uid]').forEach(b=>b.addEventListener('click',()=>{close();window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid:b.dataset.memberUid}}));}));$('#backFromCompat')?.addEventListener('click',()=>showResult(mine));
}

function showFlowerBook(){
 screen.innerHTML=`<div class="scent16-ranking-head"><div><small>16種類の香り</small><h3>🌼 花図鑑</h3></div></div><div class="scent16-flower-grid">${TYPES.map(t=>`<button class="scent16-flower-card" data-flower-id="${t.id}"><span>${t.flower}</span><strong>${safe(t.name)}</strong><small>${safe(t.meaning)}</small></button>`).join('')}</div><button class="scent16-secondary" id="backFromFlowerBook">戻る</button>`;
 screen.querySelectorAll('[data-flower-id]').forEach(b=>b.addEventListener('click',()=>showFlowerDetail(b.dataset.flowerId)));
 $('#backFromFlowerBook')?.addEventListener('click',showIntro);
}
function showFlowerDetail(id){
 const t=typeById(id); if(!t)return showFlowerBook();
 const mine=readResult()||member()?.scentDiagnosis; const current=mine?.typeId===id;
 screen.innerHTML=`<div class="scent16-result"><div class="scent16-result-bloom">${t.flower}</div><h3>${safe(t.name)}</h3>${current?'<span class="scent16-current-flower">現在のあなた</span>':''}<span class="scent16-meaning">花言葉：${safe(t.meaning)}</span><div class="scent16-copy"><h4>性格</h4><p>${safe(t.personality)}</p></div><div class="scent16-traits"><div><strong>長所</strong><span>${safe(t.strength)}</span></div><div><strong>苦手になりやすいこと</strong><span>${safe(t.weakness)}</span></div></div><div class="scent16-copy"><h4>相性のよい香り</h4><p>${TYPES.filter(x=>x.id!==t.id).map(x=>({x,score:COMPATIBILITY_MATRIX[TYPE_INDEX.get(t.id)][TYPE_INDEX.get(x.id)]})).sort((a,b)=>b.score-a.score).slice(0,3).map(v=>`${v.x.flower} ${v.x.name}（${v.score}%）`).join('<br>')}</p></div><button class="scent16-secondary" id="backToFlowerBook">花図鑑へ戻る</button></div>`;
 $('#backToFlowerBook')?.addEventListener('click',showFlowerBook);
}
async function refreshDiagnosisCount(){
 const countEl=$('#scent16DiagnosisCount'); if(!countEl)return;
 try{const rows=await (await waitFirebase()).loadScentMembers(); countEl.textContent=`診断済み ${rows.length}人`;}
 catch{countEl.textContent='みんなの診断結果と相性をチェック';}
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

window.UNICA_SCENT16={typeById,compatibility,compatibilityMatrix:COMPATIBILITY_MATRIX,getMyResult:()=>readResult()||member()?.scentDiagnosis};
