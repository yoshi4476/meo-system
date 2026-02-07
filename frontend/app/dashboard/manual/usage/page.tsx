'use client';

import { useDashboard } from '../../../../contexts/DashboardContext';

export default function UsageManualPage() {
  const { userInfo } = useDashboard();

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300 mb-3">システム操作マニュアル</h1>
        <p className="text-slate-400 text-lg">MEO Mastermind AIシステムの全機能を活用するための詳細ガイド</p>
      </div>

      <div className="space-y-16 pb-20">
        
        {/* ■ 1. 初期設定（Google連携） */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">1</div>
               <h2 className="text-2xl font-bold text-white">初期設定（Google連携）</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300 leading-relaxed">
              本システムはGoogleビジネスプロフィール（GBP）の公式APIを利用して、情報の取得や更新を行います。
              システムを利用開始する前に、必ずGoogleアカウントとの連携を行ってください。
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-white border-l-4 border-blue-500 pl-3">連携手順</h3>
                    <ol className="list-decimal list-inside space-y-3 text-slate-300 bg-slate-900/50 p-5 rounded-xl border border-white/5">
                        <li>サイドバーメニュー最下部の<span className="text-white font-bold">「設定」</span>をクリックします。</li>
                        <li>「ユーザー設定」または「連携設定」画面が開きます。</li>
                        <li>「Googleアカウント連携 status」という項目を探します。</li>
                        <li>権限確認画面で「Googleにログイン」ボタンを押します。</li>
                        <li>別ウィンドウでGoogleの認証画面が開きます。</li>
                        <li>
                            <span className="text-yellow-400 font-bold">重要:</span> 表示されるチェックボックス（権限）は<br/>
                            <span className="underline decoration-yellow-500">すべてチェックを入れて</span>「許可」してください。<br/>
                            <span className="text-xs text-slate-400">※一つでも外れていると、投稿やクチコミ返信が機能しません。</span>
                        </li>
                    </ol>
                </div>
                <div className="space-y-4">
                    <h3 className="font-bold text-white border-l-4 border-red-500 pl-3">トラブルシューティング</h3>
                    <div className="bg-red-900/10 border border-red-500/10 p-5 rounded-xl space-y-3">
                        <p className="text-red-300 text-sm font-bold">連携できない場合:</p>
                        <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
                            <li>ブラウザのポップアップブロックを解除してください。</li>
                            <li>Googleビジネスプロフィールの「オーナー」または「管理者」権限を持つアカウントでログインしているか確認してください。</li>
                            <li>一度連携を解除し、再度お試しください。</li>
                        </ul>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 2. ダッシュボード・インサイト */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">2</div>
               <h2 className="text-2xl font-bold text-white">現状分析（ダッシュボード・インサイト）</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
               店舗のパフォーマンスを数値とグラフで可視化します。毎日チェックして、施策の効果を確認しましょう。
            </p>
             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-5 rounded-xl">
                    <h4 className="font-bold text-purple-300 mb-2">📊 パフォーマンス概要</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li><strong className="text-white">検索数:</strong> Google検索やマップであなたのお店が表示された回数。</li>
                        <li><strong className="text-white">閲覧数:</strong> ビジネスプロフィールが実際にクリックして見られた回数。</li>
                        <li><strong className="text-white">アクション数:</strong> 電話、ルート検索、ウェブサイトアクセスの合計数。これが多いほど実際の売上に繋がっています。</li>
                    </ul>
                </div>
                <div className="bg-slate-900/50 p-5 rounded-xl">
                    <h4 className="font-bold text-blue-300 mb-2">👀 AI感情分析</h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>クチコミの内容をAIが分析し、「ポジティブ」「ネガティブ」「中立」に分類します。</li>
                        <li>お客様が「何を評価しているか」「何に不満を持っているか」を瞬時に把握し、店舗運営の改善に役立てることができます。</li>
                    </ul>
                </div>
             </div>
          </div>
        </section>

        {/* ■ 3. 投稿管理（AI作成） */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">3</div>
               <h2 className="text-2xl font-bold text-white">投稿管理・AI作成</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
               Googleマップ上に最新情報やイベント情報を発信します。継続的な投稿はMEO評価向上に不可欠です。
            </p>
            
            <div className="space-y-4">
                <h3 className="font-bold text-white">✨ AIを使った投稿作成の流れ</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-white/10">
                        <span className="text-xs text-blue-400 font-bold uppercase">STEP 1</span>
                        <h4 className="font-bold text-white mt-1 mb-2">キーワード入力</h4>
                        <p className="text-sm text-slate-400">
                            「春限定 パスタ」「個室 宴会 予約」など、含めたいキーワードを2〜3個入力します。
                        </p>
                    </div>
                    <div className="hidden md:block text-slate-600 self-center">→</div>
                    <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-white/10">
                        <span className="text-xs text-blue-400 font-bold uppercase">STEP 2</span>
                        <h4 className="font-bold text-white mt-1 mb-2">トーン選択</h4>
                        <p className="text-sm text-slate-400">
                            「親しみやすい」「フォーマル」「情熱的」などから、ターゲット層に合った文体を選びます。
                        </p>
                    </div>
                    <div className="hidden md:block text-slate-600 self-center">→</div>
                     <div className="flex-1 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-xl border border-white/10">
                        <span className="text-xs text-blue-400 font-bold uppercase">STEP 3</span>
                        <h4 className="font-bold text-white mt-1 mb-2">生成・調整</h4>
                        <p className="text-sm text-slate-400">
                            「AI生成」ボタンを押すと、数秒で記事が完成。必要に画像を追加して「予約投稿」または「即時公開」します。
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 4. クチコミ自動返信 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">4</div>
               <h2 className="text-2xl font-bold text-white">クチコミ自動返信</h2>
          </div>
           <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
             <div className="flex flex-col md:flex-row gap-6 items-start">
                 <div className="flex-1 space-y-4">
                    <p className="text-slate-300">
                        クチコミへの返信は顧客満足度を高めるだけでなく、Googleからの評価向上にも直結します。
                        当システムはAPIを利用して新着クチコミを検知し、AIが生成した最適な返信を自動投稿します。
                    </p>
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                        <h5 className="font-bold text-green-400 mb-2">自動返信のメリット</h5>
                        <ul className="list-disc list-inside text-sm text-green-200/80 space-y-1">
                            <li>24時間365日、即座に対応可能（スピードは評価対象です）。</li>
                            <li>返信漏れを100%防止。</li>
                            <li>スタッフの負担をゼロに。</li>
                        </ul>
                    </div>
                 </div>
                 <div className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-3 text-sm">設定方法</h4>
                    <ol className="text-sm text-slate-400 space-y-3 list-decimal list-inside">
                        <li>サイドバー「設定」をクリック。</li>
                        <li>「自動返信設定」タブを開きます。</li>
                        <li><span className="text-white bg-slate-700 px-2 py-0.5 rounded">自動返信を有効にする</span> のスイッチをONにします。</li>
                        <li>任意で「返信に含めるキーワード」などをカスタマイズ指示に入力できます（例：「末尾に『店長より』とつけて」等）。</li>
                        <li>「設定を保存」をクリックして完了です。</li>
                    </ol>
                 </div>
             </div>
           </div>
        </section>

        {/* ■ 5. 店舗情報管理 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">5</div>
               <h2 className="text-2xl font-bold text-white">店舗情報の編集・同期</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
                営業時間や住所、電話番号の変更があった場合、ここから編集してGoogleに即時反映できます。
            </p>
            <div className="space-y-4">
                <h3 className="font-bold text-white">Googleからの同期（インポート）</h3>
                <p className="text-sm text-slate-400">
                    Googleマップ側で直接変更した場合や、情報が最新でないと感じる場合は、プロフィール画面右上の「Googleから最新情報を同期」ボタンを押してください。<br/>
                    住所、営業時間、属性情報などが再取得され、システムに反映されます。
                </p>
                
                <h3 className="font-bold text-white mt-4">Googleへの反映（エクスポート）</h3>
                <p className="text-sm text-slate-400">
                    画面上のフォームで情報を編集し、「保存してGoogleに反映」ボタンを押すと、Googleビジネスプロフィールの情報が書き換わります。<br/>
                    <span className="text-xs text-orange-400">※ 反映には数分かかる場合があります。また、大幅な変更（店名変更など）はGoogleの審査が入ることがあります。</span>
                </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
