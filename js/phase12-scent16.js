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


const SCENT_ICON_BASE = 'assets/scent-icons/';
const scentIconUrl = id => `${SCENT_ICON_BASE}${String(id||'sakura')}.webp?v=13.16`;
const scentIconHtml = (id, alt='', cls='scent-flower-icon') => `<img class="${safe(cls)}" src="${safe(scentIconUrl(id))}" alt="${safe(alt)}" loading="lazy" decoding="async">`;

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
const COMPATIBILITY_MATRIX = TYPES.map((a,ai)=>TYPES.map((b,bi)=>{
 if(ai===bi) return 84;
 const d=Math.sqrt(a.centroid.reduce((sum,v,i)=>sum+(v-b.centroid[i])**2,0));
 const complement=a.centroid.reduce((sum,v,i)=>sum+Math.abs((a.centroid[i]-3)+(b.centroid[i]-3)),0);
 const chemistry=((ai*17+bi*11+Math.min(ai,bi)*7)%19)-9;
 return clamp(Math.round(91-d*7+Math.min(complement,8)*1.2+chemistry),48,96);
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
function canDiagnoseToday(){ return true; } // Phase13.19: diagnosis is unlimited
function typeById(id){ return TYPES.find(x=>x.id===id); }
function updateHome(){ const r=readResult()||member()?.scentDiagnosis; const f=$('#scent16HomeFlower'), s=$('#scent16HomeSummary'), c=$('#scent16HomeCta'); if(r){const t=typeById(r.typeId); if(f)f.textContent=t?.flower||'🌸'; if(s)s.textContent=`MY SCENT：${r.scentName||t?.name||'診断済み'}`; if(c)c.textContent='MY SCENTを見る';} else {if(s)s.textContent='一度見つけた香りを、あなたのMY SCENTに。'; if(c)c.textContent='診断する';} }
function open(){ if(!member()){document.getElementById('openMemberGate')?.click();return;} modal?.classList.add('is-open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open');showIntro(); }
function close(){modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open');}

function showIntro(){ const r=readResult()||member()?.scentDiagnosis; const t=r?typeById(r.typeId):null; screen.innerHTML=`<div class="scentv2-hero">${window.__UNICA_SCENT16_FROM_MIND_GARDEN?'<button class="mind-back scent16-mind-back" id="classicBackToMind">← 診断一覧へ</button>':''}<div class="scentv2-kicker">UNICA SCENT</div><div class="scentv2-bloom">${t?.flower||'✿'}</div><h3>${r?'あなたの香りは、ここに。':'あなたの中にある<br>ひとつの香りを見つけよう。'}</h3><p>${r?`一度見つけた <b>${safe(t?.name||r.scentName)}</b> を、UNICA WORLDでのあなたらしさとして大切にします。`:'16の花の中から、行動や感じ方をもとに、あなたらしい香りを見つけます。'}</p><div class="scentv2-meta"><span>16 SCENTS</span><span>約3分</span><span>MY SCENT</span></div>${r?`<button class="scent16-primary" id="viewScentResult">${t?.flower||'🌸'} MY SCENTを見る</button><div class="scentv2-shortcuts"><button id="viewCompatibility">♡ 相性を見る</button><button id="viewFlowerBook">✿ みんなの花を見る</button></div><button class="scentv2-redo" id="redoScent16Intro">もう一度診断する</button>`:`<button class="scent16-primary" id="startScent16">診断をはじめる</button><button class="scent16-secondary" id="viewFlowerBook">✿ 16種類の香りを見る</button>`}<div class="scent16-count" id="scent16DiagnosisCount">みんなの香りを読み込み中…</div></div>`;
 $('#startScent16')?.addEventListener('click',startDiagnosis); $('#classicBackToMind')?.addEventListener('click',()=>window.UNICA_MIND_GARDEN?.open?.());$('#viewScentResult')?.addEventListener('click',()=>showResult(r)); $('#viewCompatibility')?.addEventListener('click',showCompatibility); $('#viewFlowerBook')?.addEventListener('click',showFlowerBook); $('#redoScent16Intro')?.addEventListener('click',startDiagnosis); refreshDiagnosisCount();
}
function startDiagnosis(){answers=[];questionIndex=0;showQuestion();}
function showCategoryIntro(dim){
 const info=CATEGORY_INFO[dim]; const step=DIMENSIONS.findIndex(x=>x[0]===dim)+1;
 screen.innerHTML=`<div class="scent16-category-intro"><div class="scent16-category-icon">${info.icon}</div><small>STEP ${step} / 5</small><h3>${info.title}</h3><p>${info.copy}</p><button class="scent16-primary" id="beginCategory">${step===1?'診断を始める':'次のカテゴリーへ'}</button></div>`;
 $('#beginCategory')?.addEventListener('click',showQuestion);
}
function showQuestion(){
 const q=QUESTIONS[questionIndex], progress=Math.round(((questionIndex+1)/QUESTIONS.length)*100);
 screen.innerHTML=`<div class="scentv2-question-page"><div class="scentv2-qtop"><span>${String(questionIndex+1).padStart(2,'0')} / ${QUESTIONS.length}</span><div><i style="width:${progress}%"></i></div></div><div class="scentv2-qflower">${CATEGORY_INFO[q.dim].icon}</div><small>考えすぎず、普段の自分に近いものを。</small><h3>${safe(q.text)}</h3><div class="scent16-options">${OPTIONS.map(o=>`<button class="scent16-option" data-value="${o[1]}">${safe(o[0].replace('⭐ ',''))}</button>`).join('')}</div>${questionIndex>0?'<button class="scent16-back-question" id="backQuestion">← ひとつ前へ</button>':''}</div>`;
 screen.querySelectorAll('[data-value]').forEach(b=>b.addEventListener('click',()=>{answers[questionIndex]={dim:q.dim,value:Number(b.dataset.value)};questionIndex++;if(questionIndex>=QUESTIONS.length)return finishDiagnosis();showQuestion();}));
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
function profileNotes(t){const c=t.centroid;return {social:c[4]>=4?'人とのつながりから元気をもらうタイプ':'少人数や自分の時間で心を整えるタイプ',love:c[0]>=5?'好きな人をよく見て、さりげなく支える':'気持ちは自分らしい方法でまっすぐ伝える',down:c[3]>=5?'気持ちを深く受け取りやすいので、一人で静かに整える時間が大切':'動いたり誰かと話したりすると切り替えやすい',hidden:c[2]>=4?'穏やかに見えても、決めた時の一歩は意外と速い':'急がないからこそ、見落とさないものがある'};}
function showResult(result,fresh=false){ if(!result)return showIntro(); const t=typeById(result.typeId)||result,n=profileNotes(t); currentResult={...t,...result}; screen.innerHTML=`<div class="scentv2-result"><section class="scentv2-result-cover"><small>YOUR SCENT</small><div>${t.flower}</div><h3>${safe(t.name)}</h3><p>「${safe(t.meaning)}」</p><span>MY SCENT</span></section><section class="scentv2-story"><h4>あなたらしさ</h4><p>${safe(t.personality)}</p></section><div class="scentv2-two"><section><small>STRENGTH</small><h4>あなたの強み</h4><p>${safe(t.strength)}</p></section><section><small>CAREFUL</small><h4>気をつけたいこと</h4><p>${safe(t.weakness)}</p></section></div><section class="scentv2-guide"><h4>もう少し、自分を知る</h4><div><b>人との距離感</b><p>${safe(n.social)}</p></div><div><b>好きな人には</b><p>${safe(n.love)}</p></div><div><b>落ち込んだとき</b><p>${safe(n.down)}</p></div><div><b>実はこんな一面</b><p>${safe(n.hidden)}</p></div></section><section class="scentv2-stats"><h4>5つの個性</h4>${DIMENSIONS.map(([k,label])=>`<div><span>${label}</span><i><em style="width:${clamp(result.stats?.[k]||60,0,100)}%"></em></i><b>${clamp(result.stats?.[k]||60,0,100)}</b></div>`).join('')}</section><div class="scentv2-actions"><button class="scent16-primary" id="compatScent16">♡ ほかの香りとの相性を見る</button><button class="scent16-secondary" id="shareScent16">シェアカードを作る</button><button class="scent16-secondary" id="backScent16">UNICA SCENTへ戻る</button></div><button class="scentv2-redo" id="redoScent16">もう一度診断する</button></div>`;
 $('#shareScent16')?.addEventListener('click',()=>showShare(result));$('#compatScent16')?.addEventListener('click',showCompatibility);$('#backScent16')?.addEventListener('click',showIntro);$('#redoScent16')?.addEventListener('click',()=>{if(confirm('もう一度診断しますか？\n結果は新しいMY SCENTに置き換わります。'))startDiagnosis();});
}
function hashPair(a,b){return [...[a,b].sort().join('|')].reduce((h,c)=>(h*33+c.charCodeAt(0))>>>0,5381)}
function compatibility(a,b,uidA='',uidB=''){const ta=typeById(a.typeId),tb=typeById(b.typeId);if(!ta||!tb)return 70;const ai=TYPE_INDEX.get(ta.id),bi=TYPE_INDEX.get(tb.id);const base=COMPATIBILITY_MATRIX[ai][bi];const jitter=(hashPair(uidA||ta.id,uidB||tb.id)%7)-3;return clamp(base+jitter,45,98);}
function relationBreakdown(a,b){const ai=TYPE_INDEX.get(a.id),bi=TYPE_INDEX.get(b.id),base=COMPATIBILITY_MATRIX[ai][bi];const seed=hashPair(a.id,b.id);return {friend:clamp(base+((seed%17)-8),42,98),talk:clamp(base+(((seed>>3)%19)-9),42,98),support:clamp(base+(((seed>>5)%15)-7),42,98),love:clamp(base+(((seed>>7)%21)-10),42,98)};}
function relationCopy(score){if(score>=90)return '違いまで自然に受け止めやすい、特別に噛み合うふたり。';if(score>=78)return '無理をしなくても歩幅を合わせやすいふたり。';if(score>=65)return '似ているところと違うところ、その両方を楽しめるふたり。';if(score>=52)return '距離の縮め方に少しコツがいるぶん、知るほど面白いふたり。';return 'かなり違うからこそ、新しい景色を見せ合えるふたり。';}
async function showCompatibility(){const mine=readResult()||member()?.scentDiagnosis;if(!mine)return showIntro();screen.innerHTML='<div class="scent16-rank-empty">みんなの香りを読み込んでいます…</div>';try{membersCache=await (await waitFirebase()).loadScentMembers();}catch(e){membersCache=[];}const mt=typeById(mine.typeId),myUid=window.UNICA_FIREBASE?.uid||'';const rows=membersCache.filter(x=>x.uid!==myUid).map(x=>({...x,score:compatibility(mine,x.scentDiagnosis,myUid,x.uid)})).sort((a,b)=>b.score-a.score);screen.innerHTML=`<div class="scentv2-compat"><small>SCENT RELATIONSHIP</small><h3>${mt.flower} ${safe(mt.name)}から見た相性</h3><p>相性は「似ているほど高い」だけではありません。違い・補い合い・会話のテンポから関係性を見ます。</p>${rows.length?`<div class="scentv2-compat-list">${rows.map(r=>{const rt=typeById(r.scentDiagnosis.typeId),d=relationBreakdown(mt,rt);return `<button data-member-uid="${safe(r.uid)}"><span>${rt?.flower||'✿'}</span><div><strong>${safe(r.name)}</strong><small>${safe(rt?.name||'診断済み')}</small><p>${relationCopy(r.score)}</p><em>友 ${d.friend} ・ 会話 ${d.talk} ・ 支え ${d.support} ・ 恋 ${d.love}</em></div><b>${r.score}%</b></button>`}).join('')}</div>`:'<div class="scent16-rank-empty">診断済みのうにメンがまだいません。</div>'}<button class="scent16-secondary" id="backFromCompat">MY SCENTへ戻る</button></div>`;screen.querySelectorAll('[data-member-uid]').forEach(b=>b.addEventListener('click',()=>{close();window.dispatchEvent(new CustomEvent('unica:open-member-pass',{detail:{uid:b.dataset.memberUid}}));}));$('#backFromCompat')?.addEventListener('click',()=>showResult(mine));}


async function showFlowerBook(){screen.innerHTML='<div class="scent16-rank-empty">みんなの花を集めています…</div>';try{membersCache=await (await waitFirebase()).loadScentMembers();}catch(e){membersCache=[];}const counts=Object.fromEntries(TYPES.map(t=>[t.id,0]));membersCache.forEach(x=>{if(counts[x.scentDiagnosis?.typeId]!=null)counts[x.scentDiagnosis.typeId]++});const found=Object.values(counts).filter(Boolean).length;screen.innerHTML=`<div class="scentv2-book"><small>UNICA WORLD SCENTS</small><h3>みんなの花</h3><p><b>${found} / 16</b> 種類の香りが見つかっています。<br>自分の花はひとつ。みんなで16種類を集めます。</p><div class="scent16-flower-grid">${TYPES.map(t=>`<button class="scent16-flower-card ${counts[t.id]?'is-found':'is-missing'}" data-flower-id="${t.id}"><span>${counts[t.id]?t.flower:'？'}</span><strong>${counts[t.id]?safe(t.name):'まだ見つかっていない香り'}</strong><small>${counts[t.id]?`${counts[t.id]}人`:'NEW SCENTを待っています'}</small></button>`).join('')}</div><button class="scent16-secondary" id="backFromFlowerBook">戻る</button></div>`;screen.querySelectorAll('[data-flower-id].is-found').forEach(b=>b.addEventListener('click',()=>showFlowerDetail(b.dataset.flowerId)));$('#backFromFlowerBook')?.addEventListener('click',showIntro);}
function showFlowerDetail(id){
 const t=typeById(id); if(!t)return showFlowerBook();
 const mine=readResult()||member()?.scentDiagnosis; const current=mine?.typeId===id;
 screen.innerHTML=`<div class="scent16-result"><div class="scent16-result-bloom">${t.flower}</div><h3>${safe(t.name)}</h3>${current?'<span class="scent16-current-flower">現在のあなた</span>':''}<span class="scent16-meaning">花言葉：${safe(t.meaning)}</span><div class="scent16-copy"><h4>性格</h4><p>${safe(t.personality)}</p></div><div class="scent16-traits"><div><strong>長所</strong><span>${safe(t.strength)}</span></div><div><strong>苦手になりやすいこと</strong><span>${safe(t.weakness)}</span></div></div><div class="scent16-copy"><h4>相性のよい香り</h4><p>${TYPES.filter(x=>x.id!==t.id).map(x=>({x,score:COMPATIBILITY_MATRIX[TYPE_INDEX.get(t.id)][TYPE_INDEX.get(x.id)]})).sort((a,b)=>b.score-a.score).slice(0,3).map(v=>`${v.x.flower} ${v.x.name}（${v.score}%）`).join('<br>')}</p></div><button class="scent16-secondary" id="backToFlowerBook">花図鑑へ戻る</button></div>`;
 $('#backToFlowerBook')?.addEventListener('click',showFlowerBook);
}
async function refreshDiagnosisCount(){
 const countEl=$('#scent16DiagnosisCount'); if(!countEl)return;
 try{const rows=await (await waitFirebase()).loadScentMembers(); countEl.textContent=`UNICA WORLDに ${rows.length}人のMY SCENT`;}
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

window.UNICA_SCENT16={typeById,compatibility,compatibilityMatrix:COMPATIBILITY_MATRIX,scentIconUrl,scentIconHtml,getMyResult:()=>readResult()||member()?.scentDiagnosis,showIntro,startDiagnosis,showResult};
