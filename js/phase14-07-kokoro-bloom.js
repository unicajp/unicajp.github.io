(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const modal=$('#scent16Modal'),screen=$('#scent16Screen'),title=$('#scent16Title');
if(!modal||!screen)return;

const MEMBER_KEY='unicaWorldMemberV4';
const PROGRESS_KEY='unicaPunyakoDiagnosisV4Progress';
const RESULT_KEY='unicaPunyakoDiagnosisV4Result';
const HISTORY_KEY='unicaPunyakoDiagnosisV4History';
const ACTIVE_BY_TYPE_KEY='unicaPunyakoDiagnosisV4ActiveProfiles';
const JOURNEY_KEY='unicaPunyakoJourneyV4';
const SOUND_KEY='unicaPunyakoSoundV1';
const SOUND_VOLUME_KEY='unicaPunyakoSoundVolumeV1';
const ASSET='assets/punyuka/';
const AXES=['kindness','action','curiosity','sensitivity','flexibility'];
const AXIS_LABEL={kindness:'思いやり',action:'行動力',curiosity:'好奇心',sensitivity:'感受性',flexibility:'しなやかさ'};
const HIDDEN=['socialEnergy','spaceNeed','decisionSpeed','expressionLevel','recoveryStyle','noveltyNeed'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const member=()=>read(MEMBER_KEY,null);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());

const FORMS={
  stage1_base:{id:'stage1_base',name:'ぷにゅか',image:ASSET+'stage1_base.webp',stage:'stage1'},
  stage2_ear:{id:'stage2_ear',name:'みみぷにゅか',image:ASSET+'stage2_ear.webp',stage:'stage2'},
  stage2_wing:{id:'stage2_wing',name:'はねぷにゅか',image:ASSET+'stage2_wing.webp',stage:'stage2'},
  stage3_01_fluffy_ear:{id:'stage3_01_fluffy_ear',name:'ふわみみぷにゅか',image:ASSET+'stage3_01_fluffy_ear.webp',stage:'stage3'},
  stage3_02_round_ear:{id:'stage3_02_round_ear',name:'まるみみぷにゅか',image:ASSET+'stage3_02_round_ear.webp',stage:'stage3'},
  stage3_03_kira_wing:{id:'stage3_03_kira_wing',name:'キラはねぷにゅか',image:ASSET+'stage3_03_kira_wing.webp',stage:'stage3'},
  stage3_04_gira_wing:{id:'stage3_04_gira_wing',name:'ギラはねぷにゅか',image:ASSET+'stage3_04_gira_wing.webp',stage:'stage3'}
};

const TYPES=[
{id:'punyuka_01',name:'気配りウサぷにゅか',image:ASSET+'final/01_flower_rabbit.webp',group:'fluffy',icon:'🌸',fx:'flower',aff:[90,52,48,78,62],core:'小さな変化によく気づき、さりげなく人を助けられるタイプ。',strength:'相手が言葉にする前の困りごとにも気づきやすく、安心できる空気を作れます。',recharge:'自分のためだけに何もしない時間を作ると、やさしさが戻ってきます。',advice:'全部を引き受けず、「今日はここまで」と決めることも立派な気配りです。'},
{id:'punyuka_02',name:'陽キャイヌぷにゅか',image:ASSET+'final/02_sun_dog.webp',group:'fluffy',icon:'☀️',fx:'sun',aff:[68,88,58,52,76],core:'人と一緒にいることでエネルギーが広がり、場を明るくできるタイプ。',strength:'声をかける速さと親しみやすさで、初対面の空気までやわらかくできます。',recharge:'楽しい予定のあとに少しだけ一人時間を入れると、疲れをためにくくなります。',advice:'元気に見せなくても大丈夫。静かな自分も同じくらい大切に。'},
{id:'punyuka_03',name:'好奇心ネコぷにゅか',image:ASSET+'final/03_color_cat.webp',group:'fluffy',icon:'🎨',fx:'color',aff:[48,70,92,62,78],core:'「それ何？」から世界を広げ、自分の感覚で面白い方向へ進むタイプ。',strength:'新しいものを見つける速さと、好きなことへ夢中になれる集中力があります。',recharge:'飽きたときは無理に続けず、別の刺激を少し入れると再び集中できます。',advice:'興味が移るのは弱点ではなく才能。大事なものだけ戻れる印を残しておこう。'},
{id:'punyuka_04',name:'洞察キツネぷにゅか',image:ASSET+'final/04_moon_fox.webp',group:'fluffy',icon:'🌙',fx:'moon',aff:[52,38,78,92,52],core:'表面だけで決めず、静かに観察して奥にある意味を見つけるタイプ。',strength:'人の言葉や状況の細かな違和感を拾い、本質を考える力があります。',recharge:'情報を遮断して、考えを一人で整理する時間が大きな回復になります。',advice:'考えがまとまってから話したいタイプ。急かされる場では「少し考えたい」と伝えてOK。'},
{id:'punyuka_05',name:'面倒見クマぷにゅか',image:ASSET+'final/05_guard_bear.webp',group:'round',icon:'🛡️',fx:'guard',aff:[88,68,42,55,58],core:'頼られると力が出て、みんなが安心して動ける土台を作るタイプ。',strength:'責任感があり、困っている人を放っておかず最後まで支えられます。',recharge:'自分が誰にも頼らなくていい時間を確保すると、気持ちが軽くなります。',advice:'「任せる」も面倒見のひとつ。全部自分で背負わない方が長く支えられます。'},
{id:'punyuka_06',name:'楽天パンダぷにゅか',image:ASSET+'final/06_lucky_panda.webp',group:'round',icon:'🍀',fx:'clover',aff:[65,58,48,42,92],core:'嫌なことがあっても次の楽しみを見つけ、気持ちを切り替えられるタイプ。',strength:'失敗を必要以上に引きずらず、周囲にも「まあ何とかなる」と余白を作れます。',recharge:'好きな食べ物や小さなご褒美など、すぐ楽しめるものが回復のスイッチ。',advice:'前向きさで飛ばしすぎず、たまには嫌だった気持ちにも名前をつけてあげよう。'},
{id:'punyuka_07',name:'夢見ヒツジぷにゅか',image:ASSET+'final/07_dream_sheep.webp',group:'round',icon:'☁️',fx:'dream',aff:[58,34,66,94,56],core:'頭の中に豊かな景色があり、想像することで心を育てるタイプ。',strength:'まだ形のない未来や物語を思い描き、人とは違う世界を作れます。',recharge:'音楽・物語・眠る前の空想など、現実から少し離れる時間が大切です。',advice:'夢は小さく現実に置くと育ちます。思いついたら一行だけでもメモしてみよう。'},
{id:'punyuka_08',name:'探究コアラぷにゅか',image:ASSET+'final/08_stargazer_koala.webp',group:'round',icon:'🔭',fx:'star',aff:[50,42,95,70,48],core:'気になったことを深く調べ、納得するまで知りたくなるタイプ。',strength:'一つのテーマを丁寧に掘り下げ、知識を自分のものにする力があります。',recharge:'好きなことを誰にも邪魔されず調べる時間が、そのまま休息になります。',advice:'全部わかってから動こうとしなくても大丈夫。途中の仮説で一度試すと発見が増えます。'},
{id:'punyuka_09',name:'癒しテンシぷにゅか',image:ASSET+'final/09_healing_angel.webp',group:'kira',icon:'🪽',fx:'angel',aff:[96,42,40,84,74],core:'相手を否定せず受け止め、そばにいるだけで安心を作れるタイプ。',strength:'聞く力と共感力が高く、誰かが弱っているときに自然と寄り添えます。',recharge:'人の気持ちを受け取りすぎた日は、一人になって心を空っぽにする時間を。',advice:'優しさは無限ではありません。自分を守る距離を取ることも優しさです。'},
{id:'punyuka_10',name:'冒険テンマぷにゅか',image:ASSET+'final/10_rainbow_pegasus.webp',group:'kira',icon:'🌈',fx:'rainbow',aff:[55,92,86,55,82],core:'まだ見たことのない場所や経験に、期待しながら飛び込めるタイプ。',strength:'未来を明るく想像し、最初の一歩を踏み出す勇気があります。',recharge:'同じ景色が続くと疲れやすいので、小さな新体験が元気の源になります。',advice:'遠くへ行くだけが冒険ではありません。いつもの道を一本変えるだけでも十分。'},
{id:'punyuka_11',name:'柔軟チョウぷにゅか',image:ASSET+'final/11_flower_butterfly.webp',group:'kira',icon:'🦋',fx:'butterfly',aff:[68,52,58,65,96],core:'状況に合わせて形を変え、無理なく周囲になじむことが得意なタイプ。',strength:'予定外のことが起きても、その場に合うやり方へ自然に切り替えられます。',recharge:'変化が多かった日は、いつもの場所・いつもの習慣へ戻ると整います。',advice:'合わせられるからこそ、自分が本当はどうしたいかを時々確認してみよう。'},
{id:'punyuka_12',name:'閃ピクシーぷにゅか',image:ASSET+'final/12_inspiration_fairy.webp',group:'kira',icon:'✨',fx:'pixie',aff:[52,64,92,84,78],core:'突然つながる「ひらめき」を楽しみ、発想で世界を面白くするタイプ。',strength:'離れたもの同士を結びつけ、他の人が思いつかないアイデアを生み出せます。',recharge:'ぼんやりする時間や遊びが、次のアイデアを連れてきます。',advice:'ひらめきを全部完成させなくてOK。まずは一番わくわくする一つだけ形に。'},
{id:'punyuka_13',name:'猛進ドラゴぷにゅか',image:ASSET+'final/13_thunder_dragon.webp',group:'gira',icon:'⚡',fx:'thunder',aff:[42,98,62,40,45],core:'決めた瞬間から一気に動き、壁があっても突破しようとするタイプ。',strength:'迷いを行動で振り切る強さがあり、停滞した場面を動かせます。',recharge:'全力で走ったあとは、何もしない時間を意識して入れると次の力が戻ります。',advice:'速さは武器。大事な場面だけ、一度周りを見る一拍を入れるとさらに強くなります。'},
{id:'punyuka_14',name:'悪戯デビルぷにゅか',image:ASSET+'final/14_trick_devil.webp',group:'gira',icon:'😈',fx:'devil',aff:[45,76,88,55,86],core:'頭の回転と遊び心で、正面突破ではない面白い道を見つけるタイプ。',strength:'空気を読みながら機転を利かせ、退屈な状況にも楽しさを足せます。',recharge:'自由にふざけたり、くだらないことを楽しめる相手との時間が回復になります。',advice:'冗談が通じない場では少しだけ説明を足すと、あなたの魅力が誤解されにくくなります。'},
{id:'punyuka_15',name:'冷静ペンギぷにゅか',image:ASSET+'final/15_ice_penguin.webp',group:'gira',icon:'❄️',fx:'ice',aff:[48,48,72,42,70],core:'感情が大きく動く場面でも、一度整理してから判断できるタイプ。',strength:'焦りに巻き込まれにくく、周囲が混乱しているときほど落ち着いて考えられます。',recharge:'静かで予測できる時間を過ごすと、頭の中がきれいに整います。',advice:'冷静さの奥にある気持ちも、ときどき言葉にすると周りに伝わりやすくなります。'},
{id:'punyuka_16',name:'暁の不死鳥ぷにゅか',image:ASSET+'final/16_dawn_phoenix.webp',group:'gira',icon:'🔥',fx:'phoenix',aff:[60,78,54,72,90],core:'うまくいかない日があっても、時間をかけて何度でも立ち上がれるタイプ。',strength:'失敗や変化を自分の物語に変え、以前より強い形で戻ってくる粘りがあります。',recharge:'完全に止まる時間を怖がらないこと。休んでいる間にも次の朝は近づいています。',advice:'立ち直る速さを競わなくて大丈夫。あなたは「戻ってこられること」そのものが強さです。'}
];
const TYPE_MAP=Object.fromEntries(TYPES.map(t=>[t.id,t]));
const GROUP_IDS={fluffy:['punyuka_01','punyuka_02','punyuka_03','punyuka_04'],round:['punyuka_05','punyuka_06','punyuka_07','punyuka_08'],kira:['punyuka_09','punyuka_10','punyuka_11','punyuka_12'],gira:['punyuka_13','punyuka_14','punyuka_15','punyuka_16']};

const opt=(label,{stats={},hidden={},stage2={},stage3={},finalId=null}={})=>({label,stats,hidden,stage2,stage3,finalId});
const q=(id,text,options,meta={})=>({id,text,options,meta});

const BIRTH=[
q('birth1','森を歩いていると、小さな光の生き物が木の枝に引っかかっています。どうする？',[
  opt('まず助けてあげる',{stats:{kindness:3,action:1},hidden:{expressionLevel:1},stage2:{ear:.8}}),
  opt('少し離れて、どうして引っかかったのか見る',{stats:{curiosity:2,sensitivity:2},hidden:{decisionSpeed:-1,spaceNeed:1},stage2:{ear:.3,wing:.2}}),
  opt('光が飛んできた方向も気になる',{stats:{curiosity:3,action:1},hidden:{noveltyNeed:2},stage2:{wing:.8}})
]),
q('birth2','誰もいない古い塔で、壁の向こうから「コンコン」と音がします。',[
  opt('とりあえずノックを返す',{stats:{action:2,flexibility:1},hidden:{socialEnergy:1,decisionSpeed:1},stage2:{wing:.5,ear:.2}}),
  opt('壁の模様や音の間隔を調べる',{stats:{curiosity:3,sensitivity:1},hidden:{spaceNeed:1},stage2:{ear:.3,wing:.3}}),
  opt('入口を覚えておいて、いったん先へ進む',{stats:{flexibility:2,sensitivity:1},hidden:{decisionSpeed:-1,recoveryStyle:1},stage2:{ear:.5}})
]),
q('birth3','突然の雨で、持っていた地図の半分が読めなくなりました。',[
  opt('分かるところまで進んでみる',{stats:{action:3,curiosity:1},hidden:{decisionSpeed:2,noveltyNeed:1},stage2:{wing:.8}}),
  opt('いったん雨宿りして、残った地図を整理する',{stats:{sensitivity:1,flexibility:1},hidden:{spaceNeed:1,decisionSpeed:-2},stage2:{ear:.5}}),
  opt('近くの生き物に道を聞いてみる',{stats:{kindness:1,flexibility:3},hidden:{socialEnergy:2,expressionLevel:1},stage2:{ear:.6,wing:.2}})
]),
q('birth4','不思議な町のお祭りで、1時間だけ自由時間ができました。どこへ行く？',[
  opt('にぎやかな広場',{stats:{action:2,kindness:1},hidden:{socialEnergy:3,expressionLevel:2},stage2:{ear:.4,wing:.4}}),
  opt('細い路地の奥にある謎のお店',{stats:{curiosity:3,action:1},hidden:{noveltyNeed:3},stage2:{wing:.7}}),
  opt('少し離れた丘から町全体を眺める',{stats:{sensitivity:3,curiosity:1},hidden:{spaceNeed:2},stage2:{ear:.7}})
]),
q('birth5','泉の中から声がします。「ひとつだけ、見たいものを映してあげる」何を見る？',[
  opt('大切な人が笑っているところ',{stats:{kindness:3,sensitivity:1},hidden:{socialEnergy:1},stage2:{ear:.9}}),
  opt('まだ誰も知らない場所',{stats:{curiosity:3,action:1},hidden:{noveltyNeed:3},stage2:{wing:.9}}),
  opt('少し先の自分',{stats:{sensitivity:2,flexibility:1},hidden:{recoveryStyle:1},stage2:{ear:.2,wing:.4}})
])
];

const STAGE2_CORE=[
q('s2_1','旅の途中、小さな村で仲良くなった子に「もう少しいて」と言われました。',[
  opt('もう少し一緒にいる',{stats:{kindness:2,sensitivity:1},hidden:{socialEnergy:1},stage2:{ear:2.5}}),
  opt('また会う約束をして、まだ知らない場所へ進む',{stats:{action:2,curiosity:1},hidden:{noveltyNeed:2},stage2:{wing:2.5}})
]),
q('s2_2','魔法使いが、どちらか一つの部屋をくれるそうです。',[
  opt('暖炉と大きなソファのある小さな部屋',{stats:{kindness:1,sensitivity:2},hidden:{spaceNeed:1},stage2:{ear:2.5}}),
  opt('空まで見渡せる高い塔の部屋',{stats:{curiosity:2,action:1},hidden:{noveltyNeed:2},stage2:{wing:2.5}})
]),
q('s2_3','夜空に突然、知らない島へ続く光の橋が現れました。',[
  opt('まず町の人に、あの橋を知っているか聞く',{stats:{kindness:1,curiosity:1},hidden:{socialEnergy:1,decisionSpeed:-1},stage2:{ear:2.5}}),
  opt('消える前に渡ってみる',{stats:{action:3,curiosity:1},hidden:{decisionSpeed:2,noveltyNeed:2},stage2:{wing:2.5}})
])
];
const STAGE2_TIE=[
q('s2_tie_1','一日だけ魔法が使えます。どちらを選ぶ？',[
  opt('誰かの本当の気持ちが少し分かる魔法',{stats:{kindness:2,sensitivity:2},hidden:{expressionLevel:-1},stage2:{ear:3}}),
  opt('どこへでも飛んでいける魔法',{stats:{action:2,curiosity:2},hidden:{noveltyNeed:2},stage2:{wing:3}})
]),
q('s2_tie_2','旅のお守りを一つだけ選びます。',[
  opt('誰かが自分を想うと温かくなる石',{stats:{kindness:2,sensitivity:1},hidden:{socialEnergy:1},stage2:{ear:3}}),
  opt('まだ見ぬ場所が近づくと光る羽',{stats:{curiosity:2,action:1},hidden:{noveltyNeed:2},stage2:{wing:3}})
])
];
const STAGE2_FUN=[
q('s2_fun_1','しゃべる宝箱が言いました。「開けたければ、私を笑わせろ！」',[
  opt('全力で変なことをする',{stats:{action:2,flexibility:2},hidden:{expressionLevel:3,socialEnergy:1},stage2:{wing:.5}}),
  opt('宝箱の好みを聞き出す',{stats:{kindness:1,curiosity:2},hidden:{socialEnergy:1},stage2:{ear:.5}}),
  opt('そもそも鍵穴を探す',{stats:{curiosity:3},hidden:{decisionSpeed:-1},stage2:{ear:.2,wing:.2}})
]),
q('s2_fun_2','空飛ぶパンがあなたの朝ごはんを持って逃げました。',[
  opt('全力で追いかける',{stats:{action:3},hidden:{decisionSpeed:2,noveltyNeed:1},stage2:{wing:.6}}),
  opt('まあいいか、と別の朝ごはんを探す',{stats:{flexibility:3},hidden:{recoveryStyle:2},stage2:{ear:.2,wing:.2}}),
  opt('どこへ飛んでいくのか観察する',{stats:{curiosity:3,sensitivity:1},hidden:{spaceNeed:1},stage2:{ear:.5}})
])
];

const STAGE3_EAR=[
q('s3e_1','森で何かが動いた気がしました。',[
  opt('すぐ見に行く',{stats:{curiosity:2,action:2},hidden:{decisionSpeed:1},stage3:{a:2}}),
  opt('少し待って、もう一度音を聞く',{stats:{sensitivity:2,kindness:1},hidden:{decisionSpeed:-1},stage3:{b:2}})
]),
q('s3e_2','仲間の様子がいつもと少し違います。',[
  opt('すぐ声をかける',{stats:{kindness:2,action:1},hidden:{expressionLevel:1},stage3:{a:2}}),
  opt('必要そうなら助けられるよう、近くにいる',{stats:{kindness:3,sensitivity:1},hidden:{spaceNeed:1},stage3:{b:2}})
]),
q('s3e_3','不思議な本を見つけました。',[
  opt('ぱらぱらめくって、気になる場所から読む',{stats:{curiosity:3,flexibility:1},hidden:{noveltyNeed:1},stage3:{a:2}}),
  opt('最初からじっくり読む',{stats:{curiosity:2,sensitivity:1},hidden:{decisionSpeed:-1},stage3:{b:2}})
]),
q('s3e_4','旅の宿で好きな場所を選べます。',[
  opt('外の気配が分かる窓辺',{stats:{sensitivity:2,curiosity:1},hidden:{noveltyNeed:1},stage3:{a:2}}),
  opt('大きなクッションの真ん中',{stats:{kindness:1,flexibility:1},hidden:{spaceNeed:1,recoveryStyle:1},stage3:{b:2}})
]),
q('s3e_5','森の精霊から一つ力をもらえます。',[
  opt('小さな変化にすぐ気づく力',{stats:{sensitivity:3,curiosity:1},hidden:{expressionLevel:1},stage3:{a:3}}),
  opt('どんな時でも落ち着ける力',{stats:{flexibility:2,kindness:1},hidden:{recoveryStyle:2},stage3:{b:3}})
])
];
const STAGE3_WING=[
q('s3w_1','嵐で道が塞がれました。',[
  opt('別の道を探す',{stats:{flexibility:3,curiosity:1},hidden:{noveltyNeed:1},stage3:{a:2}}),
  opt('どうにかして道を開ける',{stats:{action:3},hidden:{decisionSpeed:2},stage3:{b:2}})
]),
q('s3w_2','仲間同士で意見が割れています。',[
  opt('両方を混ぜられないか考える',{stats:{flexibility:2,kindness:2},hidden:{socialEnergy:1},stage3:{a:2}}),
  opt('一度決めて進もうと言う',{stats:{action:2,kindness:1},hidden:{decisionSpeed:2},stage3:{b:2}})
]),
q('s3w_3','魔法の使い方を一つ覚えます。',[
  opt('姿や形を変える魔法',{stats:{flexibility:3,sensitivity:1},hidden:{noveltyNeed:1},stage3:{a:2}}),
  opt('強い壁を壊す魔法',{stats:{action:3},hidden:{decisionSpeed:2},stage3:{b:2}})
]),
q('s3w_4','突然、予定が全部変わりました。',[
  opt('それはそれで面白そう',{stats:{flexibility:3,curiosity:1},hidden:{recoveryStyle:2},stage3:{a:2}}),
  opt('新しい目標をすぐ決める',{stats:{action:3},hidden:{decisionSpeed:2},stage3:{b:2}})
]),
q('s3w_5','伝説の羽を一枚選びます。',[
  opt('光の色が毎日変わる羽',{stats:{sensitivity:2,flexibility:2},hidden:{noveltyNeed:1},stage3:{a:3}}),
  opt('雷の中でも燃え続ける羽',{stats:{action:3,flexibility:1},hidden:{recoveryStyle:2},stage3:{b:3}})
])
];

const FINAL_CORE={
fluffy:[
q('f_fluffy_1','知らない町へ着いたら、最初に気になるのは？',[
  opt('困っている人がいないか',{stats:{kindness:2},finalId:'punyuka_01'}),opt('人が集まっている楽しそうな場所',{stats:{action:2},hidden:{socialEnergy:2},finalId:'punyuka_02'}),opt('見たことのない店や路地',{stats:{curiosity:2},hidden:{noveltyNeed:2},finalId:'punyuka_03'}),opt('町全体の様子や人の流れ',{stats:{sensitivity:2},finalId:'punyuka_04'})]),
q('f_fluffy_2','友達が「大丈夫」と言っています。でも、少しだけ様子が違います。',[
  opt('そっと気遣う',{stats:{kindness:3},finalId:'punyuka_01'}),opt('笑わせたり外へ誘ったりする',{stats:{action:2},hidden:{expressionLevel:2},finalId:'punyuka_02'}),opt('何があったのか素直に聞いてみる',{stats:{curiosity:2,kindness:1},finalId:'punyuka_03'}),opt('今は聞かない方がいいか、少し観察する',{stats:{sensitivity:3},finalId:'punyuka_04'})]),
q('f_fluffy_3','道端で魔法の鍵を拾いました。',[
  opt('落とした人を探す',{stats:{kindness:3},finalId:'punyuka_01'}),opt('みんなに見せて情報を集める',{stats:{action:1,kindness:1},hidden:{socialEnergy:2},finalId:'punyuka_02'}),opt('何が開く鍵なのか試したい',{stats:{curiosity:3},finalId:'punyuka_03'}),opt('傷や模様から持ち主や用途を推理する',{stats:{curiosity:2,sensitivity:2},finalId:'punyuka_04'})]),
q('f_fluffy_4','お祭りの途中で、突然音楽が止まりました。',[
  opt('困っている係の人を手伝う',{stats:{kindness:2,action:1},finalId:'punyuka_01'}),opt('自分が声を出して場をつなぐ',{stats:{action:2},hidden:{expressionLevel:3},finalId:'punyuka_02'}),opt('何が起きたのか裏側を見に行く',{stats:{curiosity:3},finalId:'punyuka_03'}),opt('音・人の動きから原因を考える',{stats:{sensitivity:2,curiosity:1},finalId:'punyuka_04'})])
],
round:[
q('f_round_1','魔王の城へ着いたら、魔王が方向音痴で泣いていました。',[
  opt('帰り道を一緒に考えてあげる',{stats:{kindness:3},finalId:'punyuka_05'}),opt('「まあ何とかなるよ」と励ます',{stats:{flexibility:3},hidden:{recoveryStyle:2},finalId:'punyuka_06'}),opt('魔王が迷子になる物語を想像してしまう',{stats:{sensitivity:3},finalId:'punyuka_07'}),opt('どうして自分の城で迷うのか構造を調べたい',{stats:{curiosity:3},finalId:'punyuka_08'})]),
q('f_round_2','長い旅の夜。焚き火のそばで何をしていそう？',[
  opt('みんなの食事や毛布を気にする',{stats:{kindness:3},finalId:'punyuka_05'}),opt('今日あった面白い失敗を笑い話にする',{stats:{flexibility:2},hidden:{recoveryStyle:2},finalId:'punyuka_06'}),opt('火を見ながら空想にふける',{stats:{sensitivity:3},finalId:'punyuka_07'}),opt('明日のルートや星の位置を調べる',{stats:{curiosity:3},finalId:'punyuka_08'})]),
q('f_round_3','一冊だけ持ち帰れる不思議な本があります。',[
  opt('みんなの役に立つ生活の本',{stats:{kindness:2},finalId:'punyuka_05'}),opt('読むと少し元気になれる本',{stats:{flexibility:2},finalId:'punyuka_06'}),opt('夢の中の世界が描かれた本',{stats:{sensitivity:3},finalId:'punyuka_07'}),opt('世界の謎が細かく書かれた本',{stats:{curiosity:3},finalId:'punyuka_08'})]),
q('f_round_4','4人で宝探しをするとしたら、自然とどの役になりそう？',[
  opt('みんなを支えるまとめ役',{stats:{kindness:2,action:1},finalId:'punyuka_05'}),opt('失敗しても空気を明るくする役',{stats:{flexibility:2},hidden:{socialEnergy:1},finalId:'punyuka_06'}),opt('変わったアイデアを想像する役',{stats:{sensitivity:2,curiosity:1},finalId:'punyuka_07'}),opt('手がかりを徹底的に調べる役',{stats:{curiosity:3},finalId:'punyuka_08'})])
],
kira:[
q('f_kira_1','空に突然、逆さまの城が現れました。最初に思うのは？',[
  opt('中に困っている人はいないかな',{stats:{kindness:3},finalId:'punyuka_09'}),opt('行けるなら今すぐ行ってみたい',{stats:{action:3,curiosity:1},finalId:'punyuka_10'}),opt('どうすれば安全に入れるか状況に合わせて考える',{stats:{flexibility:3},finalId:'punyuka_11'}),opt('普通じゃない入り方を思いつきたい',{stats:{curiosity:3,sensitivity:1},finalId:'punyuka_12'})]),
q('f_kira_2','迷子の星が一つ、あなたの手のひらに落ちてきました。',[
  opt('安心するまでそばにいてあげる',{stats:{kindness:3},finalId:'punyuka_09'}),opt('一緒に空まで帰る方法を探しに行く',{stats:{action:2,curiosity:1},finalId:'punyuka_10'}),opt('その星に合う帰り方をいくつか試す',{stats:{flexibility:3},finalId:'punyuka_11'}),opt('星を飛ばす新しい道具を思いつく',{stats:{curiosity:3},finalId:'punyuka_12'})]),
q('f_kira_3','魔法工房で一日だけ自由に作れます。',[
  opt('疲れた人が休めるもの',{stats:{kindness:3},finalId:'punyuka_09'}),opt('遠くまで飛んでいけるもの',{stats:{action:2,curiosity:1},finalId:'punyuka_10'}),opt('どんな場面にも形を変えられるもの',{stats:{flexibility:3},finalId:'punyuka_11'}),opt('誰も用途を思いつかない変なもの',{stats:{curiosity:3,sensitivity:1},finalId:'punyuka_12'})]),
q('f_kira_4','晴れの予定だったのに、急に虹色の雨が降ってきました。',[
  opt('濡れて困っている人へ傘を差し出す',{stats:{kindness:3},finalId:'punyuka_09'}),opt('せっかくなので雨の中を走ってみる',{stats:{action:3},finalId:'punyuka_10'}),opt('予定を変えて雨でも楽しめる方法を探す',{stats:{flexibility:3},finalId:'punyuka_11'}),opt('虹色の雨で何ができるか試したくなる',{stats:{curiosity:3},finalId:'punyuka_12'})])
],
gira:[
q('f_gira_1','100回やっても開かない扉があります。',[
  opt('もっと力を込めて突破口を探す',{stats:{action:3},finalId:'punyuka_13'}),opt('「実は引くんじゃない？」と別の手を試す',{stats:{curiosity:2,flexibility:2},finalId:'punyuka_14'}),opt('そもそも扉なのか、仕組みを確認する',{stats:{curiosity:2},hidden:{decisionSpeed:-1},finalId:'punyuka_15'}),opt('101回目も試す',{stats:{flexibility:2,action:1},hidden:{recoveryStyle:3},finalId:'punyuka_16'})]),
q('f_gira_2','目の前で橋が崩れました。向こう側へ行く必要があります。',[
  opt('すぐ別の突破方法を探して動く',{stats:{action:3},finalId:'punyuka_13'}),opt('何か面白い抜け道がないか探す',{stats:{curiosity:2,flexibility:1},finalId:'punyuka_14'}),opt('地形と残った材料を確認してから決める',{stats:{curiosity:2,sensitivity:1},finalId:'punyuka_15'}),opt('時間がかかっても、渡れる形になるまで続ける',{stats:{flexibility:2},hidden:{recoveryStyle:3},finalId:'punyuka_16'})]),
q('f_gira_3','強い相手との勝負。あなたに近いのは？',[
  opt('先に仕掛けて流れを作る',{stats:{action:3},finalId:'punyuka_13'}),opt('相手の予想外のことをする',{stats:{curiosity:2,flexibility:1},finalId:'punyuka_14'}),opt('相手の動きを見てから最善手を選ぶ',{stats:{sensitivity:1,curiosity:2},finalId:'punyuka_15'}),opt('何度失敗しても攻略法が見えるまで続ける',{stats:{flexibility:2},hidden:{recoveryStyle:3},finalId:'punyuka_16'})]),
q('f_gira_4','大きな挑戦に失敗しました。翌日どうしていそう？',[
  opt('すぐ次の挑戦を始める',{stats:{action:3},finalId:'punyuka_13'}),opt('失敗をネタにして別ルートを思いつく',{stats:{curiosity:2,flexibility:2},finalId:'punyuka_14'}),opt('原因を整理して、同じ失敗を避ける',{stats:{curiosity:2},hidden:{decisionSpeed:-1},finalId:'punyuka_15'}),opt('休んでも、また戻ってくる',{stats:{flexibility:2},hidden:{recoveryStyle:3},finalId:'punyuka_16'})])
]};

const pq=(id,a,b,text,la,lb,sa={},sb={},ha={},hb={})=>q(id,text,[opt(la,{stats:sa,hidden:ha,finalId:a}),opt(lb,{stats:sb,hidden:hb,finalId:b})],{pairKey:[a,b].sort().join('|')});
const FINAL_PAIR={
fluffy:[
pq('p01_02','punyuka_01','punyuka_02','落ち込んでいる仲間がいたら？','静かにそばにいて、必要なことを手伝う','外へ誘ったり笑わせたりして元気づける',{kindness:3},{action:2,kindness:1},{spaceNeed:1},{socialEnergy:2,expressionLevel:2}),
pq('p01_03','punyuka_01','punyuka_03','知らない子が一人で困っています。','まず「大丈夫？」と声をかける','何に困っているのか、状況を詳しく聞く',{kindness:3},{curiosity:2,kindness:1}),
pq('p01_04','punyuka_01','punyuka_04','友達の言葉に少し違和感がありました。','傷ついていないかを気にかける','なぜそう言ったのか、背景を考える',{kindness:3},{sensitivity:2,curiosity:1}),
pq('p02_03','punyuka_02','punyuka_03','新しい遊びを見つけたときは？','誰かを誘って一緒に盛り上がりたい','まず自分で触って試してみたい',{action:2},{curiosity:3},{socialEnergy:2},{noveltyNeed:2}),
pq('p02_04','punyuka_02','punyuka_04','初対面の集まりに入るなら？','まず話しかけて空気を作る','しばらく周りを見てから話す',{action:2},{sensitivity:2},{socialEnergy:3,expressionLevel:2},{spaceNeed:2}),
pq('p03_04','punyuka_03','punyuka_04','知らない機械を見つけました。','触って確かめたい','まず仕組みを予想したい',{curiosity:3,action:1},{curiosity:2,sensitivity:2},{noveltyNeed:2},{decisionSpeed:-1})],
round:[
pq('p05_06','punyuka_05','punyuka_06','仲間が失敗して落ち込んでいます。','次はうまくいくよう一緒に準備する','「そんな日もある！」と気分を切り替える',{kindness:3,action:1},{flexibility:3},{},{recoveryStyle:2}),
pq('p05_07','punyuka_05','punyuka_07','休日に頼まれごとが一つあります。','まず終わらせて安心したい','少し自分の世界に浸ってから動きたい',{action:2,kindness:1},{sensitivity:3},{decisionSpeed:1},{spaceNeed:2}),
pq('p05_08','punyuka_05','punyuka_08','壊れた道具を前にしたら？','使えるように直すことを優先する','なぜ壊れたのか仕組みを調べる',{action:2,kindness:1},{curiosity:3}),
pq('p06_07','punyuka_06','punyuka_07','長い待ち時間ができました。','何か楽しいことを見つける','ぼんやり空想して過ごす',{flexibility:3},{sensitivity:3},{recoveryStyle:2},{spaceNeed:1}),
pq('p06_08','punyuka_06','punyuka_08','分からないことが一つあります。','必要になったら調べればいいと思う','気になって今すぐ調べたくなる',{flexibility:2},{curiosity:3},{recoveryStyle:1},{noveltyNeed:1}),
pq('p07_08','punyuka_07','punyuka_08','星空を見ているとき、近いのは？','星の向こうの物語を想像する','星がどう動いているのか知りたくなる',{sensitivity:3},{curiosity:3})],
kira:[
pq('p09_10','punyuka_09','punyuka_10','誰かが不安そうに新しい場所へ向かいます。','安心できるよう一緒に歩く','「行ってみよう！」と背中を押す',{kindness:3},{action:3},{socialEnergy:1},{noveltyNeed:2}),
pq('p09_11','punyuka_09','punyuka_11','友達の予定が急に変わりました。','まず気持ちを聞く','すぐ新しい予定を一緒に考える',{kindness:3},{flexibility:3}),
pq('p09_12','punyuka_09','punyuka_12','困っている人へ贈る魔法なら？','心が少し軽くなる魔法','思わず笑うような不思議な魔法',{kindness:3},{curiosity:2,sensitivity:1},{},{expressionLevel:2}),
pq('p10_11','punyuka_10','punyuka_11','知らない道が三つあります。','一番わくわくする道を選ぶ','状況を見ながら進みやすい道へ変える',{action:2,curiosity:2},{flexibility:3},{noveltyNeed:2},{}),
pq('p10_12','punyuka_10','punyuka_12','空飛ぶ乗り物を作るなら？','どこまでも行ける速い乗り物','見たことのない変な仕組みの乗り物',{action:2,curiosity:1},{curiosity:3,sensitivity:1},{noveltyNeed:2},{noveltyNeed:2}),
pq('p11_12','punyuka_11','punyuka_12','予定通りにいかないとき。','今あるものを使って別の形に整える','全然違う方法を思いつくまで遊んでみる',{flexibility:3},{curiosity:3,flexibility:1})],
gira:[
pq('p13_14','punyuka_13','punyuka_14','難しいゲームで詰まりました。','とにかくもう一回挑戦する','ルールの穴みたいな変な攻略法を探す',{action:3},{curiosity:2,flexibility:2},{decisionSpeed:2},{noveltyNeed:2}),
pq('p13_15','punyuka_13','punyuka_15','緊急事態が起きました。','まず動いて状況を変える','情報を集めて優先順位を決める',{action:3},{curiosity:1,sensitivity:1},{decisionSpeed:3},{decisionSpeed:-1}),
pq('p13_16','punyuka_13','punyuka_16','大きな壁にぶつかったとき。','今の勢いのまま突破口を作る','一度止まっても、時間をかけて必ず戻る',{action:3},{flexibility:2,action:1},{decisionSpeed:2},{recoveryStyle:3}),
pq('p14_15','punyuka_14','punyuka_15','怪しい箱を見つけました。','わざと変な角度から開けてみる','罠がないか確認してから開ける',{curiosity:2,flexibility:1},{curiosity:1,sensitivity:1},{noveltyNeed:2},{decisionSpeed:-2}),
pq('p14_16','punyuka_14','punyuka_16','失敗が続いて空気が重いとき。','一回ふざけて流れを変える','今日は休んでも、また明日続ける',{flexibility:2},{flexibility:2,sensitivity:1},{expressionLevel:2},{recoveryStyle:3}),
pq('p15_16','punyuka_15','punyuka_16','長期戦になりそうです。','無理のない計画を立てて淡々と進む','止まる日があっても最後まで戻り続ける',{curiosity:1,flexibility:1},{flexibility:2,action:1},{decisionSpeed:-1},{recoveryStyle:3})]
};

let answers=[],qIndex=0,backHandler=null,audioContext=null;
let soundEnabled=localStorage.getItem(SOUND_KEY)!=='off';
let soundVolume=clamp(Number(localStorage.getItem(SOUND_VOLUME_KEY)||1),0,1.5);
const SFX_BOOST=18.0;

function ensureAudio(){
  if(!soundEnabled)return null;
  try{if(!audioContext)audioContext=new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();return audioContext}catch{return null}
}
function tone(freq,duration=.09,type='sine',volume=.03,delay=0,endFreq=null){
  const ctx=ensureAudio();if(!ctx)return;const now=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);if(endFreq)osc.frequency.exponentialRampToValueAtTime(Math.max(40,endFreq),now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,Math.min(1.65,volume*soundVolume*SFX_BOOST)),now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+duration+.04)
}
function noise(duration=.18,volume=.012,delay=0){const ctx=ensureAudio();if(!ctx)return;const len=Math.max(1,Math.floor(ctx.sampleRate*duration)),buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();src.buffer=buf;filter.type='bandpass';filter.frequency.value=1300;gain.gain.value=Math.min(1.45,volume*soundVolume*SFX_BOOST);src.connect(filter).connect(gain).connect(ctx.destination);src.start(ctx.currentTime+delay)}

