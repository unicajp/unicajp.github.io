(()=>{'use strict';
const CATALOG={
  "mask": {
    "name": "仮面の裏側",
    "reward": "アイコン枠",
    "slot": "frame",
    "lead": "平気な顔の奥に、置いてきた願いはありませんか。",
    "questions": [
      {
        "text": "本当は断りたいお願いに「いいよ」と返した。いちばん残る気持ちは？",
        "options": [
          {
            "text": "察して、少し気遣ってほしい",
            "value": 0
          },
          {
            "text": "自分で決めた以上、やり切りたい",
            "value": 1
          },
          {
            "text": "相手が安心するなら、それでいい",
            "value": 2
          },
          {
            "text": "次は無理せず断る方法を考えたい",
            "value": 3
          }
        ]
      },
      {
        "text": "「いつも余裕があるね」と言われた。本音に近いのは？",
        "options": [
          {
            "text": "崩れない自分でいたい",
            "value": 1
          },
          {
            "text": "心配をかけずに済んでよかった",
            "value": 2
          },
          {
            "text": "見せたい面だけ見せられている",
            "value": 3
          },
          {
            "text": "余裕がない部分も気づいてほしい",
            "value": 0
          }
        ]
      },
      {
        "text": "欲しかった役割を、別の人に譲った夜。何を考える？",
        "options": [
          {
            "text": "あの人が喜んでいてよかった",
            "value": 2
          },
          {
            "text": "本当に欲しかったものを整理する",
            "value": 3
          },
          {
            "text": "悔しさを誰かに分かってほしい",
            "value": 0
          },
          {
            "text": "次は自分で取りにいこう",
            "value": 1
          }
        ]
      },
      {
        "text": "弱音を送ろうとして、文章を消した。なぜ？",
        "options": [
          {
            "text": "まだ自分の気持ちがまとまらない",
            "value": 3
          },
          {
            "text": "重いと思われるのが怖かった",
            "value": 0
          },
          {
            "text": "頼る前に自分で何とかしたかった",
            "value": 1
          },
          {
            "text": "相手も大変そうだった",
            "value": 2
          }
        ]
      },
      {
        "text": "誰にも評価されない時間ができたら？",
        "options": [
          {
            "text": "しまっていた感情を表に出したい",
            "value": 0
          },
          {
            "text": "自分の好きなことに没頭したい",
            "value": 1
          },
          {
            "text": "安心できる人とゆっくり過ごしたい",
            "value": 2
          },
          {
            "text": "誰にも合わせず、静かに戻りたい",
            "value": 3
          }
        ]
      },
      {
        "text": "褒め言葉で、いちばん心に残りそうなのは？",
        "options": [
          {
            "text": "あなたが決めた道、素敵だね",
            "value": 1
          },
          {
            "text": "あなたがいて助かったよ",
            "value": 2
          },
          {
            "text": "そのままのペースで大丈夫だよ",
            "value": 3
          },
          {
            "text": "見えないところで頑張っていたね",
            "value": 0
          }
        ]
      },
      {
        "text": "大切な人に、今日ひとつだけ本音を言えるなら？",
        "options": [
          {
            "text": "本当は、私も甘えてみたい",
            "value": 2
          },
          {
            "text": "一人でいる時間も大切にしたい",
            "value": 3
          },
          {
            "text": "もう少し、私の変化に気づいて",
            "value": 0
          },
          {
            "text": "私にも選ばせてほしい",
            "value": 1
          }
        ]
      },
      {
        "text": "みんなが賛成する中で、自分だけ違う意見だったら？",
        "options": [
          {
            "text": "今言うか、後で話すか見極める",
            "value": 3
          },
          {
            "text": "分かってくれそうな人を探す",
            "value": 0
          },
          {
            "text": "理由を整理して伝える",
            "value": 1
          },
          {
            "text": "まず相手の話を最後まで聞く",
            "value": 2
          }
        ]
      },
      {
        "text": "笑ってごまかしたあと、よくすることは？",
        "options": [
          {
            "text": "一人になって気持ちをほどく",
            "value": 0
          },
          {
            "text": "別のことをして力を取り戻す",
            "value": 1
          },
          {
            "text": "いつも通り相手に接する",
            "value": 2
          },
          {
            "text": "なぜごまかしたか考えてみる",
            "value": 3
          }
        ]
      },
      {
        "text": "仮面を一晩だけ外せるなら、手放したいのは？",
        "options": [
          {
            "text": "期待通りに動くこと",
            "value": 1
          },
          {
            "text": "誰かの役に立ち続けること",
            "value": 2
          },
          {
            "text": "すぐ気持ちを説明すること",
            "value": 3
          },
          {
            "text": "大丈夫に見せること",
            "value": 0
          }
        ]
      }
    ],
    "results": [
      {
        "id": "mask_0",
        "rewardName": "月影のヴェール",
        "headline": "見つけてほしい本音",
        "reading": "平気なふりの奥に、「気づいてほしい」という願いが見えます。自分の変化を言葉にする前に、相手が察してくれるのを待つことがあるかもしれません。",
        "protect": "感情を一度包むことで、その場の関係や自分の落ち着きを守ってきたのかもしれません。",
        "friction": "相手には「困っていない」と伝わることも。気づかれないことと、大切にされていないことは同じとは限りません。",
        "tip": "「今日は少し聞いてほしい」と、お願いを一文だけ渡してみましょう。"
      },
      {
        "id": "mask_1",
        "rewardName": "紅薔薇の意志",
        "headline": "自分で選びたい本音",
        "reading": "期待に応える顔の奥に、「自分の意思で選びたい」という願いが見えます。やり切る力がある分、望みまで後回しにすることもありそうです。",
        "protect": "自分で立つことや、弱さだけで判断されないことを大切にしてきたのかもしれません。",
        "friction": "助けが不要だと思われると、負担が集まりやすくなることも。頼ることと、意思を失うことは別です。",
        "tip": "小さな予定を一つ、「私はこうしたい」から決めてみましょう。"
      },
      {
        "id": "mask_2",
        "rewardName": "金鏡のぬくもり",
        "headline": "受け取ってもいい本音",
        "reading": "人を安心させる顔の奥に、「自分も甘えたい」という願いが見えます。相手の喜びを大切にする一方、自分のお願いは小さくしがちかもしれません。",
        "protect": "誰かと支え合える居場所を、丁寧に育ててきたのかもしれません。",
        "friction": "差し出すばかりだと、相手が返す機会を見つけられないことも。何も頼まないやさしさが、距離になる場合もあります。",
        "tip": "「今日はこれをお願いしてもいい？」と、一つ受け取る練習をしてみましょう。"
      },
      {
        "id": "mask_3",
        "rewardName": "銀霧の余白",
        "headline": "急がずほどきたい本音",
        "reading": "落ち着いた顔の奥に、「まだ言葉にしなくていい時間」が必要なのかもしれません。気持ちを整えてから見せたいという答えが目立ちます。",
        "protect": "自分のペースと、感じたことを自分で確かめる時間を守ってきたのかもしれません。",
        "friction": "沈黙だけだと、拒絶されたと受け取られることも。考える時間が必要だと伝えるだけで、誤解を減らせそうです。",
        "tip": "「少し考えて、あとで話したい」と、時間の目安も添えてみましょう。"
      }
    ]
  },
  "bonds": {
    "name": "やさしさの代償",
    "reward": "称号",
    "slot": "title",
    "lead": "その「大丈夫」は、誰のための言葉でしょう。",
    "questions": [
      {
        "text": "相手の相談に長く付き合ったあと、返事が来ない。どう感じる？",
        "options": [
          {
            "text": "聞いてほしい時は、私も頼っていい？",
            "value": 0
          },
          {
            "text": "次は付き合える時間を先に伝えよう",
            "value": 1
          },
          {
            "text": "落ち着けたなら、それでよかった",
            "value": 2
          },
          {
            "text": "今は少し距離を置いて休みたい",
            "value": 3
          }
        ]
      },
      {
        "text": "予定を相手に合わせ続けた。次の約束では？",
        "options": [
          {
            "text": "今回は自分から候補を出す",
            "value": 1
          },
          {
            "text": "相手が楽しめる予定を考える",
            "value": 2
          },
          {
            "text": "会う頻度そのものを見直す",
            "value": 3
          },
          {
            "text": "たまには私の希望も聞いてほしい",
            "value": 0
          }
        ]
      },
      {
        "text": "頼られてうれしい一方、疲れている。近いのは？",
        "options": [
          {
            "text": "困っていると、つい手が伸びる",
            "value": 2
          },
          {
            "text": "いったん一人で回復したい",
            "value": 3
          },
          {
            "text": "必要とされなくなるのが少し怖い",
            "value": 0
          },
          {
            "text": "できる範囲を決めて引き受ける",
            "value": 1
          }
        ]
      },
      {
        "text": "親しい人の成功を喜んだあと、少し寂しくなったら？",
        "options": [
          {
            "text": "寂しさを言葉にする前に整理する",
            "value": 3
          },
          {
            "text": "置いていかれそうな気持ちも伝えたい",
            "value": 0
          },
          {
            "text": "自分の目標へ戻りたい",
            "value": 1
          },
          {
            "text": "今は相手のお祝いを大切にする",
            "value": 2
          }
        ]
      },
      {
        "text": "「何でもいいよ」が続いたとき、実は？",
        "options": [
          {
            "text": "私の好きなものを選んでくれるとうれしい",
            "value": 0
          },
          {
            "text": "候補を二つに絞って進めたい",
            "value": 1
          },
          {
            "text": "一緒なら何でも楽しめる",
            "value": 2
          },
          {
            "text": "決めるための余力がほしい",
            "value": 3
          }
        ]
      },
      {
        "text": "相手が不機嫌そう。最初の反応は？",
        "options": [
          {
            "text": "理由を聞いて、必要なら話す",
            "value": 1
          },
          {
            "text": "楽になるように手伝いたい",
            "value": 2
          },
          {
            "text": "落ち着くまで少し待つ",
            "value": 3
          },
          {
            "text": "私が何かしたか気になる",
            "value": 0
          }
        ]
      },
      {
        "text": "断ったあとも気持ちが残るのは、どんなとき？",
        "options": [
          {
            "text": "相手が困ったままなのが気になる",
            "value": 2
          },
          {
            "text": "後から何度も連絡が来るとき",
            "value": 3
          },
          {
            "text": "冷たく思われていないか気になる",
            "value": 0
          },
          {
            "text": "言い方をもっと工夫できたと思う",
            "value": 1
          }
        ]
      },
      {
        "text": "やさしさに、お返しを望むとしたら？",
        "options": [
          {
            "text": "断る自由や一人の時間がほしい",
            "value": 3
          },
          {
            "text": "気持ちや頑張りに気づいてほしい",
            "value": 0
          },
          {
            "text": "約束や言葉を大切にしてほしい",
            "value": 1
          },
          {
            "text": "困ったとき、そばにいてほしい",
            "value": 2
          }
        ]
      },
      {
        "text": "会うと楽しいのに、帰ると疲れる相手。次は？",
        "options": [
          {
            "text": "どこで気を張っていたか振り返る",
            "value": 0
          },
          {
            "text": "会う時間を短く提案する",
            "value": 1
          },
          {
            "text": "自分から安心できる話題を出す",
            "value": 2
          },
          {
            "text": "少し間隔を空けてみる",
            "value": 3
          }
        ]
      },
      {
        "text": "人と近づくとき、守りたいものは？",
        "options": [
          {
            "text": "お互いの意思を尊重できること",
            "value": 1
          },
          {
            "text": "助け合える安心感",
            "value": 2
          },
          {
            "text": "自分に戻れる余白",
            "value": 3
          },
          {
            "text": "気持ちを受け止め合えること",
            "value": 0
          }
        ]
      }
    ],
    "results": [
      {
        "id": "bonds_0",
        "rewardName": "微笑みの奥の願い",
        "headline": "気づいてほしいやさしさ",
        "reading": "気持ちを汲み取ってほしいという願いと、相手を大切にする姿勢が重なっています。やさしくしたあと、分かってもらえたか気になることがありそうです。",
        "protect": "相手とのつながりや、自分の存在が大切にされている感覚。",
        "friction": "期待が言葉にならないと、相手は返し方を知らないままかもしれません。",
        "tip": "「私も話を聞いてもらえるとうれしい」と、欲しいやさしさを具体的にしてみましょう。"
      },
      {
        "id": "bonds_1",
        "rewardName": "境界を結ぶ人",
        "headline": "意思を持つやさしさ",
        "reading": "相手への配慮と、自分で選ぶことを両立したい答えが見えます。関係が曖昧になるより、範囲や約束を決めたいのかもしれません。",
        "protect": "お互いが無理を重ねず、対等に関われること。",
        "friction": "整理を急ぐと、相手の気持ちが置いていかれる場合も。まず共感を一言添えると、線引きが伝わりやすくなりそうです。",
        "tip": "「気持ちは分かる。私にできるのはここまで」と、両方を一度に伝えてみましょう。"
      },
      {
        "id": "bonds_2",
        "rewardName": "ぬくもりの灯守",
        "headline": "差し出すやさしさ",
        "reading": "困っている人を見ると、自然に支える側へ回る答えが目立ちます。相手の安心が、自分の喜びにもつながっているのかもしれません。",
        "protect": "頼れる関係や、誰かと一緒にいられる安心感。",
        "friction": "疲れを隠すほど、周りは限界を知りにくくなります。断ることは、これまでのやさしさを取り消すことではありません。",
        "tip": "手伝う前に「今の自分には余力がある？」と、一度だけ確かめてみましょう。"
      },
      {
        "id": "bonds_3",
        "rewardName": "余白を愛する人",
        "headline": "離れて守るやさしさ",
        "reading": "相手を嫌いにならないためにも、自分に戻る余白を確保したい答えが見えます。近さだけで関係の深さを測らない一面がありそうです。",
        "protect": "休む自由と、無理なく続けられる距離感。",
        "friction": "急に連絡を減らすと、相手が不安になることも。離れる理由を短く共有すると、余白を一緒に守れそうです。",
        "tip": "「少し休むけれど、また話したい」と、関係を続ける意思も添えてみましょう。"
      }
    ]
  },
  "guard": {
    "name": "こころの防衛線",
    "reward": "アイコン背景",
    "slot": "background",
    "lead": "傷つく前に引いた線。その内側にあるものを見つめます。",
    "questions": [
      {
        "text": "大切な約束が急になくなった。最初にすることは？",
        "options": [
          {
            "text": "一人で残念な気持ちを落ち着かせる",
            "value": 0
          },
          {
            "text": "事情を確認して次の予定を決める",
            "value": 1
          },
          {
            "text": "相手の事情を気遣う",
            "value": 2
          },
          {
            "text": "別の予定を入れて切り替える",
            "value": 3
          }
        ]
      },
      {
        "text": "きつい言い方をされた。自分を守るなら？",
        "options": [
          {
            "text": "どういう意味か、静かに聞き返す",
            "value": 1
          },
          {
            "text": "信頼できる人に話す",
            "value": 2
          },
          {
            "text": "今は受け取らないと決める",
            "value": 3
          },
          {
            "text": "その場を離れ、言葉を飲み込まない時間を取る",
            "value": 0
          }
        ]
      },
      {
        "text": "秘密にしている悩みに触れられたら？",
        "options": [
          {
            "text": "安心できる相手か確かめたい",
            "value": 2
          },
          {
            "text": "別の話に移って距離を保ちたい",
            "value": 3
          },
          {
            "text": "まだ話せないと伝えたい",
            "value": 0
          },
          {
            "text": "話す範囲を自分で決めたい",
            "value": 1
          }
        ]
      },
      {
        "text": "忙しい日が続くと、まず減らしたいものは？",
        "options": [
          {
            "text": "今すぐ結論を出すこと",
            "value": 3
          },
          {
            "text": "人や音から入る情報",
            "value": 0
          },
          {
            "text": "自分で選べない予定",
            "value": 1
          },
          {
            "text": "誰かを心配する役割",
            "value": 2
          }
        ]
      },
      {
        "text": "失敗した夜に、欲しい場所は？",
        "options": [
          {
            "text": "誰にも見られず、休める場所",
            "value": 0
          },
          {
            "text": "やり直す手順を考えられる場所",
            "value": 1
          },
          {
            "text": "黙って隣にいてもらえる場所",
            "value": 2
          },
          {
            "text": "いつもと違う景色のある場所",
            "value": 3
          }
        ]
      },
      {
        "text": "相手との距離を置くとき、自分に近いのは？",
        "options": [
          {
            "text": "必要な境界線を言葉にする",
            "value": 1
          },
          {
            "text": "安心できるつながりは残しておく",
            "value": 2
          },
          {
            "text": "別の活動へ意識を移す",
            "value": 3
          },
          {
            "text": "気持ちが落ち着くまで静かになる",
            "value": 0
          }
        ]
      },
      {
        "text": "何度も気になる一言を、どう扱いたい？",
        "options": [
          {
            "text": "誰かと話して別の見方を得る",
            "value": 2
          },
          {
            "text": "思い出さずに済む時間を増やす",
            "value": 3
          },
          {
            "text": "本当は悲しかったと認める",
            "value": 0
          },
          {
            "text": "次に言われたら返す言葉を考える",
            "value": 1
          }
        ]
      },
      {
        "text": "安心が戻ってきたと分かるのは？",
        "options": [
          {
            "text": "小さなことを楽しめたとき",
            "value": 3
          },
          {
            "text": "静かな時間が心地よくなったとき",
            "value": 0
          },
          {
            "text": "自分で次を選べたとき",
            "value": 1
          },
          {
            "text": "人に頼れるようになったとき",
            "value": 2
          }
        ]
      },
      {
        "text": "境界線を越えられたと感じるのは？",
        "options": [
          {
            "text": "気持ちを急いで説明させられたとき",
            "value": 0
          },
          {
            "text": "自分の意思を決めつけられたとき",
            "value": 1
          },
          {
            "text": "大切な人や関係を軽く扱われたとき",
            "value": 2
          },
          {
            "text": "休むことや離れることを止められたとき",
            "value": 3
          }
        ]
      },
      {
        "text": "明日の自分に、ひとつ渡すなら？",
        "options": [
          {
            "text": "自分で選べる小さな自由",
            "value": 1
          },
          {
            "text": "安心して頼れるつながり",
            "value": 2
          },
          {
            "text": "ここから離れてもいいという許可",
            "value": 3
          },
          {
            "text": "静かに休める夜",
            "value": 0
          }
        ]
      }
    ],
    "results": [
      {
        "id": "guard_0",
        "rewardName": "月夜の聖域",
        "headline": "静けさで守るこころ",
        "reading": "刺激や言葉から少し離れ、自分の気持ちを確かめる時間が回復につながりそうです。静かな場所が、防衛線の内側にあるのかもしれません。",
        "protect": "感情を急いで説明せず、自分の感覚を取り戻すこと。",
        "friction": "一人で抱え続けると、助けを求める機会まで減ってしまう場合があります。",
        "tip": "休む時間の終わりに、安心できる人へ短い連絡を一つ。静けさとつながりを両方残しましょう。"
      },
      {
        "id": "guard_1",
        "rewardName": "静焔の灯台",
        "headline": "選ぶ力で守るこころ",
        "reading": "状況を確かめ、自分で次を選べると安心が戻りやすい答えです。小さな行動や境界線が、こころの足場になるのかもしれません。",
        "protect": "自分の意思と、やり直せる感覚。",
        "friction": "対処を優先しすぎると、悲しさや疲れが置き去りになることも。解決の前に気持ちを認める時間も大切です。",
        "tip": "今変えられることを一つ選び、それ以外は今日は保留にしてみましょう。"
      },
      {
        "id": "guard_2",
        "rewardName": "星灯りの庭",
        "headline": "つながりで守るこころ",
        "reading": "安心できる人とのつながりが、傷ついた気持ちの支えになりそうです。黙ってそばにいてもらえることにも、力を感じるかもしれません。",
        "protect": "一人で全部を背負わずにいられる居場所。",
        "friction": "安心を一人の相手に集中させると、その人が不在の時に苦しくなることも。支えは少しずつ複数に分けられます。",
        "tip": "人・場所・習慣から、落ち着けるものを一つずつ書き留めてみましょう。"
      },
      {
        "id": "guard_3",
        "rewardName": "水鏡の逃げ道",
        "headline": "余白で守るこころ",
        "reading": "別の景色や活動に目を向けると、気持ちを切り替えやすい答えが見えます。離れてもいいという選択肢が、安心を支えていそうです。",
        "protect": "一つの出来事に閉じ込められない自由。",
        "friction": "切り替え続けるうちに、扱いたかった気持ちが残ることも。落ち着いたあと、戻るかどうかを選べば大丈夫です。",
        "tip": "いつ戻るかを急いで決めず、「今日はここまで」と区切る言葉を持ってみましょう。"
      }
    ]
  }
};
const KEYS=['mask','bonds','guard'],AXES=['kindness','action','curiosity','sensitivity','flexibility'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function resultById(id){for(const b of Object.values(CATALOG)){const r=b.results.find(r=>r.id===id);if(r)return r;}return null;}
function eligible(profile){const j=profile?.punyakoJourney,r=profile?.scentDiagnosis;return Number(j?.completedQuestions)>=25||Number(j?.analysisQuestions)>=25||(r?.schema==='punyako-v4'&&/^punyuka_(0[1-9]|1[0-6])$/.test(r.typeId));}
function baseStats(profile){const s=profile?.punyakoJourney?.analysisStats||profile?.scentDiagnosis?.stats||{};return AXES.map(k=>Math.round(Math.max(0,Math.min(100,Number(s[k])||50))));}
function validAnswers(a){return Array.isArray(a)&&a.length<=10&&a.every(v=>Number.isInteger(v)&&v>=0&&v<=3);}
function evaluate(key,answers,base){if(!KEYS.includes(key)||!validAnswers(answers)||answers.length!==10)throw Error('10問に答えてください。');const b=Array.isArray(base)&&base.length===5?base:[50,50,50,50,50];const score=[0,0,0,0];answers.forEach(v=>score[v]+=3);const prior=key==='bonds'?[b[3],b[1],(b[0]+b[4])/2,(b[4]+b[2])/2]:[b[3],(b[1]+b[2])/2,b[0],b[4]];prior.forEach((v,i)=>score[i]+=v>=65?2:v>=50?1:0);const order=[0,1,2,3].sort((a,b)=>score[b]-score[a]||a-b);return {...CATALOG[key].results[order[0]],secondary:CATALOG[key].results[order[1]],secondaryAnswered:answers.includes(order[1]),score};}
function normalizedDecor(raw={}){const out={};for(const [slot,list,key]of[['frame','frames','mask'],['title','titles','bonds'],['background','backgrounds','guard']]){out[list]=[...new Set((Array.isArray(raw[list])?raw[list]:[]).filter(id=>CATALOG[key].results.some(r=>r.id===id)))];out[slot]=out[list].includes(raw[slot])?raw[slot]:'';}return out;}
function avatarAttrs(profile){const d=normalizedDecor(profile?.deepDecor);return (d.frame?`data-deep-frame="${d.frame}" `:'')+(d.background?`data-deep-bg="${d.background}"`:'');}
function titleHtml(profile){const d=normalizedDecor(profile?.deepDecor),r=resultById(d.title);return r?`<span class="deep-name-title">〈${esc(r.rewardName)}〉</span>`:'';}
let bridge=null,state=null,view=0;
const host=()=>document.getElementById('deep109');
function frame(title,html){view++;bridge.frame(title,`<div class="deep109" id="deep109">${html}</div>`);document.getElementById('scent16Modal')?.classList.add('deep110-area');document.querySelector('#deep109')?.closest('.pk-insights')?.querySelector('.pk-companion')?.remove();}
function notice(text){const el=host()?.querySelector('[data-deep-status]');if(el)el.textContent=text;}
function errorText(e){return /permission-denied/.test(e?.code||'')?'保存先の追加ルールがまだ反映されていません。運営にお知らせください。':e?.message||'読み込めませんでした。通信を確認してください。';}
async function open(apiBridge){bridge=apiBridge;const revision=view+1;frame('禁断の深掘り診断','<p data-deep-status role="status">秘密の扉を確認中…</p>');state=null;
try{const api=window.UNICA_FIREBASE;if(!api?.loadDeepDiagnosis)throw Error('読み込みを待って、もう一度開いてください。');const loaded=await api.loadDeepDiagnosis();if(view!==revision||!host())return;state=loaded;if(!eligible(loaded.profile)){frame('秘密の扉',`<div class="deep-hero"><span>🔒</span><h3>25問の、その先へ。</h3><p>通常のぷにゅか診断を25問終えると、3つの扉が開きます。</p></div>`);return;}menu();}catch(e){if(view===revision)notice(errorText(e));}}
function menu(){frame('禁断の深掘り診断',`<div class="deep-hero"><small>BEYOND THE MASK</small><h3>こころの、禁域へ。</h3><p>そのやさしさは、本音？<br>それとも、自分を守るため？</p></div><p class="deep-note">各10問・好きな順に。回答と詳しい結果は本人だけが見られます。途中で閉じても再開できます。</p><div class="deep-doors">${KEYS.map(key=>{const b=CATALOG[key],saved=state.data[key],n=saved?.answers?.length||0;return `<button type="button" data-deep-door="${key}"><small>${n===10?'✓ 診断済み':n?`${n}/10問 · つづきから`:'10問 · 未診断'}</small><b>${b.name}</b><span>${b.lead}</span><em>報酬：結果に応じた${b.reward} ›</em></button>`;}).join('')}</div><p class="deep-note">答えから傾向を振り返るための診断です。本音や性格、病気を断定するものではありません。</p>`);host().querySelectorAll('[data-deep-door]').forEach(b=>b.onclick=()=>{const key=b.dataset.deepDoor;if(state.data[key]?.answers?.length===10)showResult(key);else question(key);});}
async function persist(key,answers,base){const saved=await window.UNICA_FIREBASE.saveDeepDiagnosis(key,answers,base);return saved;}
function question(key,index=null){const branch=CATALOG[key],saved=state.data[key]||{},answers=[...(saved.answers||[])],base=saved.base||baseStats(state.profile),i=index??answers.length;if(i>=10)return showResult(key);const q=branch.questions[i];frame(branch.name+' · '+(i+1)+'/10',`<div class="deep-question-head"><button type="button" data-deep-menu>‹ 3つの扉へ</button><small>${i+1} / 10</small></div><progress class="deep-progress" max="10" value="${i}" aria-label="回答の進行"></progress><h3 class="deep-question">${q.text}</h3><div class="deep-answers">${q.options.map(o=>`<button type="button" data-deep-answer="${o.value}" aria-pressed="${answers[i]===o.value}">${o.text}</button>`).join('')}</div><button type="button" data-deep-back ${i?'':'hidden'}>‹ 前の質問</button><p data-deep-status role="status"></p>`);const version=view;host().querySelector('[data-deep-menu]').onclick=menu;host().querySelector('[data-deep-back]').onclick=()=>question(key,i-1);host().querySelectorAll('[data-deep-answer]').forEach(button=>button.onclick=async()=>{const all=[...host().querySelectorAll('button')];all.forEach(el=>el.disabled=true);notice('保存中…');try{const updated=await persist(key,[...answers.slice(0,i),Number(button.dataset.deepAnswer)],base);if(view!==version||!host())return;state=updated;if(i===9)showEquipChoice(key);else question(key,i+1);}catch(e){if(view===version){notice(errorText(e));all.forEach(el=>el.disabled=false);}}});}
function rewardPreview(key,id,profile=state?.profile){const b=CATALOG[key],decor=normalizedDecor(profile?.deepDecor),temp={...profile,deepDecor:{...decor,[b.slot]:id,[b.slot==='frame'?'frames':b.slot==='title'?'titles':'backgrounds']:[...decor[b.slot==='frame'?'frames':b.slot==='title'?'titles':'backgrounds'],id]}};return `<div class="deep-reward-preview">${window.UNICA_BLOOM_BADGE?.html?.(temp)||'✦'}<div>${titleHtml(temp)}<b>${esc(temp?.name||'うにメン')}</b></div></div>`;}
function showEquipChoice(key){
 const b=CATALOG[key],saved=state.data[key],r=evaluate(key,saved.answers,saved.base);
 frame('報酬を獲得しました',`<section class="deep-equip-choice"><small>REWARD UNLOCKED</small><h3>新しい${b.reward}を獲得！</h3><p>${b.name}</p><h4>${esc(r.rewardName)}</h4>${rewardPreview(key,r.id)}<p class="deep-note">今すぐこの${b.reward}を装備しますか？<br>ほかの装飾はそのまま。あとからうにパスで変更できます。</p><button type="button" data-deep-equip-now>今すぐ装備する</button><button type="button" data-deep-equip-later>あとで選ぶ・結果を見る</button><p data-deep-status role="status"></p></section>`);
 const revision=view,buttons=[...host().querySelectorAll('button')];
 host().querySelector('[data-deep-equip-later]').onclick=()=>showResult(key,true);
 host().querySelector('[data-deep-equip-now]').onclick=async()=>{buttons.forEach(b=>b.disabled=true);notice('装備を保存中…');try{const api=window.UNICA_FIREBASE;if(!api?.equipDeepReward)throw Error('再読み込みして、もう一度お試しください。');const profile=await api.equipDeepReward(key,r.id);if(view!==revision||!state||!host())return;state.profile=profile;showResult(key,true);notice('装備しました。うにパスや名前の表示にも反映されます。');}catch(e){if(view===revision&&host()){notice(errorText(e));buttons.forEach(b=>b.disabled=false);}}};
}
function showResult(key,earned=false){const saved=state.data[key],b=CATALOG[key],r=evaluate(key,saved.answers,saved.base);frame(b.name,`<article class="deep-result ${earned?'is-earned':''}"><small>${earned?'REWARD UNLOCKED':'SECRET PROFILE'}</small><h3>${r.headline}</h3><p>${r.reading}</p><h4>その振る舞いで守ってきたもの</h4><p>${r.protect}</p><h4>すれ違いが起きるとしたら</h4><p>${r.friction}</p><h4>自分を少し楽にする一歩</h4><p>${r.tip}</p><details><summary>もう一つの傾向</summary><p>${r.secondaryAnswered?`「${r.secondary.headline}」の答えも含まれています。`:`今回の10問では「${r.headline}」の答えに集まっています。`}ひとつの型に決めず、今の自分に合う部分を受け取ってください。</p></details><div class="deep-reward"><small>獲得した${b.reward}</small><h4>${r.rewardName}</h4>${rewardPreview(key,r.id)}<button type="button" data-deep-equip>うにパスで装備する ›</button></div><p class="deep-note">今回の10問を中心に、通常診断の5軸を補助として使っています。回答と詳しい結果は本人だけが見られます。装備した報酬は公開され、シェアは自分で選んだときだけ行われます。</p><section class="deep-share-section"><h4>この結果をシェアする</h4><p class="deep-note">カードには結果の要約・守ってきたもの・一歩のヒント・報酬名が入ります。質問への回答や、名前・会員番号は入りません。プレビューを確認してから共有できます。</p><div data-deep-share></div></section><div class="deep-result-actions"><button type="button" data-deep-menu>3つの扉へ</button><button type="button" data-deep-retake>もう一度振り返る</button></div><p data-deep-status role="status"></p></article>`);bridge.share?.(host().querySelector('[data-deep-share]'),`禁断の深掘り診断「${b.name}」\n今回の結果は「${r.headline}」。\n${r.reading}`,{theme:'deep',title:b.name,resultName:r.headline,subtitle:'10問から見えた、今のわたしの傾向',sections:[{label:'今回のこころの傾向',text:r.reading},{label:'守ってきたもの',text:r.protect},{label:'自分を楽にする一歩',text:r.tip},{label:'獲得した'+b.reward,text:r.rewardName}]});host().querySelector('[data-deep-menu]').onclick=menu;host().querySelector('[data-deep-equip]').onclick=()=>{window.UNICA_SCENT16?.close?.();document.getElementById('openUniPassDirect')?.click();};host().querySelector('[data-deep-retake]').onclick=async()=>{if(!confirm('この診断を最初から振り返りますか？獲得済みの報酬は残ります。'))return;const version=view;host().querySelectorAll('button').forEach(b=>b.disabled=true);try{const updated=await persist(key,[],baseStats(state.profile));if(version===view){state=updated;question(key);}}catch(e){if(version===view){notice(errorText(e));host().querySelectorAll('button').forEach(b=>b.disabled=false);}}};}
function renderWardrobe(container,profile){container._deepProfile=profile;const d=normalizedDecor(profile?.deepDecor);container.innerHTML=`<legend>枠・称号・アイコン背景</legend><div id="passDeepPreview"></div>${[['frame','frames','アイコン枠'],['title','titles','称号'],['background','backgrounds','背景']].map(([slot,list,label])=>`<label>${label}<select data-deep-select="${slot}"><option value="">付けない</option>${d[list].map(id=>`<option value="${id}" ${d[slot]===id?'selected':''}>${esc(resultById(id).rewardName)}</option>`).join('')}</select></label>`).join('')}<small>深掘り診断で獲得したものを自由に組み合わせられます。</small>`;const preview=()=>{const selected=selections(container),p={...container._deepProfile,deepDecor:{...d,...selected}};container.querySelector('#passDeepPreview').innerHTML=`<div class="deep-reward-preview">${window.UNICA_BLOOM_BADGE?.html?.(p)||''}<div>${titleHtml(p)}<b>${esc(p.name||'うにメン')}</b></div></div>`;};container.querySelectorAll('select').forEach(s=>s.onchange=preview);container._deepPreview=preview;preview();}
function previewIcon(container,form){if(!container?._deepProfile||!form)return;const p=container._deepProfile;container._deepProfile={...p,punyakoJourney:{...p.punyakoJourney,seedComplete:true,equippedId:form.id,equippedImage:form.image,equippedName:form.name}};container._deepPreview?.();}
function selections(container){return Object.fromEntries([...container.querySelectorAll('[data-deep-select]')].map(s=>[s.dataset.deepSelect,s.value]));}
const profileCache=new Map();let nameScanQueued=false;
function scheduleNames(){if(nameScanQueued)return;nameScanQueued=true;requestAnimationFrame(()=>{nameScanQueued=false;document.querySelectorAll('[data-deep-uid]').forEach(async element=>{const id=element.dataset.deepUid;if(!id||element.dataset.deepChecked===id)return;const api=window.UNICA_FIREBASE;if(!api?.loadDeepDecor)return;element.dataset.deepChecked=id;try{let promise=profileCache.get(id);if(!promise){promise=api.loadDeepDecor(id);profileCache.set(id,promise);}const decor=await promise;if(!element.isConnected||element.dataset.deepUid!==id)return;element.querySelector(':scope > .deep-name-title')?.remove();const html=titleHtml({deepDecor:decor});if(html)element.insertAdjacentHTML('afterbegin',html);}catch{profileCache.delete(id);delete element.dataset.deepChecked;}});});}
window.UNICA_DEEP={catalog:CATALOG,keys:KEYS,eligible,baseStats,validAnswers,evaluate,resultById,normalizedDecor,avatarAttrs,titleHtml,open,rewardPreview,renderWardrobe,previewIcon,selections,scheduleNames};
function resetPrivateOnAccountChange(){if(state&&(state.profile?.uid!==window.UNICA_FIREBASE?.uid||state.profile?.uid!==window.UNICA_FIREBASE?.auth?.currentUser?.uid)){state=null;view++;const el=host();if(el){el.replaceChildren();const note=document.createElement('p');note.textContent='ログインが変わりました。診断トップからもう一度開いてください。';el.append(note);}}}
['unica:firebase-member-restored','unica:firebase-ready','unica:auth-provider-changed','unica:firebase-member-deleted'].forEach(event=>window.addEventListener(event,resetPrivateOnAccountChange));
function installNames(){window.UNICA_BLOOM_BADGE?.refresh?.();new MutationObserver(scheduleNames).observe(document.body,{childList:true,subtree:true});window.addEventListener('unica:firebase-member-restored',()=>{const id=window.UNICA_FIREBASE?.uid;profileCache.delete(id);document.querySelectorAll('[data-deep-uid]').forEach(el=>{if(el.dataset.deepUid===id){delete el.dataset.deepChecked;el.querySelector(':scope > .deep-name-title')?.remove();}});scheduleNames();});scheduleNames();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installNames,{once:true});else installNames();
})();
