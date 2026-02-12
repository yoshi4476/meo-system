'use client';

export default function MeoGuidePage() {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400 mb-4 tracking-tight">
          MEO対策 パーフェクトガイド
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Googleマップで地域No.1を目指すための、具体的かつ実践的なノウハウ集。<br/>
          今日から始める「勝つための習慣」を徹底解説します。
        </p>
      </div>

      <div className="space-y-20 pb-20">

        {/* 1. MEOの本質 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white mb-6">1. なぜ今、MEO対策なのか？</h2>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 text-slate-300 leading-8">
            <p>
              スマートフォンの普及により、ユーザーの検索行動は激変しました。
              「近くのカフェ」「新宿 ランチ」のように、「地域 + 業種」で検索するユーザーは、
              <strong className="text-white underline decoration-emerald-500/50 decoration-2 underline-offset-4">「今すぐ行きたい」「予約したい」という強い意思</strong>を持っています。
            </p>
            <p className="mt-4">
              MEO（マップ検索最適化）で上位3位以内（ローカルパック）に入ると、
              ポータルサイトに広告費を払うよりも、はるかに高い確率で来店に繋がります。
              これは単なる「設定」ではなく、店舗経営における<span className="text-emerald-400 font-bold">最強の集客資産</span>を作る投資です。
            </p>
          </div>
        </section>

        {/* 2. 最重要アクション：投稿頻度 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-linear-to-b from-emerald-500 to-cyan-500 rounded-full"></div>
          <div className="flex items-center gap-3 mb-6">
              <span className="bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded uppercase">Must Do</span>
              <h2 className="text-3xl font-bold text-white">2. 投稿は「質」より「頻度」！</h2>
          </div>
          
          <div className="bg-linear-to-br from-slate-900 to-slate-800 p-8 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="text-center mb-8">
                <p className="text-xl font-bold text-slate-200 mb-2">Googleに「生きている店舗」と認識させる唯一の方法</p>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400 my-4">
                    週2〜3回以上
                </div>
                <p className="text-slate-400">これを下回ると、MEO効果は得られにくいのが現実です。</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-red-400">✖</span> やってはいけない運用
                    </h3>
                    <ul className="space-y-3 text-slate-400 text-sm">
                        <li>× 気が向いた時に月1回だけ長文を投稿する</li>
                        <li>× プロのような完璧な写真を撮ろうとして更新が止まる</li>
                        <li>× 毎回同じ「営業しています」だけの定型文</li>
                        <li>× 年末年始やGWの休業情報を載せない</li>
                    </ul>
                </div>
                <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                        <span className="text-emerald-400">◎</span> 勝てる運用パターン
                    </h3>
                    <ul className="space-y-3 text-slate-200 text-sm">
                        <li className="font-bold text-white">○ 短くてもいいので、週2〜3回更新する</li>
                        <li>○ スマホ写真でOK！リアルな日常を見せる</li>
                        <li>○ 「雨の日はポイント2倍」などリアルタイムな情報</li>
                        <li>○ 季節限定メニューや新商品の裏側を見せる</li>
                    </ul>
                </div>
            </div>

            {/* 投稿ネタ帳 */}
            <div className="mt-8 bg-slate-800/80 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">📝 何を書けばいいか迷ったら？「投稿ネタ帳」</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <h4 className="text-emerald-400 font-bold mb-2">商品・サービス</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li>・新メニューの試作風景</li>
                            <li>・一番人気メニューのこだわり</li>
                            <li>・、まかない料理の紹介</li>
                        </ul>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <h4 className="text-blue-400 font-bold mb-2">人・雰囲気</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li>・スタッフの笑顔や自己紹介</li>
                            <li>・店内の活気ある様子</li>
                            <li>・お客様からの頂き物</li>
                        </ul>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg">
                        <h4 className="text-purple-400 font-bold mb-2">知識・お役立ち</h4>
                        <ul className="text-slate-400 text-xs space-y-2">
                            <li>・自宅でできるプロのコツ</li>
                            <li>・業界の裏話や豆知識</li>
                            <li>・周辺のおすすめスポット</li>
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* 3. クチコミ戦略 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
          <h2 className="text-2xl font-bold text-white mb-6">3. クチコミは「数」と「返信」</h2>
          <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-3">数を集める技術</h3>
                <ul className="list-disc list-inside space-y-3 text-slate-300">
                    <li>会計時の一言「Googleで応援コメントいただけると嬉しいです」が最強。</li>
                    <li>QRコードをテーブルやレジ横に設置する。</li>
                    <li><span className="text-red-400">禁止事項:</span> 「クチコミでドリンク無料」などの対価提供（インセンティブ）はGoogleの規約で厳しく禁止されています。</li>
                </ul>
             </div>
             <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-3">返信の鉄則</h3>
                <ul className="list-disc list-inside space-y-3 text-slate-300">
                    <li><strong className="text-emerald-400">全件返信</strong>が基本です。★のみの評価にも返信しましょう。</li>
                    <li><strong className="text-emerald-400">2日以内</strong>に返信するスピード感が信頼を生みます。</li>
                    <li><strong className="text-emerald-400">キーワードを入れる</strong>。「ランチのご利用ありがとうございます」など、検索されたいワードを自然に盛り込むのが高等テクニックです。</li>
                </ul>
             </div>
          </div>
          
          {/* 返信テンプレート */}
          <div className="mt-6 bg-slate-900/50 p-6 rounded-xl border border-white/10">
              <h3 className="font-bold text-white mb-4">💬 そのまま使える！返信テンプレート</h3>
              <div className="grid md:grid-cols-2 gap-6">
                  <div>
                      <h4 className="text-emerald-400 text-sm font-bold mb-2">良いクチコミへ</h4>
                      <p className="text-xs text-slate-400 italic bg-black/20 p-3 rounded">
                          「○○様、高評価ありがとうございます！<br/>
                          今回召し上がっていただいた【メニュー名 in キーワード】は当店の看板商品です。<br/>
                          またのご来店をスタッフ一同お待ちしております！」
                      </p>
                  </div>
                  <div>
                      <h4 className="text-red-400 text-sm font-bold mb-2">悪いクチコミへ（大人の対応）</h4>
                      <p className="text-xs text-slate-400 italic bg-black/20 p-3 rounded">
                          「○○様、この度は不快な思いをさせてしまい大変申し訳ございません。<br/>
                          ご指摘いただいた【問題点】について、スタッフ全員で共有し改善に努めます。<br/>
                          貴重なご意見をありがとうございました。」
                      </p>
                  </div>
              </div>
          </div>
        </section>

        {/* 4. 写真の充実 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">4. 写真で選ばれるお店になる</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <p className="text-slate-300 text-lg">
                人間が視覚から得る情報は8割以上と言われます。<br/>
                メニュー名だけでは伝わらない魅力を、写真で伝えましょう。
             </p>
             
             <div className="mt-6">
                <h4 className="font-bold text-white mb-3">📷 スマホでプロっぽく撮る3つのコツ</h4>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                        <div className="text-yellow-400 font-bold mb-1">1. 自然光を使う</div>
                        <p className="text-xs text-slate-400">フラッシュはNG。窓際の自然光で撮ると、料理が一番美味しそうに見えます。</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                        <div className="text-yellow-400 font-bold mb-1">2. 寄って撮る（シズル感）</div>
                        <p className="text-xs text-slate-400">お皿全体を入れる必要はありません。「肉の照り」や「湯気」に近づいて撮影しましょう。</p>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-white/5">
                        <div className="text-yellow-400 font-bold mb-1">3. 斜め45度 vs 真上</div>
                        <p className="text-xs text-slate-400">立体感を出したいなら斜め45度、おしゃれな配置を見せたいなら真上がおすすめです。</p>
                    </div>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                 <div className="bg-slate-900 p-4 rounded-lg text-center border border-white/5">
                     <span className="block text-2xl mb-2">🥘</span>
                     <span className="text-sm text-slate-300 font-bold">メニュー</span>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-lg text-center border border-white/5">
                     <span className="block text-2xl mb-2">🪑</span>
                     <span className="text-sm text-slate-300 font-bold">内観・座席</span>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-lg text-center border border-white/5">
                     <span className="block text-2xl mb-2">🏢</span>
                     <span className="text-sm text-slate-300 font-bold">外観・看板</span>
                 </div>
                 <div className="bg-slate-900 p-4 rounded-lg text-center border border-white/5">
                     <span className="block text-2xl mb-2">👩‍🍳</span>
                     <span className="text-sm text-slate-300 font-bold">スタッフ</span>
                 </div>
             </div>
             <p className="text-slate-400 text-sm mt-4 text-center">
                ※ 投稿機能を使って、最低でも<strong className="text-white">月に10枚以上</strong>は新しい写真を追加し続けましょう。
             </p>
           </div>
        </section>

        {/* 5. 勝利のルーティン（月次・週次） */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-linear-to-b from-yellow-500 to-orange-500 rounded-full"></div>
           <div className="flex items-center gap-3 mb-6">
              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded uppercase">Routine</span>
              <h2 className="text-2xl font-bold text-white">5. これだけやれば勝てる！MEOルーティン</h2>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
                {/* Daily */}
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-6xl font-black text-white">D</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> 毎日 (5分)
                    </h3>
                    <ul className="space-y-4 text-slate-300 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Check</span>
                            <span>通知センターを確認。エラーや緊急のクチコミがないかチェック。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Reply</span>
                            <span>クチコミが入っていたら即返信。（AI返信機能を活用）</span>
                        </li>
                    </ul>
                </div>

                {/* Weekly */}
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-6xl font-black text-white">W</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span> 毎週 (15分)
                    </h3>
                    <ul className="space-y-4 text-slate-300 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Post</span>
                            <span>AI投稿スタジオで、翌週分の投稿を<strong className="text-white">3本予約</strong>する。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Data</span>
                            <span>インサイトを見て「表示回数」が先週より増えているか確認。</span>
                        </li>
                    </ul>
                </div>

                {/* Monthly */}
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="text-6xl font-black text-white">M</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span> 毎月 (30分)
                    </h3>
                    <ul className="space-y-4 text-slate-300 text-sm">
                        <li className="flex items-start gap-3">
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Photo</span>
                            <span>スマホで撮った新しい写真を<strong className="text-white">10枚以上</strong>アップロード。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Info</span>
                            <span>翌月の休業日や営業時間を設定（特別営業日など）。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold shrink-0 mt-0.5">Review</span>
                            <span>レポート機能で月次成果を出力し、スタッフと共有。</span>
                        </li>
                    </ul>
                </div>
           </div>
        </section>

        {/* 6. サイテーション（NAP情報）の統一 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">6. 基礎中の基礎：NAPの統一とサイテーション</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-1">
                    <p className="text-slate-300 mb-4">
                        Googleはインターネット上の情報を巡回し、あなたのお店の信頼性を判断しています。
                        その際、以下の3情報（NAP）が<strong className="text-white">一字一句完全に一致しているか</strong>が重要です。
                    </p>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex justify-around text-center mb-4">
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">Name</span>
                            <span className="font-bold text-white text-lg">店名</span>
                        </div>
                        <div className="w-px bg-slate-700"></div>
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">Address</span>
                            <span className="font-bold text-white text-lg">住所</span>
                        </div>
                        <div className="w-px bg-slate-700"></div>
                        <div>
                            <span className="block text-slate-500 text-xs uppercase">Phone</span>
                            <span className="font-bold text-white text-lg">電話番号</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-red-900/10 border border-red-500/20 p-4 rounded-xl w-full">
                    <h4 className="font-bold text-red-300 mb-2 text-sm">よくある失敗例 (NG)</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>Google: 「お好み焼き オコノミ」</li>
                        <li>HP: 「お好み焼き <span className="text-red-400">OKONOMI</span>」</li>
                        <li>インスタ: 「お好み焼きオコノミ <span className="text-red-400">新宿本店</span>」</li>
                        <li>住所: 「1-2-3」と「1丁目2番地3号」の表記ゆれ</li>
                    </ul>
                </div>
             </div>

             <div className="mt-6 pt-6 border-t border-white/10">
                 <h3 className="font-bold text-white mb-3">🌐 無料で登録できるポータルサイト（サイテーション獲得）</h3>
                 <p className="text-slate-400 text-sm mb-4">
                     以下のサイトに店舗情報を登録する際は、必ずGoogleビジネスプロフィールと同じNAP情報を使用してください。これらはGoogleからの評価を高めます。
                 </p>
                 <div className="flex flex-wrap gap-2">
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">エキテン</span>
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">Retty</span>
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">Yahoo!プレイス</span>
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">TripAdvisor</span>
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">Facebookページ</span>
                     <span className="bg-slate-700 px-3 py-1 rounded text-sm text-white">Instagramビジネス</span>
                 </div>
             </div>
           </div>
        </section>

        {/* 7. Q&Aの活用 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">7. Q&A（質問と回答）を自作自演する</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <p className="text-slate-300">
                Googleマップにはユーザーが質問できる機能がありますが、実は<strong className="text-white">オーナー自身が質問を投稿し、回答する</strong>ことも公式に認められています（FAQとして機能します）。
             </p>
             <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h4 className="font-bold text-blue-300 mb-2">メリット</h4>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                        <li>ユーザーの疑問を先回りして解消（電話問い合わせ削減）。</li>
                        <li>回答の中にキーワード（「子供連れ」「ベビーカー」等）を盛り込めるため、MEO対策になる。</li>
                    </ul>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h4 className="font-bold text-emerald-300 mb-2">おすすめの質問例</h4>
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                        <li>「駐車場はありますか？」</li>
                        <li>「クレジットカードは使えますか？」</li>
                        <li>「予約なしでも入れますか？」</li>
                        <li>「テイクアウトは可能ですか？」</li>
                    </ul>
                </div>
             </div>
           </div>
        </section>

        {/* 8. インサイト分析とPDCA */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">8. 数字で見るPDCAサイクル</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6">
             <p className="text-slate-300">
                ダッシュボードの数字を見て、以下のように対策を打ち分けましょう。
             </p>
             
             <div className="space-y-4">
                 
                 <div className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                    <div className="w-32 font-bold text-purple-400">検索数が少ない</div>
                    <div className="text-slate-500">→</div>
                    <div className="flex-1 text-slate-300">
                        <strong className="text-white">露出不足です。</strong><br/>
                        投稿頻度を上げ、写真を追加し、SNSでGoogleマップのリンクを拡散しましょう。
                    </div>
                 </div>

                 <div className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                    <div className="w-32 font-bold text-blue-400">閲覧が多いのに<br/>アクションが少ない</div>
                    <div className="text-slate-500">→</div>
                    <div className="flex-1 text-slate-300">
                        <strong className="text-white">魅力不足です。</strong><br/>
                        「写真が美味しくなさそう」「悪いクチコミが目立つ」「情報が古い」可能性があります。<br/>
                        トップに来る写真を入れ替え、クチコミに丁寧に返信しましょう。
                    </div>
                 </div>

                 <div className="flex items-center gap-4 bg-slate-900/30 p-4 rounded-xl border border-white/5">
                    <div className="w-32 font-bold text-emerald-400">順調に伸びている</div>
                    <div className="text-slate-500">→</div>
                    <div className="flex-1 text-slate-300">
                        <strong className="text-white">継続が鍵です。</strong><br/>
                        MEOは「やめたら落ちる」ゲームです。今のペースを維持し、さらに「投稿キャンペーン」などでブーストをかけましょう。
                    </div>
                 </div>

             </div>
             
             {/* トラブルシューティング */}
             <div className="mt-8 pt-6 border-t border-white/10">
                 <h3 className="font-bold text-white mb-3">🆘 困ったときのトラブルシューティング</h3>
                 <div className="bg-slate-900 p-4 rounded-xl">
                     <p className="font-bold text-red-300 mb-2">Q. 急に順位が下がった！</p>
                     <p className="text-sm text-slate-400 mb-4">
                         A. 焦らないでください。Googleのアルゴリズム変更や、競合の出現が原因かもしれません。<br/>
                         まずは「基本情報が変わっていないか」「悪いクチコミが入っていないか」を確認し、いつも通り投稿を続けましょう。一過性の変動であることも多いです。
                     </p>
                     
                     <p className="font-bold text-red-300 mb-2">Q. 「ビジネス情報が重複しています」と出たら？</p>
                     <p className="text-sm text-slate-400">
                         A. 同じ住所・電話番号で古い情報が残っている可能性があります。Googleマップ上でその古い店舗情報を検索し、「情報の修正を提案」→「閉業または存在しない場所」として報告し、統合を促しましょう。
                     </p>
                 </div>
             </div>
             
           </div>
        </section>

      </div>
    </div>
  );
}