function playTapSample(volume=.95,rate=1){
  if(!soundEnabled)return;
  try{
    const base=document.getElementById('tapSound');
    if(!base)return;
    const a=base.cloneNode(true);
    a.volume=Math.max(0,Math.min(1,volume));
    a.playbackRate=rate;
    a.currentTime=0;
    const p=a.play();
    if(p&&typeof p.catch==='function')p.catch(()=>{});
    setTimeout(()=>{try{a.pause();a.removeAttribute('src');a.load()}catch(_){}},900);
  }catch(_){}
}

function softSquish(){
  const ctx=ensureAudio();if(!ctx)return;
  if(soundVolume<=.01)return;
  const now=ctx.currentTime;

  // Smartphone speakers lose the old 90–170 Hz body almost completely.
  // Move the main "ぷにっ" into the audible low-mid range, then add a tiny soft rebound.
  const master=ctx.createGain(),comp=ctx.createDynamicsCompressor();
  const v=Math.min(1,.72*soundVolume);
  master.gain.setValueAtTime(v,now);
  comp.threshold.setValueAtTime(-18,now);comp.knee.setValueAtTime(12,now);comp.ratio.setValueAtTime(4,now);comp.attack.setValueAtTime(.003,now);comp.release.setValueAtTime(.11,now);
  master.connect(comp).connect(ctx.destination);

  const body=ctx.createOscillator(),bg=ctx.createGain();
  body.type='sine';
  body.frequency.setValueAtTime(360,now);
  body.frequency.exponentialRampToValueAtTime(185,now+.15);
  bg.gain.setValueAtTime(.0001,now);
  bg.gain.linearRampToValueAtTime(.54,now+.010);
  bg.gain.exponentialRampToValueAtTime(.0001,now+.18);
  body.connect(bg).connect(master);body.start(now);body.stop(now+.19);

  const soft=ctx.createOscillator(),sg=ctx.createGain();
  soft.type='triangle';
  soft.frequency.setValueAtTime(610,now+.018);
  soft.frequency.exponentialRampToValueAtTime(300,now+.115);
  sg.gain.setValueAtTime(.0001,now+.015);
  sg.gain.linearRampToValueAtTime(.28,now+.030);
  sg.gain.exponentialRampToValueAtTime(.0001,now+.135);
  soft.connect(sg).connect(master);soft.start(now+.015);soft.stop(now+.145);

  // Cute elastic return: short and round, not a sharp click.
  const bounce=ctx.createOscillator(),rg=ctx.createGain();
  bounce.type='sine';
  bounce.frequency.setValueAtTime(275,now+.075);
  bounce.frequency.exponentialRampToValueAtTime(430,now+.145);
  rg.gain.setValueAtTime(.0001,now+.070);
  rg.gain.linearRampToValueAtTime(.22,now+.086);
  rg.gain.exponentialRampToValueAtTime(.0001,now+.165);
  bounce.connect(rg).connect(master);bounce.start(now+.07);bounce.stop(now+.175);

  // A little soft "p" texture so the sound reads as ぷにっ even on a phone speaker.
  const len=Math.max(1,Math.floor(ctx.sampleRate*.065));
  const buf=ctx.createBuffer(1,len,ctx.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<len;i++){const env=1-i/len;data[i]=(Math.random()*2-1)*env*.34}
  const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),ng=ctx.createGain();
  src.buffer=buf;hp.type='highpass';hp.frequency.value=260;lp.type='lowpass';lp.frequency.value=1500;
  ng.gain.setValueAtTime(.16,now);ng.gain.exponentialRampToValueAtTime(.0001,now+.07);
  src.connect(hp).connect(lp).connect(ng).connect(master);src.start(now);src.stop(now+.07);
}
const sfx={
  open(){tone(620,.08,'sine',.018);tone(930,.12,'sine',.015,.05)},
  choice(){playTapSample(.62,1.06);tone(540,.065,'sine',.026);tone(720,.09,'triangle',.020,.035)},
  next(){playTapSample(.48,1.12);tone(470,.08,'sine',.020,0,650)},
  back(){playTapSample(.42,.94);tone(420,.09,'triangle',.020,0,280)},
  squish(){softSquish()},
  sparkle(){[880,1175,1568].forEach((f,i)=>tone(f,.16,'sine',.018,i*.055))},
  birth(){playTapSample(.92,.72);noise(.65,.026);[392,523,659,784,1047].forEach((f,i)=>tone(f,.42,'sine',.045,i*.09));tone(1318,.65,'sine',.032,.42,1760)},
  evolve(){playTapSample(.86,.78);noise(.45,.022);tone(240,.45,'triangle',.03,0,680);[523,659,784,1047].forEach((f,i)=>tone(f,.28,'sine',.032,.18+i*.07));},
  final(){playTapSample(1,.68);noise(.8,.032);tone(180,.75,'triangle',.035,0,920);[392,523,659,784,1047,1318].forEach((f,i)=>tone(f,.42,'sine',.052,.18+i*.09));tone(1760,.9,'sine',.035,.7,2460)},
  result(){playTapSample(.62,1.18);[659,784,988].forEach((f,i)=>tone(f,.22,'sine',.022,i*.065))}
};

