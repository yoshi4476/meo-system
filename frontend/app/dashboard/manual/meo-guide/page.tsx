'use client';

export default function MeoGuidePage() {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 tracking-tight">
          MEO対策 パーフェクトガイド
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Googleマップで地域No.1を目指すための、具体的かつ実践的なノウハウ集。
          今日から始める「勝つための習慣」を解説します。
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
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full"></div>
          <div className="flex items-center gap-3 mb-6">
              <span className="bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded uppercase">Must Do</span>
              <h2 className="text-3xl font-bold text-white">2. 投稿は「質」より「頻度」！</h2>
          </div>
          
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="text-center mb-8">
                <p className="text-xl font-bold text-slate-200 mb-2">Googleに「生きている店舗」と認識させる唯一の方法</p>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 my-4">
                    週2〜3回以上
                </div>
                <p className="text-slate-400">これを下回ると、効果は半減します。</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
                <div className="bg-black/20 p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-red-400">✖</span> ダメなパターン
                    </h3>
                    <ul className="space-y-3 text-slate-400">
                        <li>気が向いた時に月1回だけ投稿</li>
                        <li>完璧な写真を撮ろうとして更新が止まる</li>
                        <li>毎回同じ「営業しています」だけの定型文</li>
                    </ul>
                </div>
                <div className="bg-emerald-500/10 p-6 rounded-xl border border-emerald-500/20">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3 flex items-center gap-2">
                        <span className="text-emerald-400">◎</span> 勝てるパターン
                    </h3>
                    <ul className="space-y-3 text-slate-200">
                        <li className="font-bold text-white">週2〜3回、できれば毎日投稿する</li>
                        <li>スマホ写真でOK！リアルな日常を見せる</li>
                        <li>「雨の日はポイント2倍」などリアルタイムな情報</li>
                    </ul>
                </div>
            </div>

            <div className="mt-8 bg-slate-800 p-4 rounded-xl border border-white/10 text-center">
                 <p className="text-slate-300">
                    <span className="text-yellow-400 font-bold">💡 なぜ「多ければ多いほどいい」のか？</span><br/>
                    Googleのアルゴリズムは「情報の鮮度」を極めて重視します。更新頻度が高い店舗は「ユーザーに有益な情報を提供している」と判断され、検索順位が優遇される傾向にあります。<br/>
                    <span className="text-sm mt-2 block text-slate-500">（SEOにおけるブログ更新と同じ原理です）</span>
                 </p>
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
                    <li>QRコードをテーブルやレジ横に設置する（手間を省く）。</li>
                    <li><span className="text-red-400">禁止事項:</span> 割引やサービスの対価としてクチコミを強要すること（インセンティブ禁止）。</li>
                </ul>
             </div>
             <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-xl font-bold text-white mb-3">返信の鉄則</h3>
                <ul className="list-disc list-inside space-y-3 text-slate-300">
                    <li><strong className="text-emerald-400">全件返信</strong>が基本です。★のみの評価にも返信しましょう。</li>
                    <li><strong className="text-emerald-400">キーワードを入れる</strong>。「ランチのご利用ありがとうございます」「個室はいかがでしたか？」など、検索されたいワードを自然に盛り込むのが高等テクニックです。</li>
                    <li>当システムのAI自動返信を使えば、この最適化を自動で行えます。</li>
                </ul>
             </div>
          </div>
        </section>

        {/* 4. 写真の充実 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">4. 写真で選ばれるお店になる</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <p className="text-slate-300 text-lg">
                人間が視覚から得る情報は8割以上と言われます。
                メニュー名だけでは伝わらない魅力を、写真で伝えましょう。
             </p>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                 <div className="bg-slate-900 p-4 rounded-lg text-center border border-white/5">
                     <span className="block text-2xl mb-2">🥘</span>
                     <span className="text-sm text-slate-300 font-bold">商品・メニュー</span>
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
             <p className="text-slate-400 text-sm mt-4">
                ※ ユーザー投稿の写真も重要ですが、オーナー投稿のきれいな写真は信頼感を高めます。<br/>
                ※ 投稿機能を使って、最低でも<strong className="text-white">月に10枚以上</strong>は新しい写真を追加し続けましょう。
             </p>
           </div>
        </section>

        {/* 5. サイテーション（NAP情報）の統一 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">5. 基礎中の基礎：NAPの統一</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-start gap-4">
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
                <div className="flex-1 bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
                    <h4 className="font-bold text-red-300 mb-2 text-sm">よくある失敗例 (NG)</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>Google: 「お好み焼き オコノミ」</li>
                        <li>HP: 「お好み焼き <span className="text-red-400">OKONOMI</span>」</li>
                        <li>インスタ: 「お好み焼きオコノミ <span className="text-red-400">新宿本店</span>」</li>
                        <li>住所: 「1-2-3」と「1丁目2番地3号」の表記ゆれ</li>
                    </ul>
                </div>
             </div>
             <p className="text-emerald-400 font-bold text-center border-t border-white/10 pt-4">
                HP、SNS、ポータルサイト（食べログ等）の表記を、Googleビジネスプロフィールの登録内容と完全に統一しましょう。
             </p>
           </div>
        </section>

        {/* 6. Q&Aの活用 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">6. Q&A（質問と回答）を自作自演する</h2>
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

        {/* 7. インサイト分析とPDCA */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">7. 数字で見るPDCAサイクル</h2>
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
                    <div className="w-32 font-bold text-blue-400">閲覧表示が多いのに<br/>アクションが少ない</div>
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
           </div>
        </section>

        {/* 8. キーワード選定の重要性 */}
        <section className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-slate-700/50 rounded-full"></div>
           <h2 className="text-2xl font-bold text-white mb-6">8. 検索されるための「キーワード選定」</h2>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-4">
             <p className="text-slate-300">
                どれだけ良いお店でも、ユーザーが検索する言葉（キーワード）とマッチしていなければ表示されません。
             </p>
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl border border-white/5">
                <h4 className="font-bold text-white mb-4">正しいキーワードの方程式</h4>
                <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                    <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30 text-blue-300 font-bold">
                        地域名 (Where)
                    </div>
                    <div className="text-slate-500">+</div>
                    <div className="bg-emerald-900/30 p-3 rounded-lg border border-emerald-500/30 text-emerald-300 font-bold">
                        業種 (What)
                    </div>
                    <div className="text-slate-500">+</div>
                    <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-500/30 text-purple-300 font-bold">
                        目的・特徴 (Why/How)
                    </div>
                </div>
                <div className="mt-4 bg-black/20 p-4 rounded-lg text-sm text-slate-400">
                    <p className="mb-1"><strong className="text-white">例1:</strong> 「新宿 居酒屋 個室」</p>
                    <p className="mb-1"><strong className="text-white">例2:</strong> 「大阪 美容院 髪質改善」</p>
                    <p><strong className="text-white">例3:</strong> 「横浜 カフェ Wi-Fiあり」</p>
                </div>
             </div>

             <div className="space-y-4 pt-4">
                <h4 className="font-bold text-white">キーワードをどこに入れるべきか？</h4>
                <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li><strong className="text-emerald-400">ビジネスの説明文:</strong> 自然な文章の中で、ターゲットとするキーワードを盛り込みます。</li>
                    <li><strong className="text-emerald-400">投稿（最新情報）:</strong> 毎回、「春の宴会」「歓送迎会」など季節やイベントに合わせたキーワードを入れます。</li>
                    <li><strong className="text-emerald-400">クチコミへの返信:</strong> お客様のコメントにあるキーワードを拾って返信します（「個室のご利用ありがとうございました」等）。</li>
                    <li><strong className="text-emerald-400">Q&A:</strong> 質問と回答の中にキーワードを含めます。</li>
                    <li><strong className="text-red-400">注意:</strong> 店舗名（ビジネス名）に不要なキーワードを詰め込むのはGoogleの規約違反です（アカウント停止のリスクがあります）。</li>
                </ul>
             </div>
           </div>
        </section>

      </div>
    </div>
  );
}
