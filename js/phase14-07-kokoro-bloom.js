(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
const modal=$('#scent16Modal'),screen=$('#scent16Screen'),title=$('#scent16Title');
if(!modal||!screen)return;
const MEMBER_KEY='unicaWorldMemberV4';
const PROGRESS_KEY='unicaPunyakoDiagnosisV3Progress';
const RESULT_KEY='unicaPunyakoDiagnosisV3Result';
const HISTORY_KEY='unicaPunyakoDiagnosisV3History';
const ACTIVE_BY_TYPE_KEY='unicaPunyakoDiagnosisV3ActiveProfiles';
const AXES=['kindness','action','curiosity','sensitivity','flexibility'];
const AXIS_LABEL={kindness:'思いやり',action:'行動力',curiosity:'好奇心',sensitivity:'感受性',flexibility:'しなやかさ'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const read=(k,f=null)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const member=()=>read(MEMBER_KEY,null);
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo'}).format(new Date());
const ASSET='assets/punyuka/';

const TYPES=[
{id:'punyuka_01',name:'気配りウサぷにゅか',image:ASSET+'final/01_flower_rabbit.webp',group:'fluffy',pair:'fluffy_social',side:'left',icon:'🌸',core:'小さな変化によく気づき、さりげなく人を助けられるタイプ。',strength:'相手が言葉にする前の困りごとにも気づきやすく、安心できる空気を作れます。',recharge:'自分のためだけに何もしない時間を作ると、やさしさが戻ってきます。',advice:'全部を引き受けず、「今日はここまで」と決めることも立派な気配りです。'},
{id:'punyuka_02',name:'陽キャイヌぷにゅか',image:ASSET+'final/02_sun_dog.webp',group:'fluffy',pair:'fluffy_social',side:'right',icon:'☀️',core:'人と一緒にいることでエネルギーが広がり、場を明るくできるタイプ。',strength:'声をかける速さと親しみやすさで、初対面の空気までやわらかくできます。',recharge:'楽しい予定のあとに少しだけ一人時間を入れると、疲れをためにくくなります。',advice:'元気に見せなくても大丈夫。静かな自分も同じくらい大切に。'},
{id:'punyuka_03',name:'好奇心ネコぷにゅか',image:ASSET+'final/03_color_cat.webp',group:'fluffy',pair:'fluffy_mind',side:'left',icon:'🎨',core:'「それ何？」から世界を広げ、自分の感覚で面白い方向へ進むタイプ。',strength:'新しいものを見つける速さと、好きなことへ夢中になれる集中力があります。',recharge:'飽きたときは無理に続けず、別の刺激を少し入れると再び集中できます。',advice:'興味が移るのは弱点ではなく才能。大事なものだけ戻れる印を残しておこう。'},
{id:'punyuka_04',name:'洞察キツネぷにゅか',image:ASSET+'final/04_moon_fox.webp',group:'fluffy',pair:'fluffy_mind',side:'right',icon:'🌙',core:'表面だけで決めず、静かに観察して奥にある意味を見つけるタイプ。',strength:'人の言葉や状況の細かな違和感を拾い、本質を考える力があります。',recharge:'情報を遮断して、考えを一人で整理する時間が大きな回復になります。',advice:'考えがまとまってから話したいタイプ。急かされる場では「少し考えたい」と伝えてOK。'},
{id:'punyuka_05',name:'面倒見クマぷにゅか',image:ASSET+'final/05_guard_bear.webp',group:'round',pair:'round_real',side:'left',icon:'🛡️',core:'頼られると力が出て、みんなが安心して動ける土台を作るタイプ。',strength:'責任感があり、困っている人を放っておかず最後まで支えられます。',recharge:'自分が誰にも頼らなくていい時間を確保すると、気持ちが軽くなります。',advice:'「任せる」も面倒見のひとつ。全部自分で背負わない方が長く支えられます。'},
{id:'punyuka_06',name:'楽天パンダぷにゅか',image:ASSET+'final/06_lucky_panda.webp',group:'round',pair:'round_real',side:'right',icon:'🍀',core:'嫌なことがあっても次の楽しみを見つけ、気持ちを切り替えられるタイプ。',strength:'失敗を必要以上に引きずらず、周囲にも「まあ何とかなる」と余白を作れます。',recharge:'好きな食べ物や小さなご褒美など、すぐ楽しめるものが回復のスイッチ。',advice:'前向きさで飛ばしすぎず、たまには嫌だった気持ちにも名前をつけてあげよう。'},
{id:'punyuka_07',name:'夢見ヒツジぷにゅか',image:ASSET+'final/07_dream_sheep.webp',group:'round',pair:'round_inner',side:'left',icon:'☁️',core:'頭の中に豊かな景色があり、想像することで心を育てるタイプ。',strength:'まだ形のない未来や物語を思い描き、人とは違う世界を作れます。',recharge:'音楽・物語・眠る前の空想など、現実から少し離れる時間が大切です。',advice:'夢は小さく現実に置くと育ちます。思いついたら一行だけでもメモしてみよう。'},
{id:'punyuka_08',name:'探究コアラぷにゅか',image:ASSET+'final/08_stargazer_koala.webp',group:'round',pair:'round_inner',side:'right',icon:'🔭',core:'気になったことを深く調べ、納得するまで知りたくなるタイプ。',strength:'一つのテーマを丁寧に掘り下げ、知識を自分のものにする力があります。',recharge:'好きなことを誰にも邪魔されず調べる時間が、そのまま休息になります。',advice:'全部わかってから動こうとしなくても大丈夫。途中の仮説で一度試すと発見が増えます。'},
{id:'punyuka_09',name:'癒しテンシぷにゅか',image:ASSET+'final/09_healing_angel.webp',group:'kira',pair:'kira_soft',side:'left',icon:'🪽',core:'相手を否定せず受け止め、そばにいるだけで安心を作れるタイプ。',strength:'聞く力と共感力が高く、誰かが弱っているときに自然と寄り添えます。',recharge:'人の気持ちを受け取りすぎた日は、一人になって心を空っぽにする時間を。',advice:'優しさは無限ではありません。自分を守る距離を取ることも優しさです。'},
{id:'punyuka_10',name:'冒険テンマぷにゅか',image:ASSET+'final/10_rainbow_pegasus.webp',group:'kira',pair:'kira_spark',side:'left',icon:'🌈',core:'まだ見たことのない場所や経験に、期待しながら飛び込めるタイプ。',strength:'未来を明るく想像し、最初の一歩を踏み出す勇気があります。',recharge:'同じ景色が続くと疲れやすいので、小さな新体験が元気の源になります。',advice:'遠くへ行くだけが冒険ではありません。いつもの道を一本変えるだけでも十分。'},
{id:'punyuka_11',name:'柔軟チョウぷにゅか',image:ASSET+'final/11_flower_butterfly.webp',group:'kira',pair:'kira_soft',side:'right',icon:'🦋',core:'状況に合わせて形を変え、無理なく周囲になじむことが得意なタイプ。',strength:'予定外のことが起きても、その場に合うやり方へ自然に切り替えられます。',recharge:'変化が多かった日は、いつもの場所・いつもの習慣へ戻ると整います。',advice:'合わせられるからこそ、自分が本当はどうしたいかを時々確認してみよう。'},
{id:'punyuka_12',name:'閃ピクシーぷにゅか',image:ASSET+'final/12_inspiration_fairy.webp',group:'kira',pair:'kira_spark',side:'right',icon:'✨',core:'突然つながる「ひらめき」を楽しみ、発想で世界を面白くするタイプ。',strength:'離れたもの同士を結びつけ、他の人が思いつかないアイデアを生み出せます。',recharge:'ぼんやりする時間や遊びが、次のアイデアを連れてきます。',advice:'ひらめきを全部完成させなくてOK。まずは一番わくわくする一つだけ形に。'},
{id:'punyuka_13',name:'猛進ドラゴぷにゅか',image:ASSET+'final/13_thunder_dragon.webp',group:'gira',pair:'gira_active',side:'left',icon:'⚡',core:'決めた瞬間から一気に動き、壁があっても突破しようとするタイプ。',strength:'迷いを行動で振り切る強さがあり、停滞した場面を動かせます。',recharge:'全力で走ったあとは、何もしない時間を意識して入れると次の力が戻ります。',advice:'速さは武器。大事な場面だけ、一度周りを見る一拍を入れるとさらに強くなります。'},
{id:'punyuka_14',name:'悪戯デビルぷにゅか',image:ASSET+'final/14_trick_devil.webp',group:'gira',pair:'gira_active',side:'right',icon:'😈',core:'頭の回転と遊び心で、正面突破ではない面白い道を見つけるタイプ。',strength:'空気を読みながら機転を利かせ、退屈な状況にも楽しさを足せます。',recharge:'自由にふざけたり、くだらないことを楽しめる相手との時間が回復になります。',advice:'冗談が通じない場では少しだけ説明を足すと、あなたの魅力が誤解されにくくなります。'},
{id:'punyuka_15',name:'冷静ペンギぷにゅか',image:ASSET+'final/15_ice_penguin.webp',group:'gira',pair:'gira_steady',side:'left',icon:'❄️',core:'感情が大きく動く場面でも、一度整理してから判断できるタイプ。',strength:'焦りに巻き込まれにくく、周囲が混乱しているときほど落ち着いて考えられます。',recharge:'静かで予測できる時間を過ごすと、頭の中がきれいに整います。',advice:'冷静さの奥にある気持ちも、ときどき言葉にすると周りに伝わりやすくなります。'},
{id:'punyuka_16',name:'暁の不死鳥ぷにゅか',image:ASSET+'final/16_dawn_phoenix.webp',group:'gira',pair:'gira_steady',side:'right',icon:'🔥',core:'うまくいかない日があっても、時間をかけて何度でも立ち上がれるタイプ。',strength:'失敗や変化を自分の物語に変え、以前より強い形で戻ってくる粘りがあります。',recharge:'完全に止まる時間を怖がらないこと。休んでいる間にも次の朝は近づいています。',advice:'立ち直る速さを競わなくて大丈夫。あなたは「戻ってこられること」そのものが強さです。'}
];
const TYPE_MAP=Object.fromEntries(TYPES.map(t=>[t.id,t]));

const q=(text,a,b)=>({text,options:[a,b]});
const o=(label,route,stats={})=>({label,route,stats});
const COMMON=[
q('霧の森で、遠くから小さな声が聞こえました。最初にするなら？',o('声のする方へ歩いていく','ear',{kindness:3,curiosity:1}),o('高い場所から森全体を見渡す','wing',{action:2,curiosity:2})),
q('不思議な扉の前に、二つの鍵があります。惹かれるのは？',o('誰かが残した、あたたかい鍵','ear',{kindness:2,sensitivity:2}),o('まだ誰も使っていない、光る鍵','wing',{action:2,curiosity:2})),
q('旅の途中で夜になります。落ち着く場所は？',o('仲間の気配がする小さな宿','ear',{kindness:2,flexibility:1}),o('星がよく見える丘の上','wing',{sensitivity:2,curiosity:1})),
q('魔法をひとつだけ使えるなら？',o('誰かの気持ちが少し軽くなる魔法','ear',{kindness:3,sensitivity:1}),o('行ったことのない場所へ飛べる魔法','wing',{action:3,curiosity:1})),
q('地図にない道を見つけました。どうする？',o('近くの人に、この道を知っているか聞く','ear',{kindness:1,flexibility:2}),o('少しだけ先へ進んで確かめる','wing',{action:3,curiosity:2}))
];
const EAR=[
q('森の中に二つの休憩場所。どちらを選ぶ？',o('風や匂いを感じられる、ふわふわの草原','a',{sensitivity:2,flexibility:1}),o('大きな木に守られた、落ち着く木陰','b',{kindness:2,flexibility:-1})),
q('誰かから相談を受けたとき、近いのは？',o('話しながら一緒に気持ちを探す','a',{kindness:2,sensitivity:2}),o('最後まで聞いて、必要なところを支える','b',{kindness:3,action:1})),
q('休日に急に予定が空きました。',o('気になる場所へふらっと出かける','a',{curiosity:3,flexibility:2}),o('好きなことをゆっくり深める','b',{curiosity:2,sensitivity:1})),
q('小さな村のお祭りを手伝うなら？',o('人と話しながら、あちこち動く係','a',{action:2,kindness:1}),o('必要なものを整えて支える係','b',{kindness:2,action:1})),
q('宝箱を見つけたら、まず気になるのは？',o('中に何が入っているのか','a',{curiosity:3}),o('誰がここに置いたのか','b',{curiosity:2,sensitivity:2}))
];
const WING=[
q('空に浮かぶ島へ着きました。惹かれる光は？',o('やわらかく揺れる、虹色の光','a',{sensitivity:3,flexibility:2}),o('遠くまで照らす、強い稲妻の光','b',{action:3,curiosity:1})),
q('困っている仲間を見つけました。',o('まず安心できるようそばに行く','a',{kindness:3,sensitivity:1}),o('すぐ原因を探して動き出す','b',{action:3,curiosity:1})),
q('知らない世界へ行くなら？',o('景色や出会いを楽しみながら進む','a',{flexibility:2,sensitivity:2}),o('目標を決めて一気にたどり着く','b',{action:3,flexibility:-1})),
q('突然、予定が全部変わりました。',o('その場で面白い方へ切り替える','a',{flexibility:3,curiosity:1}),o('まず状況を整理して次の手を決める','b',{action:2,flexibility:1})),
q('あなたの翼が光るのはどんな瞬間？',o('誰かや何かと心がつながったとき','a',{kindness:2,sensitivity:2}),o('難しい壁を越えようとしたとき','b',{action:3}))
];
const PAIR_Q={
fluffy:[
q('新しい街に着いたら、先に目に入るのは？',o('そこにいる人たちの表情','a',{kindness:2}),o('見たことのない店や路地','b',{curiosity:3})),q('困りごとを見つけたときは？',o('自分にできることを考える','a',{kindness:3}),o('なぜ起きたのかを考える','b',{curiosity:2,sensitivity:1})),q('誰かと話す時間と、一人で考える時間。今ほしいのは？',o('誰かと気持ちを交わす時間','a',{kindness:2,action:1}),o('自分の興味を追いかける時間','b',{curiosity:3})),q('プレゼントを選ぶなら？',o('相手が今ほしそうなもの','a',{kindness:3}),o('相手がまだ知らなそうな面白いもの','b',{curiosity:3})),q('物語の主人公なら？',o('仲間との関係を大切に進む','a',{kindness:2,flexibility:1}),o('謎を追いかけながら進む','b',{curiosity:3,sensitivity:1}))],
round:[
q('村に新しい場所を作るなら？',o('みんなが安心して集まれる場所','a',{kindness:3}),o('静かに夢中になれる場所','b',{curiosity:2,sensitivity:2})),q('何か問題が起きたときは？',o('まず今日できることから整える','a',{action:2,kindness:1}),o('少し離れて、別の可能性を考える','b',{curiosity:2,sensitivity:1})),q('人から頼られることは？',o('わりと嬉しい。力になりたい','a',{kindness:3,action:1}),o('嫌ではないけど、自分の世界も大切','b',{sensitivity:2,curiosity:1})),q('長い旅で大切なのは？',o('毎日を無理なく続けること','a',{flexibility:2,kindness:1}),o('旅の意味や発見を持ち帰ること','b',{curiosity:3})),q('宝物にしたいのは？',o('みんなとの思い出','a',{kindness:2,sensitivity:1}),o('自分だけが見つけた景色','b',{curiosity:2,sensitivity:2}))],
kira:[
q('誰かが落ち込んでいます。自然にできるのは？',o('そばで気持ちを受け止める','a',{kindness:3,sensitivity:2}),o('気分が変わる新しい風を連れてくる','b',{action:2,curiosity:2})),q('あなたが光を届けるなら？',o('やわらかく包む光','a',{kindness:2,sensitivity:2}),o('遠くへ進む道を照らす光','b',{action:2,curiosity:2})),q('変化が起きたときは？',o('その場の人に合わせながら整える','a',{flexibility:3,kindness:1}),o('せっかくなら新しいことを試す','b',{curiosity:3,action:1})),q('魔法の使い方で近いのは？',o('今いる人を少し楽にする','a',{kindness:3}),o('今までなかったものを生み出す','b',{curiosity:3,sensitivity:1})),q('嬉しい瞬間は？',o('誰かの表情がやわらいだとき','a',{kindness:3}),o('「やってみたい！」が生まれたとき','b',{action:2,curiosity:2}))],
gira:[
q('壁が立ちはだかりました。',o('勢いをつけて突破口を探す','a',{action:3}),o('一度止まり、長く続けられる方法を考える','b',{flexibility:2,sensitivity:1})),q('勝負どころで近いのは？',o('まず動いて流れを作る','a',{action:3}),o('焦らず自分のタイミングを待つ','b',{flexibility:1,sensitivity:1})),q('トラブルが起きたら？',o('その場で手を打ちながら進む','a',{action:3,flexibility:1}),o('状況を整理してから確実に進む','b',{flexibility:2,curiosity:1})),q('周りが迷っているときは？',o('自分が先に一歩出る','a',{action:3}),o('落ち着くまで支えてから進む','b',{kindness:2,flexibility:1})),q('強さとは？',o('怖くても前へ出ること','a',{action:3}),o('崩れてもまた立て直せること','b',{flexibility:2,sensitivity:1}))]
};
const FINAL_Q={
fluffy_social:[q('誰かが元気をなくしていたら？',o('さりげなく必要なことをしておく','left',{kindness:3,sensitivity:1}),o('声をかけて一緒に明るい空気を作る','right',{action:2,kindness:2})),q('グループで自然にすることは？',o('困っている人がいないか見る','left',{kindness:3}),o('話題を作って場を盛り上げる','right',{action:2,flexibility:1})),q('嬉しいと言われたいのは？',o('「気づいてくれてありがとう」','left',{kindness:3,sensitivity:1}),o('「一緒にいると楽しい」','right',{action:2,kindness:1})),q('知らない人が多い場所では？',o('まず周りを見て必要なことを探す','left',{sensitivity:2,kindness:2}),o('近くの人に話しかけてみる','right',{action:3})),q('あなたのやさしさに近いのは？',o('静かに先回りするやさしさ','left',{kindness:3}),o('元気を分けるやさしさ','right',{action:2,kindness:2}))],
fluffy_mind:[q('面白いものを見つけたら？',o('すぐ触って試してみたい','left',{curiosity:3,action:1}),o('まずよく観察して仕組みを考えたい','right',{curiosity:2,sensitivity:2})),q('謎に出会うと？',o('次々に別の可能性も試す','left',{curiosity:3,flexibility:2}),o('一つずつ手がかりをつなぐ','right',{curiosity:2,sensitivity:2})),q('人を見るときは？',o('何が好きなのか気になる','left',{curiosity:3}),o('言葉の裏の気持ちが気になる','right',{sensitivity:3})),q('自由時間は？',o('気になったことを次々やる','left',{curiosity:3,flexibility:2}),o('一つのことを静かに考える','right',{curiosity:2,sensitivity:2})),q('新しい発見の喜びは？',o('「こんなのもあるんだ！」','left',{curiosity:3}),o('「やっぱり、そういうことか」','right',{curiosity:2,sensitivity:2}))],
round_real:[q('頼まれごとが重なったら？',o('優先順位をつけて最後まで面倒を見る','left',{kindness:3,action:2}),o('できる範囲でやって、あとは何とかなると思う','right',{flexibility:3})),q('失敗した友だちには？',o('一緒に立て直す方法を考える','left',{kindness:3,action:1}),o('「次いこ！」と気持ちを切り替える','right',{flexibility:3,action:1})),q('責任ある役を頼まれたら？',o('必要なら引き受ける','left',{action:2,kindness:2}),o('得意な人がやればいいと思える','right',{flexibility:3})),q('予定どおりいかなかった日は？',o('できなかった分を整えておきたい','left',{action:2}),o('そんな日もある、と切り替える','right',{flexibility:3})),q('周りから言われるなら？',o('「頼りになる」','left',{kindness:2,action:2}),o('「一緒にいると気が楽」','right',{flexibility:3,kindness:1}))],
round_inner:[q('眠る前にしがちなのは？',o('いろんな未来を想像する','left',{sensitivity:3,curiosity:1}),o('気になったことを調べる','right',{curiosity:3})),q('未知の星を見つけたら？',o('そこにどんな世界があるか想像する','left',{sensitivity:3}),o('どんな星なのか情報を集める','right',{curiosity:3})),q('好きな作品に出会うと？',o('自分の中で物語がさらに広がる','left',{sensitivity:3}),o('設定や背景まで詳しく知りたくなる','right',{curiosity:3})),q('答えがない問いは？',o('自由に想像できて楽しい','left',{sensitivity:2,flexibility:1}),o('できるところまで調べたくなる','right',{curiosity:3})),q('心が動くのは？',o('まだない未来を思い描いたとき','left',{sensitivity:3}),o('知らなかったことがつながったとき','right',{curiosity:3}))],
kira_soft:[q('誰かの悩みに向き合うなら？',o('気持ちをそのまま受け止める','left',{kindness:3,sensitivity:2}),o('その人に合わせて接し方を変える','right',{flexibility:3,kindness:1})),q('空気が重い場所では？',o('安心して話せる雰囲気を作る','left',{kindness:3}),o('少し流れを変えて空気を動かす','right',{flexibility:3})),q('「やさしい」と言われるのは？',o('話を聞いているとき','left',{kindness:3,sensitivity:1}),o('相手に合わせて動いたとき','right',{flexibility:3,kindness:1})),q('急な予定変更では？',o('みんなが不安にならないよう気にする','left',{kindness:3}),o('新しい予定へすぐ頭を切り替える','right',{flexibility:3})),q('人との距離感は？',o('安心できる距離をそっと守る','left',{kindness:2,sensitivity:2}),o('相手ごとにちょうどいい距離へ変える','right',{flexibility:3}))],
kira_spark:[q('知らない扉を見つけたら？',o('開けて先へ行ってみたい','left',{action:3,curiosity:2}),o('この扉から何が生まれるか想像したい','right',{curiosity:2,sensitivity:2})),q('思いついた瞬間は？',o('とりあえずやってみる','left',{action:3}),o('アイデアをどんどん膨らませる','right',{curiosity:3,sensitivity:1})),q('新しいものを作るなら？',o('使いながら完成させる','left',{action:3,flexibility:1}),o('今までにない組み合わせを考える','right',{curiosity:3})),q('わくわくする言葉は？',o('「行ってみよう！」','left',{action:3}),o('「思いついた！」','right',{curiosity:3,sensitivity:1})),q('未来へ進む力は？',o('未知へ踏み出す勇気','left',{action:3}),o('新しい景色を思い描く発想','right',{curiosity:3,sensitivity:2}))],
gira_active:[q('難しい課題が来たら？',o('まずぶつかって突破口を作る','left',{action:3}),o('別ルートがないか頭をひねる','right',{curiosity:2,flexibility:2})),q('勝つためなら？',o('正面から力を出し切る','left',{action:3}),o('相手の予想外を狙う','right',{curiosity:2,flexibility:2})),q('退屈な空気は？',o('勢いで動かす','left',{action:3}),o('ちょっとした悪戯で崩す','right',{curiosity:2,flexibility:2})),q('仲間が止まっていたら？',o('自分が先頭に立つ','left',{action:3}),o('面白い方法を見つけて誘う','right',{curiosity:2,flexibility:2})),q('得意なのは？',o('迷いを振り切ること','left',{action:3}),o('その場で機転を利かせること','right',{flexibility:3,curiosity:1}))],
gira_steady:[q('大きな失敗のあと近いのは？',o('まず静かに状況を整理する','left',{sensitivity:1,flexibility:2}),o('時間がかかっても、もう一度立ち上がる','right',{flexibility:3,action:1})),q('強い感情が出たときは？',o('一度落ち着いてから言葉にする','left',{flexibility:2,sensitivity:1}),o('落ちても、少しずつ戻ってくる','right',{flexibility:3})),q('長い困難では？',o('ペースを崩さず淡々と進む','left',{flexibility:2,action:1}),o('何度止まってもまた始める','right',{flexibility:3,action:1})),q('自分の強さは？',o('冷静さを失いにくいこと','left',{flexibility:2}),o('折れても終わりにしないこと','right',{flexibility:3})),q('朝焼けを見ると？',o('今日やることを静かに決める','left',{action:1,sensitivity:1}),o('昨日とは違う一日を始められると思う','right',{flexibility:3,sensitivity:1}))]
};
const TUNE=[
{text:'大切な人が困っているとき、いちばん自然なのは？',options:[o('まず気持ちを聞く',null,{kindness:6,sensitivity:2}),o('一緒に解決策を考える',null,{kindness:2,action:4}),o('必要なら少し距離を置いて見守る',null,{flexibility:4,sensitivity:-1})]},
{text:'予定のない一日。いちばん惹かれるのは？',options:[o('誰かと過ごす',null,{kindness:3,action:2}),o('気になることを試す',null,{curiosity:6,action:2}),o('静かに好きな世界へ浸る',null,{sensitivity:6})]},
{text:'急な変化が起きたら？',options:[o('すぐ別の方法へ切り替える',null,{flexibility:6,action:2}),o('まず状況を整理してから動く',null,{curiosity:2,flexibility:3}),o('周りの様子を見ながら合わせる',null,{kindness:2,sensitivity:2,flexibility:3})]},
{text:'新しいことを始めるときは？',options:[o('思い立ったらまず一歩',null,{action:6}),o('調べて面白さが見えてから',null,{curiosity:5}),o('自分の気持ちが動くまで待つ',null,{sensitivity:5})]},
{text:'あなたらしい「好き」の育て方は？',options:[o('人と分かち合って大きくする',null,{kindness:4,action:2}),o('どんどん深く知っていく',null,{curiosity:6}),o('自分の中でゆっくり味わう',null,{sensitivity:6,flexibility:1})]}
];

let answers=[],qIndex=0,backHandler=null;
function countRoute(from,to,key){const c={};for(let i=from;i<to;i++){const v=answers[i]?.route;if(v)c[v]=(c[v]||0)+1}return key?c[key]||0:c}
function stage2(){if(answers.length<5)return null;return countRoute(0,5,'ear')>=3?'ear':'wing'}
function stage3(){if(answers.length<10)return null;const s2=stage2(),a=countRoute(5,10,'a')>=3;return s2==='ear'?(a?'fluffy':'round'):(a?'kira':'gira')}
function pair(){if(answers.length<15)return null;const s3=stage3(),a=countRoute(10,15,'a')>=3;if(s3==='fluffy')return a?'fluffy_social':'fluffy_mind';if(s3==='round')return a?'round_real':'round_inner';if(s3==='kira')return a?'kira_soft':'kira_spark';return a?'gira_active':'gira_steady'}
function finalType(){if(answers.length<20)return null;const p=pair(),left=countRoute(15,20,'left')>=3;return TYPES.find(t=>t.pair===p&&t.side===(left?'left':'right'))||null}
function stats(){const out=Object.fromEntries(AXES.map(k=>[k,50]));answers.forEach(a=>{Object.entries(a?.stats||{}).forEach(([k,v])=>{if(k in out)out[k]+=Number(v)||0})});AXES.forEach(k=>out[k]=clamp(Math.round(out[k]),20,90));return out}
function currentQuestion(){
 if(qIndex<5)return COMMON[qIndex];
 if(qIndex<10)return (stage2()==='ear'?EAR:WING)[qIndex-5];
 if(qIndex<15)return PAIR_Q[stage3()][qIndex-10];
 if(qIndex<20)return FINAL_Q[pair()][qIndex-15];
 return TUNE[qIndex-20];
}
function chapter(){if(qIndex<5)return ['第1章','こころの入口',1];if(qIndex<10)return ['第2章','ひびき',2];if(qIndex<15)return ['第3章','分かれ道',3];if(qIndex<20)return ['第4章','こころの核',4];return ['最終章','あなたらしさ',5]}
function form(){
 if(qIndex<5)return {name:'ぷにゅか',image:ASSET+'stage1_base.webp'};
 if(qIndex<10)return stage2()==='ear'?{name:'みみぷにゅか',image:ASSET+'stage2_ear.webp'}:{name:'はねぷにゅか',image:ASSET+'stage2_wing.webp'};
 const s3=stage3();return {fluffy:{name:'ふわみみぷにゅか',image:ASSET+'stage3_01_fluffy_ear.webp'},round:{name:'まるみみぷにゅか',image:ASSET+'stage3_02_round_ear.webp'},kira:{name:'キラはねぷにゅか',image:ASSET+'stage3_03_kira_wing.webp'},gira:{name:'ギラはねぷにゅか',image:ASSET+'stage3_04_gira_wing.webp'}}[s3];
}
function saveProgress(){write(PROGRESS_KEY,{answers,qIndex,updatedAt:Date.now()})}
function loadProgress(){const p=read(PROGRESS_KEY,null);if(!p||!Array.isArray(p.answers))return false;answers=p.answers.slice(0,25);qIndex=clamp(Number(p.qIndex)||answers.length,0,24);return answers.length>0}
function clearProgress(){localStorage.removeItem(PROGRESS_KEY)}
function activeResult(){return read(RESULT_KEY,null)}
function updateHome(){
 const r=activeResult()||member()?.scentDiagnosis;const f=$('#scent16HomeFlower'),s=$('#scent16HomeSummary'),c=$('#scent16HomeCta');
 if(f)f.textContent=r?.typeId?'✦':'✦';
 if(s)s.textContent=r?.typeId?`MY ぷにゅか：${r.scentName||TYPE_MAP[r.typeId]?.name||'診断済み'}`:'25の物語から、あなたのぷにゅかが進化します。';
 if(c)c.textContent=r?.typeId?'結果を見る':'診断する';
 document.querySelectorAll('[data-status-for="scent"]').forEach(el=>el.textContent=r?.typeId?'診断済み':'診断する');
}
async function saveActive(result){
 write(RESULT_KEY,result);const m=member();if(m){m.scentDiagnosis=result;write(MEMBER_KEY,m)}
 const map=read(ACTIVE_BY_TYPE_KEY,{});map[result.typeId]=result;write(ACTIVE_BY_TYPE_KEY,map);
 updateHome();
 try{for(let i=0;i<40&&!window.UNICA_FIREBASE?.saveScentDiagnosis;i++)await new Promise(r=>setTimeout(r,100));await window.UNICA_FIREBASE?.saveScentDiagnosis?.(result)}catch(e){console.warn('ぷにゃこ診断のオンライン保存に失敗',e)}
 window.dispatchEvent(new CustomEvent('unica:punyako-diagnosis-complete',{detail:result}));
}
function addHistory(result){const h=read(HISTORY_KEY,[]);if(!h.some(x=>x.runId===result.runId))h.unshift(result);write(HISTORY_KEY,h.slice(0,50))}
function makeResult(){const t=finalType(),st=stats();return {schema:'punyako-v3',runId:'pk_'+Date.now().toString(36),typeId:t.id,flower:t.icon,scentName:t.name,flowerMeaning:t.core,stats:st,diagnosedDate:today(),message:`${t.name}。${t.core}`,route:{stage2:stage2(),stage3:stage3(),pair:pair()},answers:[...answers],createdAt:Date.now()}}
function open(){if(!member()){document.getElementById('openMemberGate')?.click();return}modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');document.body.classList.add('member-gate-open');showIntro()}
function close(){modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('member-gate-open');backHandler=null}
function setBack(fn){backHandler=fn;const b=$('#scent16NavBack');if(b)b.style.visibility=fn?'visible':'hidden'}
function headerBack(){if(backHandler)return backHandler();close()}
function charHtml(info,extra=''){return `<button class="punyako-character ${extra}" id="punyakoCharacter" type="button" aria-label="${esc(info.name)}をぷにぷにする"><span class="punyako-character-glow"></span><img src="${esc(info.image)}" alt="${esc(info.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="punyako-img-fallback">✦</span><small>${esc(info.name)}</small></button>`}
function bindSquish(){const el=$('#punyakoCharacter');if(!el)return;el.onclick=()=>{el.classList.remove('is-tapped');void el.offsetWidth;el.classList.add('is-tapped');setTimeout(()=>el.classList.remove('is-tapped'),520)}}
function showIntro(){
 setBack(close);const r=activeResult()||member()?.scentDiagnosis,p=read(PROGRESS_KEY,null),n=Math.min(p?.answers?.length||0,25);
 if(title)title.textContent='ぷにゃこ診断';
 const t=r?.typeId?TYPE_MAP[r.typeId]:null;
 screen.className='scent16-screen punyako-screen punyako-intro-bg';
 screen.innerHTML=`<div class="punyako-intro"><small class="punyako-kicker">ぷにゃこ診断</small>${charHtml(t||{name:'ぷにゅか',image:ASSET+'stage1_base.webp'})}<h3>${t?'あなたのぷにゅか':'こころの旅へ、出発しよう。'}</h3><p>${t?`いま一緒にいるのは <b>${esc(t.name)}</b>。もう一度旅をすると、別のぷにゅかや新しい性格に出会えるかもしれません。`:'25の小さな物語を選んでいくと、ぷにゅかが少しずつ進化します。正解はありません。いちばん自然に感じた方を選んでください。'}</p><div class="punyako-intro-meta"><span>25 QUESTIONS</span><span>1 → 2 → 4 → 16</span><span>AUTO SAVE</span></div>${n?`<button class="punyako-primary" id="punyakoResume">続きから <b>${n}/25</b></button><button class="punyako-secondary" id="punyakoRestart">最初からやり直す</button>`:`<button class="punyako-primary" id="punyakoStart">診断をはじめる</button>`}${r?`<button class="punyako-secondary" id="punyakoMyResult">今の結果を見る</button>`:''}<button class="punyako-text-button" id="punyakoHistory">診断履歴</button><div class="punyako-world-count" id="punyakoWorldCount">みんなの診断人数を読み込み中…</div></div>`;
 bindSquish();
 $('#punyakoStart')?.addEventListener('click',startNew);$('#punyakoResume')?.addEventListener('click',()=>{loadProgress();showQuestion()});$('#punyakoRestart')?.addEventListener('click',()=>{if(confirm('途中の回答を消して最初から始めますか？'))startNew()});$('#punyakoMyResult')?.addEventListener('click',()=>showResult(r));$('#punyakoHistory')?.addEventListener('click',showHistory);refreshWorldCount();
}
async function refreshWorldCount(){const el=$('#punyakoWorldCount');if(!el)return;try{for(let i=0;i<40&&!window.UNICA_FIREBASE?.loadScentMembers;i++)await new Promise(r=>setTimeout(r,100));const rows=await window.UNICA_FIREBASE?.loadScentMembers?.();const n=Array.isArray(rows)?rows.filter(x=>String(x?.scentDiagnosis?.typeId||'').startsWith('punyuka_')).length:0;el.textContent=`ぷにゃこ診断 ${n}人が完了`;}catch{el.textContent='あなたのぷにゅかを見つけよう'}}
function startNew(){answers=[];qIndex=0;saveProgress();showQuestion()}
function showQuestion(){
 qIndex=clamp(qIndex,0,24);const qu=currentQuestion(),ch=chapter(),info=form(),progress=Math.round((qIndex/25)*100);setBack(()=>{if(qIndex<=0)return showIntro();qIndex--;saveProgress();showQuestion()});
 screen.className=`scent16-screen punyako-screen punyako-chapter-${ch[2]}`;
 screen.innerHTML=`<div class="punyako-question"><div class="punyako-progress-head"><span>${esc(ch[0])} <b>${esc(ch[1])}</b></span><em>${qIndex+1} / 25</em></div><div class="punyako-progress"><i style="width:${progress}%"></i></div>${charHtml(info)}<div class="punyako-question-card"><small>QUESTION ${String(qIndex+1).padStart(2,'0')}</small><h3>${esc(qu.text)}</h3><div class="punyako-options">${qu.options.map((x,i)=>`<button type="button" data-punyako-choice="${i}" class="${answers[qIndex]?.choiceIndex===i?'is-selected':''}"><span>${String.fromCharCode(65+i)}</span><b>${esc(x.label)}</b></button>`).join('')}</div></div><p class="punyako-question-hint">考えすぎず、「こっちかも」で選んでOK。</p></div>`;
 bindSquish();screen.querySelectorAll('[data-punyako-choice]').forEach(b=>b.addEventListener('click',()=>answer(Number(b.dataset.punyakoChoice))));
}
function answer(choiceIndex){const qu=currentQuestion(),opt=qu.options[choiceIndex];answers=answers.slice(0,qIndex);answers[qIndex]={choiceIndex,route:opt.route||null,stats:opt.stats||{}};const char=$('#punyakoCharacter');char?.classList.add('is-reacting');screen.querySelectorAll('[data-punyako-choice]').forEach(b=>b.disabled=true);const answered=qIndex+1;qIndex++;saveProgress();setTimeout(()=>{if(answered===5)return showEvolution('stage2');if(answered===10)return showEvolution('stage3');if(answered===25)return finishDiagnosis();showQuestion()},420)}
function showEvolution(kind){const info=kind==='stage2'?(stage2()==='ear'?{name:'みみぷにゅか',image:ASSET+'stage2_ear.webp'}:{name:'はねぷにゅか',image:ASSET+'stage2_wing.webp'}):form();const label=kind==='stage2'?'ぷにゅかが変化した！':'さらに進化した！';setBack(null);screen.className='scent16-screen punyako-screen punyako-evolution-bg';screen.innerHTML=`<div class="punyako-evolution"><div class="punyako-evolution-ring"></div><small>EVOLUTION</small>${charHtml(info,'is-evolving')}<h3>${label}</h3><strong>${esc(info.name)}</strong><p>こころの選び方が、少しずつ姿になっています。</p><button class="punyako-primary" id="punyakoEvolutionNext">つづける</button></div>`;bindSquish();$('#punyakoEvolutionNext').onclick=showQuestion}
function finishDiagnosis(){clearProgress();const result=makeResult();addHistory(result);const t=TYPE_MAP[result.typeId];setBack(null);screen.className='scent16-screen punyako-screen punyako-final-bg';screen.innerHTML=`<div class="punyako-evolution punyako-final-evolution"><div class="punyako-evolution-ring"></div><small>FINAL EVOLUTION</small>${charHtml(t,'is-evolving')}<h3>あなたのぷにゅかが生まれました！</h3><strong>${esc(t.name)}</strong><p>${esc(t.core)}</p><button class="punyako-primary" id="punyakoFinalNext">結果を見る</button></div>`;bindSquish();$('#punyakoFinalNext').onclick=()=>{const old=activeResult();if(old?.typeId===result.typeId&&old?.runId!==result.runId)showSameTypeChoice(result,old);else{saveActive(result);showResult(result)}}}
function showSameTypeChoice(result,old){const t=TYPE_MAP[result.typeId];setBack(showIntro);screen.className='scent16-screen punyako-screen punyako-result-bg';screen.innerHTML=`<div class="punyako-same"><small>SAME PUNYUKA, NEW HEART</small>${charHtml(t)}<h3>また ${esc(t.name)} になりました！</h3><p>同じぷにゅかでも、今回の答えで性格の形が少し変わっています。今回の性格データを使いますか？</p><button class="punyako-primary" id="useNewProfile">今回の性格を使う</button><button class="punyako-secondary" id="keepOldProfile">今の性格のまま</button><small class="punyako-note">今回の結果も診断履歴には保存されています。</small></div>`;bindSquish();$('#useNewProfile').onclick=()=>{saveActive(result);showResult(result)};$('#keepOldProfile').onclick=()=>showResult(old)}
function radarSvg(st){const cx=120,cy=120,r=78,levels=[.25,.5,.75,1],pts=(rad)=>AXES.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/5;return `${cx+Math.cos(a)*r*rad},${cy+Math.sin(a)*r*rad}`}).join(' ');const valuePts=AXES.map((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,rr=r*(clamp(st?.[k]||50,0,100)/100);return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(' ');return `<svg class="punyako-radar" viewBox="0 0 240 240" aria-label="性格の五角形グラフ">${levels.map(l=>`<polygon points="${pts(l)}" class="grid"></polygon>`).join('')}${AXES.map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/5;return `<line x1="${cx}" y1="${cy}" x2="${cx+Math.cos(a)*r}" y2="${cy+Math.sin(a)*r}" class="axis"></line>`}).join('')}<polygon points="${valuePts}" class="value"></polygon>${AXES.map((k,i)=>{const a=-Math.PI/2+i*2*Math.PI/5,rr=r+24;return `<text x="${cx+Math.cos(a)*rr}" y="${cy+Math.sin(a)*rr+4}" text-anchor="middle">${AXIS_LABEL[k]}</text>`}).join('')}</svg>`}
function showResult(raw){const t=TYPE_MAP[raw?.typeId];if(!t)return showIntro();const result={...raw,scentName:raw.scentName||t.name,stats:raw.stats||{}};setBack(showIntro);screen.className='scent16-screen punyako-screen punyako-result-bg';screen.innerHTML=`<div class="punyako-result"><small class="punyako-kicker">YOUR PUNYUKA</small>${charHtml(t)}<h3>${esc(t.name)}</h3><p class="punyako-core">${esc(t.core)}</p><section class="punyako-radar-wrap"><div>${radarSvg(result.stats)}</div><ul>${AXES.map(k=>`<li><span>${AXIS_LABEL[k]}</span><b>${clamp(result.stats?.[k]||50,0,100)}</b></li>`).join('')}</ul></section><div class="punyako-result-cards"><article><small>あなたの強み</small><p>${esc(t.strength)}</p></article><article><small>回復のヒント</small><p>${esc(t.recharge)}</p></article><article><small>ぷにゅかから一言</small><p>${esc(t.advice)}</p></article></div><div class="punyako-result-actions"><button class="punyako-primary" id="punyakoRedo">もう一度診断する</button><button class="punyako-secondary" id="punyakoHistoryFromResult">診断履歴を見る</button><button class="punyako-text-button" id="punyakoBackHome">ぷにゃこ診断トップへ</button></div></div>`;bindSquish();$('#punyakoRedo').onclick=()=>{if(confirm('新しく25問の旅を始めますか？'))startNew()};$('#punyakoHistoryFromResult').onclick=showHistory;$('#punyakoBackHome').onclick=showIntro}
function showHistory(){const hist=read(HISTORY_KEY,[]);setBack(()=>{const r=activeResult();r?showResult(r):showIntro()});screen.className='scent16-screen punyako-screen punyako-result-bg';screen.innerHTML=`<div class="punyako-history"><small class="punyako-kicker">DIAGNOSIS HISTORY</small><h3>診断履歴</h3><p>過去の性格データへいつでも戻せます。</p>${hist.length?`<div class="punyako-history-list">${hist.map((r,i)=>{const t=TYPE_MAP[r.typeId];if(!t)return'';return `<article><img src="${esc(t.image)}" alt=""><div><strong>${esc(t.name)}</strong><small>${esc(r.diagnosedDate||'')}</small><span>${AXES.map(k=>`${AXIS_LABEL[k]} ${r.stats?.[k]??50}`).join(' · ')}</span></div><button type="button" data-restore-history="${i}">この性格に戻す</button></article>`}).join('')}</div>`:'<div class="punyako-empty">まだ診断履歴がありません。</div>'}<button class="punyako-secondary" id="punyakoHistoryBack">戻る</button></div>`;screen.querySelectorAll('[data-restore-history]').forEach(b=>b.onclick=()=>{const r=hist[Number(b.dataset.restoreHistory)];if(!r)return;if(confirm(`${TYPE_MAP[r.typeId]?.name||'このぷにゅか'}のこの性格に戻しますか？`)){saveActive(r);showResult(r)}});$('#punyakoHistoryBack').onclick=()=>{const r=activeResult();r?showResult(r):showIntro()}}

$('#openScent16')?.addEventListener('click',e=>{e.preventDefault();open()});$('#scent16NavBack')?.addEventListener('click',headerBack);$('#scent16Exit')?.addEventListener('click',close);document.querySelectorAll('[data-close-scent16]').forEach(x=>x.addEventListener('click',close));window.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});window.addEventListener('unica:firebase-member-restored',updateHome);window.addEventListener('unica:scent-diagnosis-saved',updateHome);
if(title)title.textContent='ぷにゃこ診断';const headSmall=modal.querySelector('.scent16-header small');if(headSmall)headSmall.textContent='ぷにゃこ診断';updateHome();
window.UNICA_SCENT16={close,typeById:id=>TYPE_MAP[id]||null,getMyResult:()=>activeResult()||member()?.scentDiagnosis,getProgress:()=>read(PROGRESS_KEY,null),showIntro,startDiagnosis:startNew,showResult};
})();
