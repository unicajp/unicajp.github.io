(()=>{
'use strict';

const VERSION='14.07';
const STORAGE_KEY='unicaKokoroBloomV3';
const MIND_KEY='unicaMindGardenV1';
const MEMBER_KEY='unicaWorldMemberV4';
const $=(s,r=document)=>r.querySelector(s);
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const modal=$('#scent16Modal');
const screen=$('#scent16Screen');
const title=$('#scent16Title');
let backHandler=null;
let locked=false;
let cloudTimer=0;

const AXES={
  care:{label:'思いやり',short:'思いやり'},
  action:{label:'行動力',short:'行動力'},
  curiosity:{label:'好奇心',short:'好奇心'},
  sensitivity:{label:'感受性',short:'感受性'},
  flexibility:{label:'しなやかさ',short:'しなやかさ'}
};
const AXIS_KEYS=Object.keys(AXES);
const HIDDEN_KEYS=['socialEnergy','pace','spaceNeed','expressiveness','recovery'];

const STAGE2={
  ear:{name:'みみぷにゅか',asset:'assets/punyuka/stage2_ear.webp'},
  wing:{name:'はねぷにゅか',asset:'assets/punyuka/stage2_wing.webp'}
};
const STAGE3={
  fluffy:{name:'ふわみみぷにゅか',asset:'assets/punyuka/stage3_01_fluffy_ear.webp'},
  round:{name:'まるみみぷにゅか',asset:'assets/punyuka/stage3_02_round_ear.webp'},
  kira:{name:'キラはねぷにゅか',asset:'assets/punyuka/stage3_03_kira_wing.webp'},
  gira:{name:'ギラはねぷにゅか',asset:'assets/punyuka/stage3_04_gira_wing.webp'}
};
const BASE={name:'ぷにゅか',asset:'assets/punyuka/stage1_base.webp'};

const FINALS={
  final_01:{no:1,name:'気配りウサぷにゅか',short:'気配りウサ',asset:'assets/punyuka/final/01_flower_rabbit.webp',stage3:'fluffy',core:'小さな変化に気づき、必要なときにそっと手を差し出せるタイプ。',strength:'言葉になる前の気持ちにも気づける、細やかな思いやり。'},
  final_02:{no:2,name:'陽キャイヌぷにゅか',short:'陽キャイヌ',asset:'assets/punyuka/final/02_sun_dog.webp',stage3:'fluffy',core:'明るい空気をつくり、周りの人まで自然に元気にするタイプ。',strength:'人の輪に温度を足して、前向きな流れを生み出せる。'},
  final_03:{no:3,name:'好奇心ネコぷにゅか',short:'好奇心ネコ',asset:'assets/punyuka/final/03_color_cat.webp',stage3:'fluffy',core:'「これ何だろう？」を追いかけ、自分の感覚で世界を広げていくタイプ。',strength:'面白いものを見つけるアンテナと、自分らしい動き方。'},
  final_04:{no:4,name:'洞察キツネぷにゅか',short:'洞察キツネ',asset:'assets/punyuka/final/04_moon_fox.webp',stage3:'fluffy',core:'静かに観察し、表面だけでは見えない意味まで考えるタイプ。',strength:'急がずに見つめることで、本質や小さな違和感に気づける。'},
  final_05:{no:5,name:'面倒見クマぷにゅか',short:'面倒見クマ',asset:'assets/punyuka/final/05_guard_bear.webp',stage3:'round',core:'頼られると力が湧き、周りを支えながら場を安定させるタイプ。',strength:'責任感と包容力で、みんなが安心できる土台をつくれる。'},
  final_06:{no:6,name:'楽天パンダぷにゅか',short:'楽天パンダ',asset:'assets/punyuka/final/06_lucky_panda.webp',stage3:'round',core:'うまくいかない日も引きずりすぎず、次の楽しみを見つけられるタイプ。',strength:'気持ちを切り替え、重くなった空気をふっと軽くできる。'},
  final_07:{no:7,name:'夢見ヒツジぷにゅか',short:'夢見ヒツジ',asset:'assets/punyuka/final/07_dream_sheep.webp',stage3:'round',core:'想像の世界を大切にし、心の中でたくさんの景色を育てるタイプ。',strength:'豊かなイメージと感性から、やさしい物語や発想を生み出せる。'},
  final_08:{no:8,name:'探究コアラぷにゅか',short:'探究コアラ',asset:'assets/punyuka/final/08_stargazer_koala.webp',stage3:'round',core:'気になったことをじっくり調べ、納得するまで深く知りたくなるタイプ。',strength:'観察と探究を積み重ね、誰も気づかなかった答えに近づける。'},
  final_09:{no:9,name:'癒しテンシぷにゅか',short:'癒しテンシ',asset:'assets/punyuka/final/09_healing_angel.webp',stage3:'kira',core:'相手を急かさず、その人のまま受け止めて安心を届けるタイプ。',strength:'共感と受容の空気で、人が本音を出せる居場所をつくれる。'},
  final_10:{no:10,name:'冒険テンマぷにゅか',short:'冒険テンマ',asset:'assets/punyuka/final/10_rainbow_pegasus.webp',stage3:'kira',core:'まだ見たことのない景色に心が動き、希望を持って飛び出せるタイプ。',strength:'未知を楽しむ勇気と、新しい一歩を周りにも伝染させる力。'},
  final_11:{no:11,name:'柔軟チョウぷにゅか',short:'柔軟チョウ',asset:'assets/punyuka/final/11_flower_butterfly.webp',stage3:'kira',core:'状況の変化をしなやかに受け止め、その場に合う形へ変われるタイプ。',strength:'ひとつのやり方に固まらず、軽やかに別の道を見つけられる。'},
  final_12:{no:12,name:'閃ピクシーぷにゅか',short:'閃ピクシー',asset:'assets/punyuka/final/12_inspiration_fairy.webp',stage3:'kira',core:'突然のひらめきを楽しみ、思いつきを新しい形へ変えていくタイプ。',strength:'離れたもの同士を結びつけ、面白いアイデアを生み出せる。'},
  final_13:{no:13,name:'猛進ドラゴぷにゅか',short:'猛進ドラゴ',asset:'assets/punyuka/final/13_thunder_dragon.webp',stage3:'gira',core:'決めたら迷いすぎず、勢いと胆力で壁を突破していくタイプ。',strength:'動きながら道をつくる決断力と、周囲まで引っ張る推進力。'},
  final_14:{no:14,name:'悪戯デビルぷにゅか',short:'悪戯デビル',asset:'assets/punyuka/final/14_trick_devil.webp',stage3:'gira',core:'頭の回転と遊び心で、真っすぐではない面白い突破口を見つけるタイプ。',strength:'機転が利き、空気を変える一手や意外な解決策を思いつける。'},
  final_15:{no:15,name:'冷静ペンギぷにゅか',short:'冷静ペンギ',asset:'assets/punyuka/final/15_ice_penguin.webp',stage3:'gira',core:'感情に飲まれすぎず、状況を整えてから落ち着いて判断するタイプ。',strength:'慌ただしい場面でも、自分のペースと判断軸を保てる。'},
  final_16:{no:16,name:'暁の不死鳥ぷにゅか',short:'暁の不死鳥',asset:'assets/punyuka/final/16_dawn_phoenix.webp',stage3:'gira',core:'倒れてもそこで終わらず、自分なりの朝を見つけて立ち上がるタイプ。',strength:'失敗や変化を次の力へ変える、粘り強さと再起の力。'}
};

const O=(text,route={},axes={},hidden={},reaction='spark')=>({text,route,axes,hidden,reaction});
const Q=(scene,text,options)=>({scene,text,options});

const COMMON_1=[
 Q('forest','夜明けの森で、小さな光が道に迷っています。どうする？',[
   O('そっと近づいて「大丈夫？」と声をかける',{stage2:'ear'},{care:7,sensitivity:3},{socialEnergy:2,expressiveness:1},'heart'),
   O('高い場所へ登って、光が帰れそうな道を探す',{stage2:'wing'},{action:6,curiosity:3},{pace:3,recovery:1},'star')]),
 Q('forest','森のお祭りの前夜。あなたが一番わくわくするのは？',[
   O('みんなと飾りつけをして、居心地のいい場所をつくる',{stage2:'ear'},{care:4,flexibility:3},{socialEnergy:3,expressiveness:2},'petal'),
   O('まだ誰も行ったことのない空の展望台を見に行く',{stage2:'wing'},{action:4,curiosity:6},{pace:3,spaceNeed:1},'star')]),
 Q('forest','分かれ道に着きました。どちらへ進みたい？',[
   O('あたたかな灯りと話し声がする、木々の小道',{stage2:'ear'},{care:3,sensitivity:3},{socialEnergy:3,spaceNeed:-1},'heart'),
   O('雲の上まで続いていそうな、きらめく石の道',{stage2:'wing'},{curiosity:5,action:3},{pace:2,expressiveness:1},'star')]),
 Q('forest','古い箱の中に、ひとつだけ持っていけるものがあります。',[
   O('誰かの手紙がたくさん入った、小さなアルバム',{stage2:'ear'},{care:5,sensitivity:4},{spaceNeed:1},'petal'),
   O('行き先の書かれていない、不思議な空の地図',{stage2:'wing'},{curiosity:6,action:3},{pace:2,recovery:1},'star')]),
 Q('forest','森の出口で、最後に心が引かれた景色は？',[
   O('花と木の家が並ぶ、やわらかな村の灯り',{stage2:'ear'},{care:4,flexibility:2},{socialEnergy:2},'heart'),
   O('遠くに浮かぶ、光をまとった空の島',{stage2:'wing'},{action:4,curiosity:4},{expressiveness:2},'star')])
];

const EAR_2=[
 Q('moon','みみが生えたぷにゅか。初めて聞こえてきた音は？',[
   O('あちこちから聞こえる、小さな足音や笑い声',{stage3:'fluffy'},{curiosity:3,action:2},{pace:2},'ear'),
   O('遠くでゆっくり鳴る、低くて安心する鐘の音',{stage3:'round'},{care:3,sensitivity:2},{recovery:2,pace:-1},'ear')]),
 Q('moon','月明かりの湖で、ぷにゅかが見つけた居場所は？',[
   O('草が揺れるたび景色が変わる、湖のほとり',{stage3:'fluffy'},{flexibility:4,curiosity:2},{pace:2},'petal'),
   O('大きな木に包まれた、静かで丸い木の洞',{stage3:'round'},{sensitivity:3,care:2},{spaceNeed:2,recovery:2},'glow')]),
 Q('moon','突然、風向きが変わりました。まずどうする？',[
   O('耳をぴくっと動かして、すぐ風の先を確かめる',{stage3:'fluffy'},{action:4,curiosity:3},{pace:3},'ear'),
   O('その場で少し待って、風が落ち着く流れを見る',{stage3:'round'},{sensitivity:3,flexibility:2},{pace:-2,recovery:2},'glow')]),
 Q('moon','不思議な実をひとつもらいました。',[
   O('どんな味か気になって、まず匂いを確かめる',{stage3:'fluffy'},{curiosity:5,sensitivity:1},{expressiveness:1},'star'),
   O('みんなで分けられるよう、大切に持ち帰る',{stage3:'round'},{care:5,flexibility:1},{socialEnergy:1},'heart')]),
 Q('moon','湖を離れる前、ぷにゅかが覚えていたのは？',[
   O('水面を走った光や、次々変わる風の形',{stage3:'fluffy'},{curiosity:3,flexibility:3},{pace:2},'star'),
   O('水の音と、そこにいた時間のあたたかさ',{stage3:'round'},{sensitivity:4,care:2},{recovery:2},'heart')])
];

const WING_2=[
 Q('sky','はねが生えたぷにゅか。最初にまとった光は？',[
   O('朝露みたいに、やわらかく透き通る光',{stage3:'kira'},{sensitivity:4,flexibility:2},{expressiveness:1},'glow'),
   O('稲妻みたいに、一瞬で空を照らす強い光',{stage3:'gira'},{action:5,curiosity:1},{pace:3},'spark')]),
 Q('sky','雲の上で道が消えました。どう進む？',[
   O('風の流れに合わせて、軽く向きを変えてみる',{stage3:'kira'},{flexibility:6},{recovery:2},'wing'),
   O('雲を突き抜けて、見えるところまで一気に上がる',{stage3:'gira'},{action:6},{pace:4},'spark')]),
 Q('sky','空から聞こえてきた音。どちらが気になる？',[
   O('遠くで重なる、鈴のような小さな音',{stage3:'kira'},{sensitivity:5,curiosity:2},{spaceNeed:1},'star'),
   O('胸まで響く、雷のような大きな音',{stage3:'gira'},{action:4,sensitivity:1},{expressiveness:3},'spark')]),
 Q('sky','浮かぶ島にひとつ印を残すなら？',[
   O('次に来た人が迷わない、小さな光のしるし',{stage3:'kira'},{care:5,flexibility:2},{socialEnergy:1},'heart'),
   O('ここまで来た証になる、大きく光る紋章',{stage3:'gira'},{action:3,curiosity:2},{expressiveness:4},'spark')]),
 Q('sky','空の旅の最後、ぷにゅかはどう飛ぶ？',[
   O('風と遊ぶように、くるりと軽く舞う',{stage3:'kira'},{flexibility:4,sensitivity:2},{pace:1},'wing'),
   O('まっすぐ遠くへ、力強く加速していく',{stage3:'gira'},{action:5},{pace:4,recovery:1},'spark')])
];

const STAGE3_GROUPS={
 fluffy:[
  Q('island','浮島で誰かが困っています。あなたなら？',[O('まずその人のところへ行く',{group:'a'},{care:6},{socialEnergy:2},'heart'),O('少し離れて状況そのものを見てみる',{group:'b'},{curiosity:4,sensitivity:2},{spaceNeed:2},'star')]),
  Q('island','新しい場所で先に気になるのは？',[O('そこにいる人が楽しめているか',{group:'a'},{care:5},{socialEnergy:2},'heart'),O('見たことのないものが隠れていないか',{group:'b'},{curiosity:6},{pace:1},'star')]),
  Q('island','宝物を見つけたら？',[O('誰かと一緒に喜びたい',{group:'a'},{care:3,action:2},{socialEnergy:4,expressiveness:2},'heart'),O('まずじっくり眺めて正体を知りたい',{group:'b'},{curiosity:5,sensitivity:2},{spaceNeed:2},'star')]),
  Q('island','旅の途中で大切にしたいのは？',[O('一緒にいる人の気持ち',{group:'a'},{care:6},{expressiveness:1},'heart'),O('自分が「面白い」と感じた感覚',{group:'b'},{curiosity:5,flexibility:1},{spaceNeed:1},'star')]),
  Q('island','夕暮れ、今日を思い返すなら？',[O('誰とどんな時間を過ごしたか',{group:'a'},{care:4,sensitivity:2},{socialEnergy:2},'petal'),O('何に気づき、何を発見したか',{group:'b'},{curiosity:5,sensitivity:2},{spaceNeed:1},'star')])
 ],
 round:[
  Q('island','誰かが元気をなくしています。',[O('今できることを探して支える',{group:'a'},{care:5,action:2},{socialEnergy:2},'heart'),O('静かな場所で、その気持ちを一緒に見つめる',{group:'b'},{sensitivity:5,care:2},{spaceNeed:2},'glow')]),
  Q('island','不思議な本を見つけました。',[O('みんなで読めそうなページを開く',{group:'a'},{care:3,flexibility:2},{socialEnergy:3},'petal'),O('一人で奥まで読み込みたくなる',{group:'b'},{curiosity:4,sensitivity:3},{spaceNeed:3},'star')]),
  Q('island','今日の予定が全部変わったら？',[O('できることから組み直して前へ進む',{group:'a'},{flexibility:4,action:2},{recovery:3},'spark'),O('いったん頭の中を整理する時間がほしい',{group:'b'},{sensitivity:3,curiosity:2},{spaceNeed:3,pace:-1},'glow')]),
  Q('island','心が満たされるのは？',[O('誰かの役に立てたとき',{group:'a'},{care:5,action:1},{socialEnergy:2},'heart'),O('自分の世界に深く入り込めたとき',{group:'b'},{sensitivity:4,curiosity:3},{spaceNeed:3},'star')]),
  Q('island','夜に残したい灯りは？',[O('みんなが帰ってこられる大きな灯り',{group:'a'},{care:4},{socialEnergy:2,expressiveness:1},'heart'),O('考えごとを照らす小さな読書灯',{group:'b'},{curiosity:3,sensitivity:3},{spaceNeed:3},'glow')])
 ],
 kira:[
  Q('island','光の橋で誰かと出会いました。',[O('相手の歩幅に合わせて進む',{group:'a'},{care:4,flexibility:4},{pace:-1},'heart'),O('「向こうまで行こう！」と新しい道へ誘う',{group:'b'},{action:4,curiosity:3},{expressiveness:3},'star')]),
  Q('island','あなたの光を使うなら？',[O('誰かが安心できるように灯す',{group:'a'},{care:6},{socialEnergy:1},'glow'),O('まだ暗い場所を探しに行くために灯す',{group:'b'},{curiosity:5,action:3},{pace:2},'star')]),
  Q('island','予定外の風が吹きました。',[O('風に合わせて飛び方を変える',{group:'a'},{flexibility:6},{recovery:2},'wing'),O('この風ならどこまで行けるか試したくなる',{group:'b'},{action:4,curiosity:4},{pace:3},'star')]),
  Q('island','心が動くのは？',[O('誰かの表情がやわらいだ瞬間',{group:'a'},{care:5,sensitivity:3},{socialEnergy:1},'heart'),O('「こんなのどう？」と新しいものが生まれた瞬間',{group:'b'},{curiosity:5,flexibility:2},{expressiveness:3},'spark')]),
  Q('island','旅の終わりに残したいものは？',[O('みんなが居心地よく過ごせる場所',{group:'a'},{care:4,flexibility:3},{recovery:2},'glow'),O('次の冒険につながる、新しいきっかけ',{group:'b'},{action:3,curiosity:4},{pace:2},'star')])
 ],
 gira:[
  Q('island','古い門が閉ざされています。',[O('まず動かしてみる。だめなら別の手を考える',{group:'a'},{action:6,flexibility:2},{pace:3},'spark'),O('仕組みを見て、壊さず開く方法を探す',{group:'b'},{curiosity:3,sensitivity:2},{pace:-1,spaceNeed:1},'glow')]),
  Q('island','ピンチのときに出やすい力は？',[O('その場で一気に突破口をつくる',{group:'a'},{action:6},{pace:4},'spark'),O('気持ちを整えて、崩れないよう耐える',{group:'b'},{flexibility:2,sensitivity:2},{recovery:4,pace:-2},'glow')]),
  Q('island','難しい勝負なら？',[O('勝ち筋を見つけて攻めてみたい',{group:'a'},{action:4,curiosity:2},{expressiveness:2},'spark'),O('最後まで焦らず、自分のペースを守りたい',{group:'b'},{sensitivity:2,flexibility:1},{recovery:3,spaceNeed:2},'glow')]),
  Q('island','周りが迷っているときは？',[O('「行こう」と流れを動かしたくなる',{group:'a'},{action:5},{socialEnergy:2,expressiveness:3},'spark'),O('今は動くべきか、少し考えてから決める',{group:'b'},{curiosity:2,sensitivity:3},{pace:-2},'glow')]),
  Q('island','自分らしい強さは？',[O('変化を起こす強さ',{group:'a'},{action:4,flexibility:2},{expressiveness:2},'spark'),O('崩れても立て直せる強さ',{group:'b'},{flexibility:3,sensitivity:1},{recovery:5},'glow')])
 ]
};

const FINAL_BANKS={
 fluffy_a:[
  Q('ruins','友だちが少し元気なさそう。',[O('いつもと違うところに気づいて、そっと声をかける',{final:'final_01'},{care:6,sensitivity:3},{expressiveness:-1},'heart'),O('楽しい話をして、空気ごと明るくしてみる',{final:'final_02'},{care:3,action:3},{socialEnergy:4,expressiveness:4},'spark')]),
  Q('ruins','誰かを応援するときは？',[O('その人が必要としていることを考える',{final:'final_01'},{care:5,sensitivity:3},{spaceNeed:1},'heart'),O('「いけるよ！」と勢いを渡す',{final:'final_02'},{action:4,care:2},{expressiveness:4},'spark')]),
  Q('ruins','集まりの中で自然にしていることは？',[O('困っている人がいないか見ている',{final:'final_01'},{care:5,sensitivity:2},{socialEnergy:1},'heart'),O('みんなが話しやすい空気をつくる',{final:'final_02'},{care:3,flexibility:2},{socialEnergy:4},'spark')]),
  Q('ruins','「ありがとう」と言われるなら？',[O('細かいところまで気づいてくれたこと',{final:'final_01'},{care:5,sensitivity:3},{expressiveness:-1},'petal'),O('一緒にいると元気になれること',{final:'final_02'},{action:2,care:2},{socialEnergy:4,expressiveness:3},'spark')]),
  Q('ruins','あなたらしい優しさは？',[O('必要なときだけ、そっと手を添える',{final:'final_01'},{care:6,flexibility:1},{spaceNeed:1},'heart'),O('笑顔や言葉で、前へ進む力を渡す',{final:'final_02'},{care:3,action:4},{expressiveness:4},'spark')])
 ],
 fluffy_b:[
  Q('ruins','見たことのない扉を発見。',[O('開けたら何があるか、まず試したくなる',{final:'final_03'},{curiosity:6,action:2},{pace:2},'star'),O('扉の模様や周囲の跡から意味を考える',{final:'final_04'},{curiosity:3,sensitivity:4},{spaceNeed:2},'glow')]),
  Q('ruins','知らないことに出会うと？',[O('触って、試して、体験しながら知る',{final:'final_03'},{curiosity:5,action:3},{pace:3},'star'),O('観察して、つながりを考えながら知る',{final:'final_04'},{curiosity:4,sensitivity:4},{pace:-1},'glow')]),
  Q('ruins','自由な一日なら？',[O('気になった場所へ、その場の気分で行く',{final:'final_03'},{curiosity:5,flexibility:3},{pace:2},'star'),O('静かな場所で、考えたかったことを深める',{final:'final_04'},{curiosity:3,sensitivity:4},{spaceNeed:4},'glow')]),
  Q('ruins','「面白い！」と感じる瞬間は？',[O('予想していなかったものを見つけたとき',{final:'final_03'},{curiosity:6,flexibility:2},{expressiveness:2},'star'),O('バラバラだったことが一本につながったとき',{final:'final_04'},{curiosity:4,sensitivity:3},{spaceNeed:2},'glow')]),
  Q('ruins','迷ったら、どちらを信じる？',[O('今こっちが気になる、という直感',{final:'final_03'},{curiosity:5,action:2},{pace:2},'star'),O('少し立ち止まって見えてきた違和感',{final:'final_04'},{sensitivity:5,curiosity:2},{pace:-2},'glow')])
 ],
 round_a:[
  Q('ruins','仲間に頼られたとき。',[O('自分が引き受けられるなら、最後まで支える',{final:'final_05'},{care:5,action:3},{recovery:1},'heart'),O('まず「なんとかなるよ」と気持ちを軽くする',{final:'final_06'},{flexibility:4,care:2},{recovery:4},'spark')]),
  Q('ruins','予定が崩れたら？',[O('役割を整理して、できることを立て直す',{final:'final_05'},{care:3,action:3},{pace:1},'glow'),O('別の楽しみ方を探して切り替える',{final:'final_06'},{flexibility:6},{recovery:4},'spark')]),
  Q('ruins','グループで自然にやることは？',[O('抜けていることを拾って支える',{final:'final_05'},{care:5,sensitivity:2},{socialEnergy:1},'heart'),O('重くなった空気をやわらげる',{final:'final_06'},{flexibility:4,care:2},{socialEnergy:2,recovery:3},'spark')]),
  Q('ruins','大変な仕事を前にすると？',[O('自分の役目なら、きちんと終わらせたい',{final:'final_05'},{action:3,care:3},{recovery:1},'glow'),O('まず一個ずつ。終わったら楽しいことを考える',{final:'final_06'},{flexibility:4,action:1},{recovery:4},'spark')]),
  Q('ruins','あなたの安心感はどちら？',[O('「この人に任せれば大丈夫」と思ってもらえること',{final:'final_05'},{care:5,action:2},{expressiveness:1},'heart'),O('「まあ大丈夫」と一緒に笑えること',{final:'final_06'},{care:2,flexibility:4},{recovery:4,expressiveness:2},'spark')])
 ],
 round_b:[
  Q('ruins','夜空を見上げて浮かぶのは？',[O('そこから始まる物語や、まだ見ない景色',{final:'final_07'},{sensitivity:5,curiosity:2},{spaceNeed:2},'star'),O('星はどう動くのか、どんな仕組みなのか',{final:'final_08'},{curiosity:6},{spaceNeed:2},'glow')]),
  Q('ruins','本を読むなら？',[O('世界に入り込める物語',{final:'final_07'},{sensitivity:5,curiosity:2},{expressiveness:1},'star'),O('知らなかったことが増える本',{final:'final_08'},{curiosity:6},{pace:-1},'glow')]),
  Q('ruins','考えごとの時間は？',[O('想像を広げて、自由に心を遊ばせる',{final:'final_07'},{sensitivity:4,flexibility:2},{spaceNeed:3},'star'),O('ひとつの疑問を、納得するまで掘る',{final:'final_08'},{curiosity:6,action:1},{spaceNeed:3},'glow')]),
  Q('ruins','新しいアイデアが生まれるときは？',[O('景色や気持ちが混ざって、物語のように浮かぶ',{final:'final_07'},{sensitivity:5,curiosity:2},{expressiveness:2},'star'),O('情報を集めているうちに、答えが組み上がる',{final:'final_08'},{curiosity:5,sensitivity:2},{pace:-1},'glow')]),
  Q('ruins','宝物にしたいものは？',[O('忘れたくない夢やイメージ',{final:'final_07'},{sensitivity:5},{spaceNeed:2},'star'),O('自分で確かめて見つけた答え',{final:'final_08'},{curiosity:6},{recovery:1},'glow')])
 ],
 kira_a:[
  Q('ruins','誰かが不安そうです。',[O('安心できるまで、そばで話を聞く',{final:'final_09'},{care:6,sensitivity:3},{pace:-1},'heart'),O('その人に合う方法へ、柔らかくやり方を変える',{final:'final_11'},{flexibility:6,care:2},{pace:1},'wing')]),
  Q('ruins','違う意見が出たら？',[O('まず気持ちごと受け止めたい',{final:'final_09'},{care:5,sensitivity:3},{expressiveness:-1},'heart'),O('両方が生きる形を探してみたい',{final:'final_11'},{flexibility:6,curiosity:1},{recovery:2},'wing')]),
  Q('ruins','居心地のいい人は？',[O('焦らせず、そのままでいさせてくれる人',{final:'final_09'},{care:4,sensitivity:3},{spaceNeed:1},'glow'),O('予定が変わっても一緒に楽しめる人',{final:'final_11'},{flexibility:5,action:1},{recovery:3},'wing')]),
  Q('ruins','得意なのは？',[O('相手が話しやすい空気をつくること',{final:'final_09'},{care:6},{socialEnergy:1},'heart'),O('その場に合わせて、ちょうどいい形へ変えること',{final:'final_11'},{flexibility:6},{pace:1},'wing')]),
  Q('ruins','やさしさの形を選ぶなら？',[O('包み込む',{final:'final_09'},{care:6,sensitivity:2},{recovery:1},'glow'),O('合わせて変わる',{final:'final_11'},{flexibility:6,care:1},{recovery:2},'wing')])
 ],
 kira_b:[
  Q('ruins','新しい扉を見つけたら？',[O('向こう側へ行ってみたい',{final:'final_10'},{action:5,curiosity:3},{pace:3},'star'),O('この扉から何を作れるか考えたい',{final:'final_12'},{curiosity:5,flexibility:2},{expressiveness:3},'spark')]),
  Q('ruins','わくわくする言葉は？',[O('「まだ誰も行ってない」',{final:'final_10'},{action:4,curiosity:4},{pace:3},'star'),O('「まだ誰も思いついてない」',{final:'final_12'},{curiosity:6,sensitivity:1},{expressiveness:3},'spark')]),
  Q('ruins','自由時間にしたいのは？',[O('知らない場所へ出かける',{final:'final_10'},{action:5,curiosity:2},{pace:3},'star'),O('思いついたものを形にして遊ぶ',{final:'final_12'},{curiosity:4,flexibility:3},{spaceNeed:1,expressiveness:3},'spark')]),
  Q('ruins','失敗したときは？',[O('経験が増えたと思って次へ進む',{final:'final_10'},{action:4,flexibility:3},{recovery:3},'star'),O('別のやり方を思いつくきっかけにする',{final:'final_12'},{curiosity:4,flexibility:4},{recovery:2},'spark')]),
  Q('ruins','未来に欲しいものは？',[O('まだ見ていない景色',{final:'final_10'},{action:4,curiosity:3},{pace:2},'star'),O('まだ存在していないアイデア',{final:'final_12'},{curiosity:5,flexibility:2},{expressiveness:3},'spark')])
 ],
 gira_a:[
  Q('ruins','目の前に大きな壁。',[O('正面から突破できる方法をすぐ試す',{final:'final_13'},{action:7},{pace:4},'spark'),O('仕掛けを探して、意外な抜け道を狙う',{final:'final_14'},{curiosity:4,flexibility:3},{expressiveness:2},'devil')]),
  Q('ruins','勝負で燃えるのは？',[O('力を出し切って押し切る瞬間',{final:'final_13'},{action:6},{pace:4},'spark'),O('相手の予想を外す一手が決まる瞬間',{final:'final_14'},{curiosity:4,flexibility:3},{expressiveness:3},'devil')]),
  Q('ruins','会議が止まったら？',[O('まず案を出して流れを動かす',{final:'final_13'},{action:5},{socialEnergy:2,expressiveness:3},'spark'),O('ちょっと変な案を出して空気を変える',{final:'final_14'},{curiosity:3,flexibility:3},{socialEnergy:2,expressiveness:4},'devil')]),
  Q('ruins','自分の武器は？',[O('勢いと決断',{final:'final_13'},{action:6},{pace:4},'spark'),O('機転と遊び心',{final:'final_14'},{curiosity:3,flexibility:4},{expressiveness:4},'devil')]),
  Q('ruins','難題にひと言。',[O('「やってみれば分かる！」',{final:'final_13'},{action:6,flexibility:1},{pace:4},'spark'),O('「別ルート、あるんじゃない？」',{final:'final_14'},{curiosity:4,flexibility:4},{pace:1},'devil')])
 ],
 gira_b:[
  Q('ruins','大きな失敗のあと。',[O('まず状況を整理して、次の一手を冷静に決める',{final:'final_15'},{sensitivity:2,curiosity:2},{pace:-3,recovery:2},'ice'),O('悔しさごと力にして、もう一度立ち上がる',{final:'final_16'},{action:3,flexibility:3},{recovery:6},'fire')]),
  Q('ruins','強いプレッシャーの中では？',[O('余計なものを切り離して集中する',{final:'final_15'},{curiosity:2,sensitivity:1},{spaceNeed:3,pace:-2},'ice'),O('苦しくても、終わるまで気持ちをつなぐ',{final:'final_16'},{action:2,care:1},{recovery:6},'fire')]),
  Q('ruins','あなたの強さに近いのは？',[O('崩れないこと',{final:'final_15'},{flexibility:1,sensitivity:1},{pace:-2,recovery:2},'ice'),O('崩れても戻ってくること',{final:'final_16'},{flexibility:4},{recovery:6},'fire')]),
  Q('ruins','ピンチで大切なのは？',[O('今できる判断を間違えないこと',{final:'final_15'},{curiosity:2,action:1},{pace:-2},'ice'),O('最後まで可能性を捨てないこと',{final:'final_16'},{action:2,flexibility:3},{recovery:5},'fire')]),
  Q('ruins','夜が長く続いたら？',[O('朝が来るまで静かに力を温存する',{final:'final_15'},{sensitivity:2},{spaceNeed:3,recovery:2},'ice'),O('自分で小さな火を灯して朝を待つ',{final:'final_16'},{action:2,sensitivity:2},{recovery:5,expressiveness:1},'fire')])
 ]
};

const COMMON_5=[
 Q('spring','旅の終わり。誰かと過ごすなら、いちばん落ち着くのは？',[
  O('にぎやかに話しながら過ごす',{}, {care:1,action:2},{socialEnergy:5,expressiveness:4,spaceNeed:-3},'spark'),
  O('少人数でゆっくり話す',{}, {care:2,sensitivity:2},{socialEnergy:1,expressiveness:1,spaceNeed:1},'heart'),
  O('同じ場所にいても、それぞれ好きに過ごす',{}, {curiosity:1,sensitivity:2},{socialEnergy:-2,spaceNeed:4},'glow')]),
 Q('spring','急に予定が変わりました。近い反応は？',[
  O('むしろ何が起きるか楽しみ',{}, {flexibility:6,action:2},{pace:3,recovery:4},'star'),
  O('少し戸惑うけど、状況に合わせる',{}, {flexibility:3,sensitivity:1},{recovery:2},'wing'),
  O('一度整理する時間があると安心',{}, {curiosity:1,sensitivity:2},{pace:-3,spaceNeed:2,recovery:1},'glow')]),
 Q('spring','大切なことを伝えるときは？',[
  O('その場で言葉にして伝えたい',{}, {action:3,care:2},{expressiveness:5,pace:2},'spark'),
  O('相手の様子を見ながら、少しずつ伝える',{}, {care:4,sensitivity:3},{expressiveness:1},'heart'),
  O('考えをまとめてから、ちゃんと伝える',{}, {curiosity:2,sensitivity:2},{expressiveness:-1,spaceNeed:2,pace:-2},'glow')]),
 Q('spring','疲れた日の回復方法に近いのは？',[
  O('誰かと話したり、外へ出たりする',{}, {action:2,flexibility:2},{socialEnergy:4,recovery:4,spaceNeed:-2},'spark'),
  O('好きなものを見たり聴いたりする',{}, {sensitivity:4,curiosity:1},{recovery:3},'star'),
  O('静かな一人時間をしっかり取る',{}, {sensitivity:2},{spaceNeed:5,pace:-2,recovery:4},'glow')]),
 Q('spring','最後にひとつ。あなたがこれからも大切にしたいのは？',[
  O('人とのつながり',{}, {care:5},{socialEnergy:3},'heart'),
  O('まだ知らないものに出会うこと',{}, {curiosity:5,action:2},{pace:2},'star'),
  O('自分らしいペースと感覚',{}, {sensitivity:4,flexibility:1},{spaceNeed:3,recovery:2},'glow')])
];

function member(){try{return JSON.parse(localStorage.getItem(MEMBER_KEY)||localStorage.getItem('unicaWorldMemberV3')||'null')}catch{return null}}
function defaultStore(){return {version:3,updatedAt:Date.now(),progress:null,history:[],ownedPunyuka:[],equippedPunyuka:null,activeProfiles:{}}}
function normalizeStore(v){const d=defaultStore(),x=v&&typeof v==='object'?v:{};return {...d,...x,version:3,history:Array.isArray(x.history)?x.history:[],ownedPunyuka:Array.isArray(x.ownedPunyuka)?x.ownedPunyuka:[],activeProfiles:x.activeProfiles&&typeof x.activeProfiles==='object'?x.activeProfiles:{},progress:x.progress&&typeof x.progress==='object'?x.progress:null}}
function readRoot(){try{return JSON.parse(localStorage.getItem(MIND_KEY)||'{}')||{}}catch{return {}}}
function readStore(){try{return normalizeStore(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')||readRoot().kokoroBloomV3)}catch{return defaultStore()}}
let store=readStore();
function writeLocal(){store.updatedAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(store));const root=readRoot();root.kokoroBloomV3=store;localStorage.setItem(MIND_KEY,JSON.stringify(root))}
async function syncCloud(){try{const fb=window.UNICA_FIREBASE;if(!fb?.saveMindGarden)return;let remote={};try{remote=await Promise.race([fb.loadMindGarden?.()||Promise.resolve({}),sleep(1600).then(()=>({}))])||{}}catch{}const root={...readRoot(),...remote,kokoroBloomV3:store};await fb.saveMindGarden(root)}catch(e){console.warn('KOKORO BLOOM cloud save',e)}}
function persist({cloud=true}={}){writeLocal();if(cloud){clearTimeout(cloudTimer);cloudTimer=setTimeout(syncCloud,260)}}
async function hydrate(){try{const fb=window.UNICA_FIREBASE;if(!fb?.loadMindGarden)return;const remote=await Promise.race([fb.loadMindGarden(),sleep(1600).then(()=>null)]);const r=remote?.kokoroBloomV3;if(r&&Number(r.updatedAt||0)>Number(store.updatedAt||0)){store=normalizeStore(r);writeLocal()}}catch(e){console.warn('KOKORO BLOOM hydrate',e)}}

function scoreRoute(answers,key,candidates){const score=Object.fromEntries(candidates.map(x=>[x,0]));for(const a of answers||[]){const v=a?.route?.[key];if(v&&score[v]!=null)score[v]+=1}return candidates.slice().sort((a,b)=>score[b]-score[a]||candidates.indexOf(a)-candidates.indexOf(b))[0]}
function routeFromAnswers(answers=[]){const stage2=scoreRoute(answers.slice(0,5),'stage2',['ear','wing']);let stage3=null,group=null,finalId=null;if(answers.length>=10)stage3=scoreRoute(answers.slice(5,10),'stage3',stage2==='ear'?['fluffy','round']:['kira','gira']);if(answers.length>=15)group=scoreRoute(answers.slice(10,15),'group',['a','b']);if(answers.length>=20&&stage3&&group){const pairs={fluffy_a:['final_01','final_02'],fluffy_b:['final_03','final_04'],round_a:['final_05','final_06'],round_b:['final_07','final_08'],kira_a:['final_09','final_11'],kira_b:['final_10','final_12'],gira_a:['final_13','final_14'],gira_b:['final_15','final_16']};const c=pairs[`${stage3}_${group}`]||['final_01','final_02'];finalId=scoreRoute(answers.slice(15,20),'final',c)}return {stage2,stage3,group,finalId}}
function questionAt(i,answers=[]){if(i<5)return COMMON_1[i];const r=routeFromAnswers(answers);if(i<10)return (r.stage2==='wing'?WING_2:EAR_2)[i-5];if(i<15)return STAGE3_GROUPS[r.stage3||'fluffy'][i-10];if(i<20)return FINAL_BANKS[`${r.stage3||'fluffy'}_${r.group||'a'}`][i-15];return COMMON_5[i-20]}
function scoresFromAnswers(answers=[]){const raw=Object.fromEntries(AXIS_KEYS.map(k=>[k,0]));const hidden=Object.fromEntries(HIDDEN_KEYS.map(k=>[k,50]));for(const a of answers){for(const [k,v] of Object.entries(a?.axes||{}))if(k in raw)raw[k]+=Number(v)||0;for(const [k,v] of Object.entries(a?.hidden||{}))if(k in hidden)hidden[k]+=Number(v)||0}const axes={};for(const k of AXIS_KEYS)axes[k]=clamp(Math.round(30+raw[k]*1.15),25,95);for(const k of HIDDEN_KEYS)hidden[k]=clamp(Math.round(hidden[k]),15,95);return {axes,hidden}}
function currentForm(index,answers=[]){const r=routeFromAnswers(answers);if(index<5)return BASE;if(index<10)return STAGE2[r.stage2]||BASE;return STAGE3[r.stage3]||STAGE2[r.stage2]||BASE}
function fmtDate(iso){try{return new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric'}).format(new Date(iso))}catch{return ''}}
function newId(){return window.crypto?.randomUUID?.()||`kb3_${Date.now()}_${Math.random().toString(36).slice(2,8)}`}

function setBack(fn){backHandler=typeof fn==='function'?fn:null;window.__UNICA_DIAG_BACK=null}
function openModal(){modal?.classList.add('is-open');modal?.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open','modal-open');if(title)title.textContent='KOKORO BLOOM'}
function close(){modal?.classList.remove('is-open');modal?.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open','modal-open');setBack(null)}
async function open(){if(!member()){document.getElementById('openMemberGate')?.click();return}openModal();screen.innerHTML='<div class="kb3-loading"><span>✦</span><b>KOKORO BLOOM</b><small>こころの旅をひらいています…</small></div>';await hydrate();showHub()}

function homeUpdate(){const el=$('#openScent16'),copy=el?.querySelector('.scent16-home-copy'),icon=$('#scent16HomeFlower'),cta=$('#scent16HomeCta'),eq=FINALS[store.equippedPunyuka];if(el)el.setAttribute('aria-label','KOKORO BLOOMを開く');if(copy)copy.innerHTML=`<small>KOKORO BLOOM</small><strong>ぷにゅか性格診断</strong><em id="scent16HomeSummary">${eq?`現在の相棒：${safe(eq.name)}`:store.progress?`${Math.min(25,Number(store.progress.currentIndex||0)+1)} / 25問から続けられます`:'25の物語から、あなたのぷにゅかが進化します。'}</em>`;if(icon)icon.innerHTML=eq?`<img src="${safe(eq.asset)}?v=${VERSION}" alt="" decoding="async">`:'✦';if(cta)cta.textContent=store.progress?'続きから':eq?'診断を見る':'診断する'}

function hubCurrent(){const id=store.equippedPunyuka,run=id?store.activeProfiles?.[id]:null;return store.history.find(x=>x.runId===run)||store.history.find(x=>x.finalId===id)||store.history[0]||null}
function showHub(){setBack(close);const current=hubCurrent();const type=current?FINALS[current.finalId]:null;const progress=store.progress;const answered=progress?.answers?.length||0;const owned=new Set(store.ownedPunyuka||[]).size;screen.innerHTML=`<div class="kb3-hub">
 <section class="kb3-hero">
  <small>KOKORO BLOOM</small>
  ${type?`<img class="kb3-hero-punyuka" src="${safe(type.asset)}?v=${VERSION}" alt="${safe(type.name)}">`:`<img class="kb3-hero-punyuka" src="${BASE.asset}?v=${VERSION}" alt="ぷにゅか">`}
  <h3>${type?`いまの相棒は<br><em>${safe(type.name)}</em>`:'こころの旅から、<br>ぷにゅかが生まれます。'}</h3>
  <p>${type?'同じぷにゅかでも、答え方によって性格の形は少しずつ変わります。':'25の小さな物語を進みながら、ぷにゅかが 1 → 2 → 4 → 16 の姿へ進化します。'}</p>
  <div class="kb3-meta"><span>25 QUESTIONS</span><span>1 → 2 → 4 → 16</span><span>${owned}/16 DISCOVERED</span></div>
 </section>
 ${progress?`<section class="kb3-resume"><b>旅の途中です</b><span>${answered} / 25問まで回答済み</span><button class="kb3-primary" id="kb3Resume">続きから</button><button class="kb3-ghost" id="kb3Restart">最初からやり直す</button></section>`:`<button class="kb3-primary kb3-big" id="kb3Start">${type?'もう一度診断する':'診断をはじめる'}</button>`}
 ${store.history.length?`<div class="kb3-hub-actions"><button id="kb3ViewCurrent">現在の結果</button><button id="kb3History">診断履歴 <b>${store.history.length}</b></button></div>`:''}
 <p class="kb3-note">回答は1問ごとに自動保存されます。途中で閉じても続きから再開できます。</p>
</div>`;
 $('#kb3Start')?.addEventListener('click',startNew);$('#kb3Resume')?.addEventListener('click',resume);$('#kb3Restart')?.addEventListener('click',()=>{if(confirm('途中の回答を消して、最初から始めますか？'))startNew()});$('#kb3History')?.addEventListener('click',showHistory);$('#kb3ViewCurrent')?.addEventListener('click',()=>current?showResult(current):showHub())}

function startNew(){store.progress={startedAt:Date.now(),updatedAt:Date.now(),currentIndex:0,answers:[]};persist();showQuestion(0)}
function resume(){const p=store.progress;if(!p)return startNew();const i=clamp(Number(p.currentIndex??p.answers?.length??0),0,24);showQuestion(i)}
function chapterFor(i){if(i<5)return ['第一章','夜明けの森'];if(i<10)return ['第二章','月と空の分かれ道'];if(i<15)return ['第三章','浮島のこころ'];if(i<20)return ['第四章','古代遺跡の選択'];return ['最終章','こころが咲く泉']}
function showQuestion(i){locked=false;const p=store.progress;if(!p)return showHub();p.currentIndex=i;p.updatedAt=Date.now();persist({cloud:false});const q=questionAt(i,p.answers||[]),form=currentForm(i,p.answers||[]),ch=chapterFor(i),pct=Math.round(i/25*100);setBack(()=>{if(i<=0){showHub();return}p.currentIndex=i-1;persist({cloud:false});showQuestion(i-1)});screen.innerHTML=`<div class="kb3-question-world theme-${q.scene}">
 <div class="kb3-chapter"><span>${ch[0]}</span><b>${ch[1]}</b><em>${i+1} / 25</em></div>
 <div class="kb3-progress"><i style="width:${pct}%"></i></div>
 <div class="kb3-creature-wrap"><div class="kb3-aura"></div><button class="kb3-creature" id="kb3Creature" type="button" aria-label="${safe(form.name)}をぷにぷにする"><img src="${safe(form.asset)}?v=${VERSION}" alt="${safe(form.name)}"></button><small>${safe(form.name)}</small></div>
 <section class="kb3-question-card"><h3>${safe(q.text)}</h3><div class="kb3-options">${q.options.map((o,n)=>`<button type="button" data-kb3-choice="${n}"><span>${String.fromCharCode(65+n)}</span><b>${safe(o.text)}</b></button>`).join('')}</div></section>
 <p class="kb3-autosave">✦ 回答は自動保存されます</p>
</div>`;
 $('#kb3Creature')?.addEventListener('click',e=>{e.currentTarget.classList.remove('is-squish');void e.currentTarget.offsetWidth;e.currentTarget.classList.add('is-squish')});screen.querySelectorAll('[data-kb3-choice]').forEach(b=>b.addEventListener('click',()=>answer(i,Number(b.dataset.kb3Choice))))}

function reactionClass(name){return `react-${['heart','star','petal','glow','spark','ear','wing','devil','ice','fire'].includes(name)?name:'spark'}`}
async function answer(i,choice){if(locked)return;locked=true;const p=store.progress,q=questionAt(i,p.answers||[]),o=q.options[choice];if(!o){locked=false;return}p.answers=(p.answers||[]).slice(0,i);p.answers[i]={q:i+1,choice,text:o.text,route:{...(o.route||{})},axes:{...(o.axes||{})},hidden:{...(o.hidden||{})}};p.currentIndex=Math.min(24,i+1);p.updatedAt=Date.now();persist();const btn=screen.querySelector(`[data-kb3-choice="${choice}"]`);btn?.classList.add('is-picked');const creature=$('#kb3Creature');creature?.classList.add(reactionClass(o.reaction));await sleep(260);if(i===4){const r=routeFromAnswers(p.answers);return showEvolution(STAGE2[r.stage2],()=>showQuestion(5),'ひとつめの進化')}if(i===9){const r=routeFromAnswers(p.answers);window.dispatchEvent(new CustomEvent('unica:kokoro-seed-complete',{detail:{stage3:r.stage3}}));return showEvolution(STAGE3[r.stage3],()=>showQuestion(10),'ふたつめの進化')}if(i===24)return finishDiagnosis();showQuestion(i+1)}

function showEvolution(form,next,label){locked=true;setBack(null);screen.innerHTML=`<div class="kb3-evolution"><div class="kb3-evolution-light"></div><small>${safe(label)}</small><div class="kb3-evo-orbit">✦ · ✧ · ✦</div><img src="${safe(form.asset)}?v=${VERSION}" alt="${safe(form.name)}"><h3>${safe(form.name)}</h3><p>ぷにゅかの姿が変わりました。</p></div>`;setTimeout(()=>{locked=false;next?.()},1450)}

function finishDiagnosis(){const p=store.progress;if(!p||p.answers.length<25){locked=false;return showQuestion(Math.min(24,p?.answers?.length||0))}const route=routeFromAnswers(p.answers),scores=scoresFromAnswers(p.answers),type=FINALS[route.finalId]||FINALS.final_01,run={runId:newId(),diagnosedAt:new Date().toISOString(),finalId:type?Object.keys(FINALS).find(k=>FINALS[k]===type):route.finalId,stage2:route.stage2,stage3:route.stage3,group:route.group,axes:scores.axes,hidden:scores.hidden,answers:p.answers.map(x=>({...x}))};const id=run.finalId;const hadActive=Boolean(store.activeProfiles[id]);store.history=[run,...store.history].slice(0,60);if(!store.ownedPunyuka.includes(id))store.ownedPunyuka.push(id);store.equippedPunyuka=id;if(!hadActive)store.activeProfiles[id]=run.runId;store.progress=null;persist();window.dispatchEvent(new CustomEvent('unica:kokoro-bloom-updated',{detail:{result:run}}));homeUpdate();showEvolution(type,()=>showResult(run),'最終進化')}

function radarSvg(axes,mini=false){const size=mini?130:270,c=size/2,r=mini?47:86;const point=(i,val)=>{const a=(-90+i*72)*Math.PI/180,rr=r*(Number(val)/100);return [c+Math.cos(a)*rr,c+Math.sin(a)*rr]};const ring=v=>AXIS_KEYS.map((_,i)=>point(i,v).join(',')).join(' ');const data=AXIS_KEYS.map((k,i)=>point(i,axes?.[k]??50).join(',')).join(' ');const labels=mini?'':AXIS_KEYS.map((k,i)=>{const a=(-90+i*72)*Math.PI/180,rr=r+35,x=c+Math.cos(a)*rr,y=c+Math.sin(a)*rr;return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${safe(AXES[k].short)}</text>`}).join('');return `<svg class="kb3-radar ${mini?'is-mini':''}" viewBox="0 0 ${size} ${size}" aria-label="性格の五角形グラフ">${[25,50,75,100].map(v=>`<polygon points="${ring(v)}" class="kb3-radar-ring"></polygon>`).join('')}<polygon points="${data}" class="kb3-radar-data"></polygon>${AXIS_KEYS.map((_,i)=>{const [x,y]=point(i,100);return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" class="kb3-radar-line"></line>`}).join('')}${labels}</svg>`}
function topAxis(axes){return AXIS_KEYS.slice().sort((a,b)=>(axes[b]||0)-(axes[a]||0))[0]}
function lowAxis(axes){return AXIS_KEYS.slice().sort((a,b)=>(axes[a]||0)-(axes[b]||0))[0]}
const TOP_COPY={care:'相手の小さな変化を見つけ、人との間にやさしい余白をつくる力があります。',action:'考えるだけで終わらせず、一歩を現実に変える力があります。',curiosity:'「知りたい」を入り口に、世界を自分から広げていく力があります。',sensitivity:'景色・言葉・空気の細かな違いを受け取る力があります。',flexibility:'予定外のことにも形を変えながら対応できる力があります。'};
const LOW_COPY={care:'必要なときは自分と相手の境界を保ち、背負いすぎないこともできます。',action:'すぐに飛び出すより、納得できるまで考えてから動ける慎重さがあります。',curiosity:'何でも追いかけるより、自分に必要なものへ集中できるタイプです。',sensitivity:'周囲の刺激に飲まれすぎず、現実的に整理しやすいところがあります。',flexibility:'簡単に流されず、自分が大切にしている軸を守れるところがあります。'};
function relationCopy(h){const s=h?.socialEnergy??50,e=h?.expressiveness??50,sp=h?.spaceNeed??50;if(s>=64&&e>=60)return '気持ちは言葉やリアクションで伝えるほど関係が育ちやすいタイプ。誰かと一緒に動く時間が元気につながります。';if(sp>=64)return '近すぎる関係より、ひとりで整える時間があるほうが人にもやさしく向き合えます。距離は愛情の少なさではありません。';return 'にぎやかさと一人時間の両方を使い分けるタイプ。相手に合わせすぎず、自分のペースも共有すると楽になります。'}
function recoveryCopy(h){const r=h?.recovery??50,sp=h?.spaceNeed??50;if(sp>=65)return '疲れたときは、予定を少し減らして「誰にも合わせなくていい時間」を確保すると回復しやすいです。';if(r>=64)return '気分転換を入れると回復が早いタイプ。小さく場所ややることを変えるだけでも流れが戻りやすいです。';return '疲れを感じる前に、小さく休むのが効果的。好きな音・景色・飲み物など、戻れる合図をひとつ持つと安定します。'}
function resultCopy(run){const a=run.axes||{},h=run.hidden||{},top=topAxis(a),low=lowAxis(a);return {top,low,strength:TOP_COPY[top],individual:LOW_COPY[low],relation:relationCopy(h),recovery:recoveryCopy(h),advice:`「${AXES[top].label}」を活かしつつ、「${AXES[low].label}」が必要な場面では自分のペースを意識すると、無理なく力を出しやすくなります。`}}

function showResult(run){if(!run)return showHub();const type=FINALS[run.finalId]||FINALS.final_01,copy=resultCopy(run),active=store.activeProfiles?.[run.finalId],isActive=active===run.runId;setBack(showHub);screen.innerHTML=`<div class="kb3-result">
 <section class="kb3-result-hero"><small>YOUR PUNYUKA</small><div class="kb3-result-glow"></div><img src="${safe(type.asset)}?v=${VERSION}" alt="${safe(type.name)}"><span>NO.${String(type.no).padStart(2,'0')}</span><h3>${safe(type.name)}</h3><p>${safe(type.core)}</p><em>${fmtDate(run.diagnosedAt)} の診断</em></section>
 <section class="kb3-result-grid"><div class="kb3-radar-card">${radarSvg(run.axes)}<div class="kb3-axis-values">${AXIS_KEYS.map(k=>`<span><b>${safe(AXES[k].label)}</b><em>${run.axes?.[k]??50}</em></span>`).join('')}</div></div>
 <div class="kb3-insight"><article><small>いちばん伸びた力</small><h4>${safe(AXES[copy.top].label)}</h4><p>${safe(copy.strength)}</p></article><article><small>もうひとつの個性</small><h4>${safe(AXES[copy.low].label)}</h4><p>${safe(copy.individual)}</p></article><article><small>人との距離感</small><p>${safe(copy.relation)}</p></article><article><small>疲れたとき</small><p>${safe(copy.recovery)}</p></article><article class="is-advice"><small>ぷにゅかからひとこと</small><p>${safe(copy.advice)}</p></article></div></section>
 ${isActive?`<div class="kb3-active-profile">✓ この性格データを現在使用しています</div>`:`<div class="kb3-profile-choice"><b>この${safe(type.short)}には別の性格データが登録されています</b><p>今回の診断を、このぷにゅかの現在の性格として使いますか？</p><button class="kb3-primary" id="kb3UseProfile">今回の性格を使う</button><button class="kb3-ghost" id="kb3KeepProfile">今の性格のまま</button></div>`}
 <div class="kb3-result-actions"><button class="kb3-primary" id="kb3Again">もう一度診断する</button><button class="kb3-secondary" id="kb3ResultHistory">診断履歴を見る</button><button class="kb3-ghost" id="kb3Home">KOKORO BLOOMへ戻る</button></div>
</div>`;$('#kb3UseProfile')?.addEventListener('click',()=>{store.activeProfiles[run.finalId]=run.runId;store.equippedPunyuka=run.finalId;persist();homeUpdate();showResult(run)});$('#kb3KeepProfile')?.addEventListener('click',showHub);$('#kb3Again')?.addEventListener('click',startNew);$('#kb3ResultHistory')?.addEventListener('click',showHistory);$('#kb3Home')?.addEventListener('click',showHub)}

function showHistory(){setBack(showHub);const rows=store.history||[];screen.innerHTML=`<div class="kb3-history"><small>PERSONALITY HISTORY</small><h3>診断履歴</h3><p>過去の性格データは消えません。同じぷにゅかでも、そのときの自分を残しておけます。</p><div class="kb3-history-list">${rows.length?rows.map((r,i)=>{const t=FINALS[r.finalId]||FINALS.final_01,active=store.activeProfiles?.[r.finalId]===r.runId;return `<article><img src="${safe(t.asset)}?v=${VERSION}" alt=""><div class="kb3-history-main"><small>${fmtDate(r.diagnosedAt)} · #${rows.length-i}</small><h4>${safe(t.name)}</h4><div class="kb3-history-bars">${AXIS_KEYS.map(k=>`<i title="${safe(AXES[k].label)}"><b style="width:${clamp(r.axes?.[k]??50)}%"></b></i>`).join('')}</div><div class="kb3-history-buttons"><button data-view-run="${safe(r.runId)}">結果を見る</button>${active?'<span>✓ 使用中</span>':`<button data-use-run="${safe(r.runId)}">この性格に戻す</button>`}</div></div></article>`}).join(''):'<div class="kb3-empty">まだ診断履歴はありません。</div>'}</div><button class="kb3-secondary" id="kb3HistoryBack">戻る</button></div>`;screen.querySelectorAll('[data-view-run]').forEach(b=>b.addEventListener('click',()=>showResult(store.history.find(x=>x.runId===b.dataset.viewRun))));screen.querySelectorAll('[data-use-run]').forEach(b=>b.addEventListener('click',()=>{const r=store.history.find(x=>x.runId===b.dataset.useRun);if(!r)return;store.activeProfiles[r.finalId]=r.runId;store.equippedPunyuka=r.finalId;persist();homeUpdate();showHistory()}));$('#kb3HistoryBack')?.addEventListener('click',showHub)}

function install(){homeUpdate();document.addEventListener('click',e=>{const openBtn=e.target.closest?.('#openScent16,[data-feature-key="scent"]');if(openBtn){e.preventDefault();e.stopImmediatePropagation();open();return}if(e.target.closest?.('#scent16NavBack')){e.preventDefault();e.stopImmediatePropagation();if(backHandler)backHandler();else showHub();return}if(e.target.closest?.('#scent16Exit,[data-close-scent16]')){e.preventDefault();e.stopImmediatePropagation();close()}},true);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal?.classList.contains('is-open')){e.preventDefault();close()}},true);window.addEventListener('unica:firebase-member-restored',()=>{store=readStore();homeUpdate()});window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){store=readStore();homeUpdate()}});window.UNICA_MIND_GARDEN={open,startDiagnosis:startNew,v3:true,maintenance:false,getStore:()=>store};window.UNICA_KOKORO_BLOOM={open,start:startNew,showResult,showHistory,getStore:()=>store,finals:FINALS,routeFromAnswers};}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