function addMap(target,src){Object.entries(src||{}).forEach(([k,v])=>{target[k]=(target[k]||0)+(Number(v)||0)})}
function stage2Scores(){const out={ear:0,wing:0};answers.forEach(a=>addMap(out,a?.stage2));return out}
function stage2(){if(answers.length<10)return null;const s=stage2Scores();return s.ear>=s.wing?'ear':'wing'}
function stage3Direct(){const out={a:0,b:0};answers.slice(10,15).forEach(a=>addMap(out,a?.stage3));return out}
function stats(){const out=Object.fromEntries(AXES.map(k=>[k,50]));answers.forEach(a=>addMap(out,a?.stats));AXES.forEach(k=>out[k]=clamp(Math.round(out[k]),20,90));return out}
function hidden(){const out=Object.fromEntries(HIDDEN.map(k=>[k,50]));answers.forEach(a=>addMap(out,a?.hidden));HIDDEN.forEach(k=>out[k]=clamp(Math.round(out[k]),20,90));return out}
function stage3(){
  if(answers.length<15)return null;const d=stage3Direct(),st=stats(),s2=stage2();
  let a=d.a,b=d.b;
  if(s2==='ear'){a+=(st.curiosity+st.sensitivity+st.action)/450;b+=(st.kindness+st.flexibility+(100-st.action))/450;return a>=b?'fluffy':'round'}
  a+=(st.kindness+st.sensitivity+st.flexibility)/450;b+=(st.action+st.curiosity+(100-st.kindness))/450;return a>=b?'kira':'gira'
}
function finalScores(){const ids=GROUP_IDS[stage3()]||[],out=Object.fromEntries(ids.map(id=>[id,0]));answers.slice(15).forEach(a=>{if(a?.finalId in out)out[a.finalId]+=2});return out}
function typeDistance(t,st){return AXES.reduce((sum,k,i)=>sum+Math.abs((st[k]??50)-t.aff[i]),0)}
function finalType(){
  if(answers.length<25)return null;const scores=finalScores(),st=stats(),ids=Object.keys(scores);ids.sort((a,b)=>scores[b]-scores[a]||typeDistance(TYPE_MAP[a],st)-typeDistance(TYPE_MAP[b],st)||a.localeCompare(b));return TYPE_MAP[ids[0]]||null
}
function currentForm(){
  if(qIndex<5)return null;
  if(qIndex<10)return FORMS.stage1_base;
  if(qIndex<15)return stage2()==='ear'?FORMS.stage2_ear:FORMS.stage2_wing;
  const s3=stage3();return s3==='fluffy'?FORMS.stage3_01_fluffy_ear:s3==='round'?FORMS.stage3_02_round_ear:s3==='kira'?FORMS.stage3_03_kira_wing:FORMS.stage3_04_gira_wing
}
function pairQuestion(){
  const group=stage3(),bank=FINAL_PAIR[group]||[],used=new Set(answers.slice(19).map(a=>a?.meta?.pairKey).filter(Boolean)),scores=finalScores(),rank=Object.keys(scores).sort((a,b)=>scores[b]-scores[a]);
  const top=new Set(rank.slice(0,2));
  const candidates=bank.filter(x=>!used.has(x.meta.pairKey));
  candidates.sort((x,y)=>{
    const [xa,xb]=x.meta.pairKey.split('|'),[ya,yb]=y.meta.pairKey.split('|');
    const xp=(top.has(xa)&&top.has(xb)?100:0)+(top.has(xa)||top.has(xb)?20:0)-Math.abs((scores[xa]||0)-(scores[xb]||0));
    const yp=(top.has(ya)&&top.has(yb)?100:0)+(top.has(ya)||top.has(yb)?20:0)-Math.abs((scores[ya]||0)-(scores[yb]||0));
    return yp-xp||x.id.localeCompare(y.id)
  });
  return candidates[0]||bank[0]
}
function currentQuestion(){
  if(qIndex<5)return BIRTH[qIndex];
  if(qIndex<8)return STAGE2_CORE[qIndex-5];
  if(qIndex<10){const s=stage2Scores(),gap=Math.abs(s.ear-s.wing);return (gap<2.2?STAGE2_TIE:STAGE2_FUN)[qIndex-8]}
  if(qIndex<15)return (stage2()==='ear'?STAGE3_EAR:STAGE3_WING)[qIndex-10];
  if(qIndex<19)return FINAL_CORE[stage3()][qIndex-15];
  if(qIndex<25)return pairQuestion();
  return null
}
function chapter(){if(qIndex<5)return['誕生編','ぷにゅかが生まれるまで',1];if(qIndex<10)return['進化編Ⅰ','はじめての進化',2];if(qIndex<15)return['進化編Ⅱ','こころの形',3];return['最終進化編','あなたらしさの核心',4]}
function milestoneText(){if(qIndex<5)return`あと${5-qIndex}問でぷにゅか誕生`;if(qIndex<10)return`あと${10-qIndex}問で進化`;if(qIndex<15)return`あと${15-qIndex}問でさらに進化`;return`あと${25-qIndex}問で最終進化`}
function saveProgress(){write(PROGRESS_KEY,{schema:'punyako-v4',answers,qIndex,updatedAt:Date.now()})}
function loadProgress(){const p=read(PROGRESS_KEY,null);if(!p||!Array.isArray(p.answers)||p.schema!=='punyako-v4')return false;answers=p.answers.slice(0,25);qIndex=clamp(Number(p.qIndex)??answers.length,0,25);if(qIndex!==answers.length)qIndex=answers.length;return answers.length>0}
function clearProgress(){localStorage.removeItem(PROGRESS_KEY)}
function activeResult(){return read(RESULT_KEY,null)}
function localJourney(){return read(JOURNEY_KEY,null)||member()?.punyakoJourney||null}
function formById(id){return FORMS[id]||TYPE_MAP[id]||null}
function setLocalJourney(payload){
  const current=localJourney()||{},next={...current,...payload,updatedAtMs:Date.now()};write(JOURNEY_KEY,next);const m=member();if(m){write(MEMBER_KEY,{...m,punyakoJourney:next})}window.dispatchEvent(new CustomEvent('unica:punyako-avatar-updated',{detail:next}));return next
}
async function saveJourney(info,completedQuestions,{seedComplete=true}={}){
  if(!info)return null;const payload=setLocalJourney({seedComplete,equippedId:info.id,equippedImage:info.image,equippedName:info.name,currentStage:info.stage||'final',completedQuestions,seedCompletedAtMs:seedComplete?(localJourney()?.seedCompletedAtMs||Date.now()):0});
  try{for(let i=0;i<40&&!window.UNICA_FIREBASE?.savePunyakoJourney;i++)await new Promise(r=>setTimeout(r,100));await window.UNICA_FIREBASE?.savePunyakoJourney?.(payload)}catch(e){console.warn('ぷにゅか進化データのオンライン保存に失敗',e)}
  return payload
}
function updateHome(){
  const result=activeResult(),journey=localJourney(),summary=$('#scent16HomeSummary'),cta=$('#scent16HomeCta');
  if(summary){if(result?.typeId)summary.textContent=`${TYPE_MAP[result.typeId]?.name||'最終ぷにゅか'}に進化済み`;else if(journey?.seedComplete)summary.textContent=`${journey.equippedName||'ぷにゅか'}を育てています。`;else summary.textContent='まず5問で、ぷにゅか誕生！'}
  if(cta)cta.textContent=result?.typeId?'結果を見る':journey?.seedComplete?'続きを育てる':'5問診断をする';
  document.querySelectorAll('[data-status-for="scent"]').forEach(el=>el.textContent=result?.typeId?'最終進化済み':journey?.seedComplete?`育成中 ${journey.completedQuestions||5}/25`:'5問で誕生')
}
async function saveActive(result){
  write(RESULT_KEY,result);const by=read(ACTIVE_BY_TYPE_KEY,{});by[result.typeId]=result;write(ACTIVE_BY_TYPE_KEY,by);const t=TYPE_MAP[result.typeId];if(t)await saveJourney({...t,stage:'final'},25);
  try{for(let i=0;i<40&&!window.UNICA_FIREBASE?.saveScentDiagnosis;i++)await new Promise(r=>setTimeout(r,100));await window.UNICA_FIREBASE?.saveScentDiagnosis?.(result)}catch(e){console.warn('ぷにゅか診断のオンライン保存に失敗',e)}
  updateHome();window.dispatchEvent(new CustomEvent('unica:punyako-diagnosis-complete',{detail:result}))
}
function addHistory(result){const h=read(HISTORY_KEY,[]);if(!h.some(x=>x.runId===result.runId))h.unshift(result);write(HISTORY_KEY,h.slice(0,50))}
function makeResult(){const t=finalType(),st=stats(),hd=hidden();return{schema:'punyako-v4',runId:'pk4_'+Date.now().toString(36),typeId:t.id,typeImage:t.image,flower:t.icon,scentName:t.name,flowerMeaning:t.core,stats:st,hidden:hd,diagnosedDate:today(),message:`${t.name}。${t.core}`,route:{stage2:stage2(),stage3:stage3()},answers:[...answers],createdAt:Date.now()}}

