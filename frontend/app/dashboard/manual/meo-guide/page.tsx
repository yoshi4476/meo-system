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

      </div>
    </div>
  );
}
