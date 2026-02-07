'use client';

export default function MeoGuidePage() {
  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">MEO対策パーフェクトガイド</h1>
        <p className="text-slate-400">集客を最大化するためのGoogleマップ上位表示テクニック（クライアント様向け）</p>
      </div>

      <div className="space-y-12 pb-20">

        {/* 1. MEOとは？ */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 border-b border-white/10 pb-2">
            1. MEO（マップエンジン最適化）とは？
          </h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4 text-slate-300 leading-relaxed">
            <p>
              MEO（Map Engine Optimization）とは、Googleマップでの検索結果において、あなたのお店の情報を上位に表示させるための施策のことです。
              「地域名 + 業種」（例：「新宿 居酒屋」）で検索したユーザーは、<strong className="text-white bg-green-500/20 px-1 rounded">来店意欲が非常に高い</strong>ため、MEO対策は最も費用対効果の高い集客方法と言われています。
            </p>
          </div>
        </section>

        {/* 2. 上位表示の3大要素 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 border-b border-white/10 pb-2">
            2. Googleが重視する3つの評価基準
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/10">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-white mb-2">関連性 (Relevance)</h3>
                <p className="text-slate-400 text-sm">
                    検索されたキーワードと、お店の情報がどれだけ一致しているか。
                    <br/><br/>
                    <span className="text-green-400">対策:</span> 正しいカテゴリ設定、説明文へのキーワード含有、投稿でのキーワード発信。
                </p>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/10">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-bold text-white mb-2">距離 (Distance)</h3>
                <p className="text-slate-400 text-sm">
                    検索しているユーザーの現在地から、お店までの距離。
                    <br/><br/>
                    <span className="text-green-400">対策:</span> コントロール不可ですが、正確な住所登録が必須です。
                </p>
            </div>
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-white/10">
                <div className="text-4xl mb-4">⭐</div>
                <h3 className="text-xl font-bold text-white mb-2">知名度 (Prominence)</h3>
                <p className="text-slate-400 text-sm">
                    Web上での認知度や評価の高さ。
                    <br/><br/>
                    <span className="text-green-400">対策:</span> <span className="underline decoration-green-500/50">クチコミの数と評価</span>、返信率、写真の充実度、サイテーション（他サイトでの言及）。
                </p>
            </div>
          </div>
        </section>

        {/* 3. 具体的なアクションプラン */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 border-b border-white/10 pb-2">
            3. 今日からできるアクションプラン
          </h2>
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-6">
            
            <div className="flex gap-4">
                <div className="flex-none w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">1</div>
                <div>
                    <h3 className="text-xl font-bold text-white">クチコミを集め、必ず返信する</h3>
                    <p className="text-slate-400 mt-1">
                        クチコミは最大のランキング要因です。会計時にお客様に依頼したり、QRコードを活用しましょう。また、投稿されたクチコミには<strong className="text-green-400">2日以内に返信</strong>することが推奨されます。キーワード（例：「ランチ」「個室」）を返信に含めるとさらに効果的です。
                    </p>
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg text-sm text-slate-300 border border-white/5">
                        💡 当システムの「自動返信機能」を使えば、返信漏れを防ぎ、AIが丁寧な文章を作成してくれます。
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-none w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">2</div>
                <div>
                    <h3 className="text-xl font-bold text-white">最新情報を週1回以上投稿する</h3>
                    <p className="text-slate-400 mt-1">
                        Googleは「活動している店舗」を好みます。新メニュー、イベント、休業案内、日常の様子などを定期的に「投稿機能」でアップしましょう。写真は必須です。
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <div className="flex-none w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold text-xl">3</div>
                <div>
                    <h3 className="text-xl font-bold text-white">写真を充実させる</h3>
                    <p className="text-slate-400 mt-1">
                        ユーザーは写真でお店を選びます。料理、内観、外観、スタッフなどの写真をカテゴリごとにアップロードしましょう。高画質な写真はクリック率を高めます。
                    </p>
                </div>
            </div>

          </div>
        </section>

        {/* 4. 禁止事項 */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-red-400 border-b border-white/10 pb-2">
            ⚠ やってはいけないこと（ガイドライン違反）
          </h2>
          <div className="bg-red-500/5 p-6 rounded-2xl border border-red-500/10 space-y-2 text-slate-300">
             <ul className="list-disc list-inside space-y-2">
                <li><strong className="text-red-300">ビジネス名にキーワードを詰め込む:</strong> 例：「新宿居酒屋 ランチがお得な〇〇店」などはNG。正式名称「〇〇店」のみ登録してください。アカウント停止のリスクがあります。</li>
                <li><strong className="text-red-300">自作自演のクチコミ:</strong> スタッフや関係者によるクチコミ投稿は禁止されています。</li>
                <li><strong className="text-red-300">クチコミの見返りに金品を提供する:</strong> 「クチコミ書いてくれたら割引」はガイドライン違反です。</li>
             </ul>
          </div>
        </section>

      </div>
    </div>
  );
}