function open(){if(!member()){document.getElementById('openMemberGate')?.click();return}sfx.open();modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open');showIntro()}
function close(){modal.classList.remove('is-open','is-punyako-game-intro');modal.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open');backHandler=null}
function setBack(fn){backHandler=fn;const b=$('#scent16NavBack');if(b)b.style.visibility=fn?'visible':'hidden'}
function headerBack(){sfx.back();if(backHandler)return backHandler();close()}
function charHtml(info,extra=''){if(!info)return'';return`<button class="punyako-character ${extra}" id="punyakoCharacter" type="button" aria-label="${esc(info.name)}をぷにぷにする"><span class="punyako-tap-guide" aria-hidden="true"><i>☝</i><b>ぷにっとタップ！</b></span><span class="punyako-character-glow"></span><img src="${esc(info.image)}" alt="${esc(info.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="punyako-img-fallback">✦</span><small>${esc(info.name)}</small></button>`}
function bindSquish(){const el=$('#punyakoCharacter');if(!el)return;el.onclick=()=>{sfx.squish();el.classList.remove('is-tapped');void el.offsetWidth;el.classList.add('is-tapped');const guide=el.querySelector('.punyako-tap-guide');if(guide){guide.classList.add('is-popped');const label=guide.querySelector('b');if(label)label.textContent='ぷにっ♪';setTimeout(()=>{guide.classList.remove('is-popped');if(label)label.textContent='ぷにっとタップ！'},720)}setTimeout(()=>el.classList.remove('is-tapped'),520)}}
function soundButton(){return`<button class="punyako-sound" id="punyakoSound" type="button" aria-label="効果音のオンオフ">${soundEnabled?'🔊':'🔇'}</button>`}
function bindSound(){const b=$('#punyakoSound');if(!b)return;b.onclick=()=>{soundEnabled=!soundEnabled;localStorage.setItem(SOUND_KEY,soundEnabled?'on':'off');b.textContent=soundEnabled?'🔊':'🔇';if(soundEnabled){ensureAudio();sfx.sparkle()}}}
function particleHtml(symbols=['✦','·','✧'],count=28){return`<div class="punyako-fx-particles" aria-hidden="true">${Array.from({length:count},(_,i)=>`<i style="--i:${i};--x:${(i*37)%100}%;--d:${(i%7)*.08}s">${symbols[i%symbols.length]}</i>`).join('')}</div>`}

function showIntro(){
  loadProgress();updateHome();setBack(null);modal.classList.add('is-punyako-game-intro');
  const result=activeResult(),journey=localJourney(),form=journey?.seedComplete?formById(journey.equippedId):null;
  const progress=qIndex>0&&qIndex<25?qIndex:0;
  const hero=form?charHtml(form):`<div class="punyako-before-birth punyako-summon-orb"><span>?</span><small>UNKNOWN PUNYUKA</small></div>`;
  const mainTitle=journey?.seedComplete?'この子を、最終進化まで育てよう':'答えるたび、あなたのぷにゅかが育つ';
  const mainLead=journey?.seedComplete?'診断の続きで姿が変わり、最後にあなたの性格がひとつのぷにゅかになります。':'最初の5問で誕生。25問の最後には、あなたの性格を映した最終ぷにゅかへ進化します。';
  screen.className='scent16-screen punyako-screen punyako-intro-bg punyako-game-intro';
  screen.innerHTML=`
    <div class="punyako-game-shell">
      <div class="punyako-game-stars" aria-hidden="true">${particleHtml(['✦','·','✧'],20)}</div>
      <div class="punyako-game-hud">
        <div><small>PUNYUKA QUEST</small><strong>ぷにゅか診断</strong></div>
        ${soundButton()}
      </div>

      <section class="punyako-game-hero">
        <div class="punyako-game-tag"><i></i> PERSONALITY ADVENTURE</div>
        ${hero}
        <h3>${mainTitle}</h3>
        <p>${mainLead}</p>
      </section>

      <section class="punyako-game-mission">
        <div class="punyako-game-mission-head"><span>LIMITED MISSION</span><b>♪ RELEASE CHALLENGE</b></div>
        <div class="punyako-game-mission-copy">
          <span class="punyako-game-music-icon">🎹</span>
          <div><small>5問参加 × 30人達成で</small><strong>「ミルクの匂い - 弾き語り ver.」<br>RELEASE決定！</strong></div>
        </div>
        <div class="punyako-game-meter"><div><span id="punyakoWorldCount">人数を集計中…</span><b>30</b></div><i><u id="punyakoMissionBar"></u></i></div>
      </section>

      <section class="punyako-game-rewards">
        <div class="punyako-game-section-title"><small>QUEST REWARDS</small><strong>この診断でできること</strong></div>
        <div class="punyako-game-reward-grid">
          <article class="is-now"><em>Q5</em><span>🐾</span><b>ぷにゅか誕生</b><small>参加完了＋アイコンGET</small></article>
          <article><em>Q25</em><span>✨</span><b>最終ぷにゅかGET</b><small>アイコンも最終進化</small></article>
          <article class="is-unlock"><em>UNLOCK</em><span>💞</span><b>性格＆相性</b><small>自分を知って相性診断へ</small></article>
        </div>
      </section>

      <section class="punyako-game-route">
        <div><b>5</b><span>誕生</span></div><i></i><div><b>10</b><span>進化</span></div><i></i><div><b>15</b><span>進化</span></div><i></i><div class="is-final"><b>25</b><span>FINAL</span></div>
      </section>

      <div class="punyako-game-actions">
        ${progress?`<button class="punyako-game-start" id="punyakoContinue"><small>CONTINUE QUEST</small><strong>続きから育てる</strong><em>${progress} / 25 ›</em></button><button class="punyako-game-sub" id="punyakoRestart">最初からやり直す</button>`:`<button class="punyako-game-start" id="punyakoStart"><small>${result?'NEW QUEST':'START QUEST'}</small><strong>${result?'もう一度診断する':'まず5問、はじめる'}</strong><em>›</em></button>`}
        ${result?'<button class="punyako-game-result" id="punyakoMyResult">🏆 今の最終ぷにゅかを見る</button><button class="punyako-game-history" id="punyakoHistory">診断履歴</button>':''}
        <p>回答は自動保存。5問で一度区切れるので、気軽に参加できます。</p>
      </div>
    </div>`;
  bindSquish();bindSound();refreshWorldCount();
  $('#punyakoContinue')?.addEventListener('click',()=>{sfx.next();showQuestion()});
  $('#punyakoRestart')?.addEventListener('click',()=>{if(confirm('回答途中のデータを消して、最初から始めますか？'))startNew()});
  $('#punyakoStart')?.addEventListener('click',()=>{if(result&&!confirm('新しい25問の旅を始めますか？'))return;startNew()});
  $('#punyakoMyResult')?.addEventListener('click',()=>showResult(result));
  $('#punyakoHistory')?.addEventListener('click',showHistory)
}
async function refreshWorldCount(){
  const el=$('#punyakoWorldCount'),bar=$('#punyakoMissionBar');if(!el&&!bar)return;
  try{
    for(let i=0;i<40&&!window.UNICA_FIREBASE?.loadPunyakoMembers;i++)await new Promise(r=>setTimeout(r,100));
    const rows=await window.UNICA_FIREBASE?.loadPunyakoMembers?.();
    const n=Array.isArray(rows)?rows.filter(x=>x?.punyakoJourney?.seedComplete).length:0;
    const safe=Math.max(0,Math.min(30,n)),pc=Math.round(safe/30*100),remain=Math.max(0,30-n);
    if(el){el.textContent=n>=30?'30人達成！ RELEASE決定！':`現在 ${n} / 30人 ・ あと${remain}人`;el.classList.toggle('is-complete',n>=30)}
    if(bar)bar.style.width=`${pc}%`;
  }catch{
    if(el)el.textContent='5問で参加できます';
    if(bar)bar.style.width='0%';
  }
}
function startNew(){answers=[];qIndex=0;clearProgress();saveProgress();sfx.sparkle();showQuestion()}

function showQuestion(){modal.classList.remove('is-punyako-game-intro');
  const qu=currentQuestion();if(!qu)return;setBack(showIntro);const [ch,sub,no]=chapter(),form=currentForm(),pct=Math.round(qIndex/25*100);
  const companion=form?`<div class="punyako-companion-slot"><span class="punyako-slot-label">PARTNER</span>${charHtml(form)}</div>`:`<div class="punyako-companion-slot is-locked"><span class="punyako-slot-label">PARTNER</span><div class="punyako-question-unknown"><b>?</b><small>Q5で誕生</small></div></div>`;
  screen.className=`scent16-screen punyako-screen punyako-chapter-${no} punyako-game-question-bg`;
  screen.innerHTML=`<div class="punyako-question punyako-quest-screen">
    <div class="punyako-quest-topbar">
      <div class="punyako-quest-stage"><small>STAGE ${no}</small><strong>${esc(ch)}</strong><span>${esc(sub)}</span></div>
      <div class="punyako-progress-tools">${soundButton()}<em>Q ${qIndex+1}<b>/25</b></em></div>
    </div>
    <div class="punyako-quest-save"><span><i></i>AUTO SAVE</span><b>${esc(milestoneText())}</b></div>
    <div class="punyako-progress punyako-game-progress"><i style="width:${pct}%"></i></div>
    ${companion}
    <div class="punyako-question-card punyako-command-panel">
      <div class="punyako-command-head"><small>QUEST ${String(qIndex+1).padStart(2,'0')}</small><em>SELECT COMMAND</em></div>
      <h3>${esc(qu.text)}</h3>
      <div class="punyako-options">${qu.options.map((x,i)=>`<button type="button" data-punyako-choice="${i}"><span>${String.fromCharCode(65+i)}</span><b>${esc(x.label)}</b><i>›</i></button>`).join('')}</div>
    </div>
    <p class="punyako-question-hint"><span>✦</span> 直感で選んでOK。選んだ瞬間にセーブされます。</p>
  </div>`;
  bindSquish();bindSound();screen.querySelectorAll('[data-punyako-choice]').forEach(b=>b.onclick=()=>answer(Number(b.dataset.punyakoChoice)))
}
function answer(choiceIndex){
  const qu=currentQuestion(),op=qu?.options?.[choiceIndex];if(!qu||!op)return;sfx.choice();answers=answers.slice(0,qIndex);answers[qIndex]={questionId:qu.id,choiceIndex,stage2:op.stage2||{},stage3:op.stage3||{},finalId:op.finalId||null,stats:op.stats||{},hidden:op.hidden||{},meta:qu.meta||{}};screen.querySelectorAll('[data-punyako-choice]').forEach((b,i)=>{b.disabled=true;b.classList.toggle('is-selected',i===choiceIndex)});const char=$('#punyakoCharacter');char?.classList.add('is-reacting');qIndex++;saveProgress();const answered=qIndex;setTimeout(()=>{if(answered===5)return showBirth();if(answered===10)return showEvolution('stage2');if(answered===15)return showEvolution('stage3');if(answered===25)return finishDiagnosis();sfx.next();showQuestion()},480)
}
function showBirth(){modal.classList.remove('is-punyako-game-intro');
  const info=FORMS.stage1_base;setBack(null);saveJourney(info,5).then(()=>{window.dispatchEvent(new CustomEvent('unica:punyako-seed-complete',{detail:localJourney()}));refreshWorldCount()});screen.className='scent16-screen punyako-screen punyako-birth-bg punyako-game-reward-bg';screen.innerHTML=`<div class="punyako-evolution punyako-birth">${particleHtml(['✦','✧','♡','·'],38)}<div class="punyako-evolution-ring is-birth"></div><div class="punyako-burst-rays"></div><div class="punyako-reward-label">MISSION REWARD</div><small>BIRTH UNLOCKED</small>${charHtml(info,'is-evolving')}<h3>ぷにゅかが誕生しました！</h3><strong class="punyako-get-banner">NEW! ぷにゅか GET！</strong><p>あなたの最初の5つの答えから、小さなぷにゅかが生まれました。</p><div class="punyako-get-project"><b>✓ LIMITED MISSION 参加完了！</b><span>30人チャレンジにカウントされました。あと20問で最終進化＆性格データ完成。</span></div><button class="punyako-primary" id="punyakoBirthNext"><small>CONTINUE QUEST</small>この子を育てる <b>›</b></button><button class="punyako-secondary" id="punyakoBirthClose">SAVEして今日はここまで</button></div>`;setTimeout(()=>sfx.birth(),80);setTimeout(()=>sfx.sparkle(),850);bindSquish();$('#punyakoBirthNext').onclick=()=>{sfx.next();showQuestion()};$('#punyakoBirthClose').onclick=close
}
function stageInfo(kind){
  if(kind==='stage2')return stage2()==='ear'?FORMS.stage2_ear:FORMS.stage2_wing;
  const s3=stage3();return s3==='fluffy'?FORMS.stage3_01_fluffy_ear:s3==='round'?FORMS.stage3_02_round_ear:s3==='kira'?FORMS.stage3_03_kira_wing:FORMS.stage3_04_gira_wing
}
function showEvolution(kind){modal.classList.remove('is-punyako-game-intro');
  const info=stageInfo(kind),completed=kind==='stage2'?10:15;saveJourney(info,completed);setBack(null);screen.className='scent16-screen punyako-screen punyako-evolution-bg punyako-game-reward-bg';screen.innerHTML=`<div class="punyako-evolution punyako-big-evolution">${particleHtml(['✦','✧','◇','·'],34)}<div class="punyako-evolution-ring"></div><div class="punyako-burst-rays"></div><div class="punyako-reward-label">RANK UP</div><small>EVOLUTION ${completed===10?'I':'II'}</small>${charHtml(info,'is-evolving')}<h3>${kind==='stage2'?'ぷにゅかが進化した！':'さらに姿が変わった！'}</h3><strong class="punyako-get-banner">${esc(info.name)}</strong><p>これまでの選び方が、少しずつ姿になっています。</p><div class="punyako-evolve-status"><span>QUEST ${completed}/25 CLEAR</span><b>FINALまであと${25-completed}問</b></div><button class="punyako-primary" id="punyakoEvolutionNext"><small>NEXT STAGE</small>つづける <b>›</b></button></div>`;setTimeout(()=>sfx.evolve(),80);setTimeout(()=>sfx.sparkle(),650);bindSquish();$('#punyakoEvolutionNext').onclick=()=>{sfx.next();showQuestion()}
}
function finishDiagnosis(){modal.classList.remove('is-punyako-game-intro');
  clearProgress();const result=makeResult(),t=TYPE_MAP[result.typeId];addHistory(result);saveJourney({...t,stage:'final'},25);setBack(null);screen.className=`scent16-screen punyako-screen punyako-final-bg punyako-game-final-bg fx-${t.fx}`;const symbols={flower:['🌸','✦','♡'],sun:['☀','✦','·'],color:['✦','◆','●'],moon:['☾','✦','·'],guard:['✦','◇','·'],clover:['♧','✦','·'],dream:['☁','✦','○'],star:['★','✦','·'],angel:['✦','♡','·'],rainbow:['✦','◇','·'],butterfly:['✦','❀','·'],pixie:['✦','✧','·'],thunder:['⚡','✦','·'],devil:['✦','◆','·'],ice:['❄','✦','·'],phoenix:['✦','🔥','·']}[t.fx]||['✦','✧','·'];screen.innerHTML=`<div class="punyako-evolution punyako-final-evolution">${particleHtml(symbols,48)}<div class="punyako-evolution-ring is-final"></div><div class="punyako-burst-rays is-final"></div><div class="punyako-reward-label is-final">MISSION COMPLETE</div><small>FINAL EVOLUTION</small>${charHtml(t,'is-evolving')}<h3>最終進化！</h3><strong class="punyako-get-banner is-final">${esc(t.name)} GET!</strong><p>${esc(t.core)}</p><div class="punyako-final-unlocks"><span>✓ ICON UNLOCKED</span><span>✓ PERSONALITY DATA</span><span>✓ COMPATIBILITY READY</span></div><button class="punyako-primary" id="punyakoFinalNext"><small>OPEN RESULT</small>診断結果を見る <b>›</b></button></div>`;setTimeout(()=>sfx.final(),60);setTimeout(()=>sfx.sparkle(),1000);bindSquish();$('#punyakoFinalNext').onclick=()=>{const old=activeResult();if(old?.typeId===result.typeId&&old?.runId!==result.runId)showSameTypeChoice(result,old);else{saveActive(result);showResult(result)}}
}
function showSameTypeChoice(result,old){modal.classList.remove('is-punyako-game-intro');const t=TYPE_MAP[result.typeId];setBack(showIntro);screen.className='scent16-screen punyako-screen punyako-result-bg punyako-game-result-bg';screen.innerHTML=`<div class="punyako-same"><div class="punyako-result-status"><small>PROFILE UPDATE</small><strong>SAME PUNYUKA, NEW HEART</strong></div>${charHtml(t)}<h3>また ${esc(t.name)} になりました！</h3><p>同じぷにゅかでも、今回の答えで性格パラメータが変化しています。どちらのデータを装備しますか？</p><button class="punyako-primary" id="useNewProfile"><small>EQUIP NEW DATA</small>今回の性格を使う</button><button class="punyako-secondary" id="keepOldProfile">今の性格のまま</button><small class="punyako-note">今回の結果もSAVE DATAに保存されています。</small></div>`;bindSquish();$('#useNewProfile').onclick=()=>{saveActive(result);showResult(result)};$('#keepOldProfile').onclick=()=>showResult(old)}
function radarSvg(st){const cx=120,cy=120,r=78,levels=[.25,.5,.75,1],pts=(rad)=>AXES.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/5;return`${cx+Math.cos(a)*r*rad},${cy+Math.sin(a)*r*rad}`}).join(' '),valuePts=AXES.map((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,rr=r*(clamp(st?.[k]||50,0,100)/100);return`${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(' ');return`<svg class="punyako-radar" viewBox="0 0 240 240" aria-label="性格の五角形グラフ">${levels.map(l=>`<polygon points="${pts(l)}" class="grid"></polygon>`).join('')}${AXES.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/5;return`<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*r}" y2="${cy+Math.sin(a)*r}" class="axis"></line>`}).join('')}<polygon points="${valuePts}" class="value"></polygon>${AXES.map((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,rr=r+24;return`<text x="${cx+Math.cos(a)*rr}" y="${cy+Math.sin(a)*rr+4}" text-anchor="middle">${AXIS_LABEL[k]}</text>`}).join('')}</svg>`}
function showResult(raw){modal.classList.remove('is-punyako-game-intro');const t=TYPE_MAP[raw?.typeId];if(!t)return showIntro();sfx.result();const result={...raw,scentName:raw.scentName||t.name,stats:raw.stats||{}};setBack(showIntro);screen.className='scent16-screen punyako-screen punyako-result-bg punyako-game-result-bg';screen.innerHTML=`<div class="punyako-result"><div class="punyako-result-status"><small>MISSION CLEAR</small><strong>PLAYER PROFILE</strong><span>25 / 25 COMPLETE</span></div>${charHtml(t)}<div class="punyako-result-rarity">FINAL PUNYUKA</div><h3>${esc(t.name)}</h3><p class="punyako-core">${esc(t.core)}</p><div class="punyako-unlock-strip"><span>✓ ICON</span><span>✓ PERSONALITY</span><span>✓ COMPATIBILITY DATA</span></div><section class="punyako-radar-wrap"><div>${radarSvg(result.stats)}</div><ul>${AXES.map(k=>`<li><span>${AXIS_LABEL[k]}</span><b>${clamp(result.stats?.[k]||50,0,100)}</b></li>`).join('')}</ul></section><div class="punyako-result-cards"><article><small>SKILL / あなたの強み</small><p>${esc(t.strength)}</p></article><article><small>RECOVERY / 回復のヒント</small><p>${esc(t.recharge)}</p></article><article><small>MESSAGE / ぷにゅかから一言</small><p>${esc(t.advice)}</p></article></div><div class="punyako-result-actions"><button class="punyako-primary" id="punyakoRedo"><small>NEW GAME</small>もう一度診断する</button><button class="punyako-secondary" id="punyakoHistoryFromResult">SAVE DATA / 診断履歴を見る</button><button class="punyako-text-button" id="punyakoBackHome">QUEST TOPへ</button></div></div>`;bindSquish();$('#punyakoRedo').onclick=()=>{if(confirm('新しく25問の旅を始めますか？'))startNew()};$('#punyakoHistoryFromResult').onclick=showHistory;$('#punyakoBackHome').onclick=showIntro}
function showHistory(){modal.classList.remove('is-punyako-game-intro');const hist=read(HISTORY_KEY,[]);setBack(()=>{const r=activeResult();r?showResult(r):showIntro()});screen.className='scent16-screen punyako-screen punyako-result-bg punyako-game-result-bg';screen.innerHTML=`<div class="punyako-history"><div class="punyako-result-status"><small>SAVE DATA</small><strong>DIAGNOSIS HISTORY</strong><span>${hist.length} SLOT</span></div><h3>診断履歴</h3><p>過去の性格データを選んで、いつでも装備し直せます。</p>${hist.length?`<div class="punyako-history-list">${hist.map((r,i)=>{const t=TYPE_MAP[r.typeId];if(!t)return'';return`<article><em>SLOT ${String(i+1).padStart(2,'0')}</em><img src="${esc(t.image)}" alt=""><div><strong>${esc(t.name)}</strong><small>${esc(r.diagnosedDate||'')}</small><span>${AXES.map(k=>`${AXIS_LABEL[k]} ${r.stats?.[k]??50}`).join(' · ')}</span></div><button type="button" data-restore-history="${i}">このDATAを装備</button></article>`}).join('')}</div>`:'<div class="punyako-empty">NO SAVE DATA<br>まだ診断履歴がありません。</div>'}<button class="punyako-secondary" id="punyakoHistoryBack">戻る</button></div>`;screen.querySelectorAll('[data-restore-history]').forEach(b=>b.onclick=()=>{const r=hist[Number(b.dataset.restoreHistory)];if(!r)return;if(confirm(`${TYPE_MAP[r.typeId]?.name||'このぷにゅか'}のこの性格に戻しますか？`)){saveActive(r);showResult(r)}});$('#punyakoHistoryBack').onclick=()=>{const r=activeResult();r?showResult(r):showIntro()}}

if(title)title.textContent='ぷにゅか診断';
$('#openScent16')?.addEventListener('click',e=>{e.preventDefault();open()});$('#scent16NavBack')?.addEventListener('click',headerBack);$('#scent16Exit')?.addEventListener('click',close);document.querySelectorAll('[data-close-scent16]').forEach(x=>x.addEventListener('click',close));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});window.addEventListener('unica:firebase-member-restored',updateHome);window.addEventListener('unica:scent-diagnosis-saved',updateHome);window.addEventListener('unica:punyako-avatar-updated',updateHome);updateHome();
window.UNICA_SCENT16={close,typeById:id=>TYPE_MAP[id]||null,scentIconUrl:id=>TYPE_MAP[id]?.image||'',getMyResult:()=>activeResult()||member()?.scentDiagnosis,getProgress:()=>read(PROGRESS_KEY,null),showIntro,startDiagnosis:startNew,showResult};
})();
