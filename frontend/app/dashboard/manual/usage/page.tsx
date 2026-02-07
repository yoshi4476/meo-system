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
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 mb-8">
                    <h2 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5" />
                        MEO Mastermind AI の基本的な使い方
                    </h2>
                    <p className="text-blue-800">
                        このシステムを使えば、MEO対策に必要な「投稿」「分析」「クチコミ管理」を
                        <span className="font-bold">これひとつで完結</span>できます。
                        まずは左のメニューから機能を選んでみましょう。
                    </p>
                </div>

                {/* Main Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {/* Dashboard */}
                    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                    <LayoutDashboard className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">ダッシュボード</h3>
                                    <p className="text-sm text-gray-500">最初に表示される画面</p>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>店舗ごとのパフォーマンスを一目で確認</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>検索数や閲覧数の推移をグラフ表示</span>
                                </li>
                            </ul>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            <a href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                今すぐ確認する <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-green-100 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                                    <PenTool className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">AI投稿作成</h3>
                                    <p className="text-sm text-gray-500">最もよく使われる機能</p>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>キーワードを入れるだけで記事を自動生成</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Googleマップへの予約投稿・即時投稿</span>
                                </li>
                            </ul>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            <a href="/dashboard/post/create" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                投稿を作ってみる <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-yellow-100 rounded-xl text-yellow-600 group-hover:scale-110 transition-transform">
                                    <MessageCircle className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">クチコミ管理</h3>
                                    <p className="text-sm text-gray-500">信頼を獲得する</p>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>クチコミへの返信をAIがアシスト</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>未返信のクチコミを一括チェック</span>
                                </li>
                            </ul>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            <a href="/dashboard/reviews" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                クチコミを見る <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">インサイト分析</h3>
                                    <p className="text-sm text-gray-500">効果を測定する</p>
                                </div>
                            </div>
                            <ul className="space-y-3 mb-6">
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>「どんな言葉で検索されたか」を分析</span>
                                </li>
                                <li className="flex items-start gap-2 text-gray-600">
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>電話やルート検索の数をグラフで可視化</span>
                                </li>
                            </ul>
                        </div>
                        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
                            <a href="/dashboard/insights" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                分析結果を見る <span aria-hidden="true">&rarr;</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Workflow Section */}
                <div className="mb-12">
                     <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                        毎日のルーティン（推奨）
                    </h2>
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 hidden md:block" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group cursor-pointer hover:-translate-y-1 transition-transform">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                    1
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">週に1回</h3>
                                <p className="text-sm text-gray-600">
                                    「AI投稿作成」で来週分の記事を<br/>まとめて予約投稿
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group cursor-pointer hover:-translate-y-1 transition-transform">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                    2
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">通知が来たら</h3>
                                <p className="text-sm text-gray-600">
                                    クチコミが入ったら<br/>AIを使ってすぐに返信
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative group cursor-pointer hover:-translate-y-1 transition-transform">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4 border-4 border-white shadow-lg">
                                    3
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">月末に</h3>
                                <p className="text-sm text-gray-600">
                                    「インサイト」で効果を確認し<br/>次のキーワードを決める
                                </p>
                            </div>
                        </div>
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

        {/* ■ 6. 複数店舗管理 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">6</div>
               <h2 className="text-2xl font-bold text-white">複数店舗の管理</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
                本システムは、1つのアカウントで複数のGoogleビジネスプロフィールを管理できます。
                全店舗の状況を切り替えて確認・操作することが可能です。
            </p>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-2">店舗の切り替え方法</h4>
                    <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2">
                        <li>画面左側のサイドバー上部にあるドロップダウンメニューをクリックします。</li>
                        <li>登録されている店舗名の一覧が表示されます。</li>
                        <li>操作したい店舗をクリックすると、ダッシュボードの内容が瞬時にその店舗のものに切り替わります。</li>
                    </ol>
                </div>
                <div className="flex-1 bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-white mb-2">一括管理機能（予定）</h4>
                    <p className="text-sm text-slate-400">
                        サイドバーの「一括管理」メニューからは、全店舗のパフォーマンス比較や、特定エリア単位での投稿一括作成などが可能になる予定です。<br/>
                        <span className="text-xs text-slate-500">※現在開発中の機能です。</span>
                    </p>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 7. ユーザー・店舗設定 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">7</div>
               <h2 className="text-2xl font-bold text-white">ユーザー・店舗管理（管理者向け）</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">ユーザー管理</h3>
                <p className="text-slate-300">
                    一緒に店舗を管理するスタッフを招待したり、権限を管理できます。
                </p>
                <ul className="list-disc list-inside text-slate-400 ml-4 space-y-2">
                    <li><strong className="text-white">招待方法:</strong> 「ユーザー管理」画面右上の「新規ユーザー招待」をクリックし、メールアドレスを入力します。</li>
                    <li><strong className="text-white">権限設定:</strong>
                        <ul className="list-circle list-inside ml-6 mt-1 text-sm">
                            <li><span className="text-purple-300">カンパニー管理者:</span> 全店舗の閲覧・編集、ユーザー管理が可能。</li>
                            <li><span className="text-blue-300">店舗管理者:</span> 割り当てられた店舗のみ閲覧・編集が可能。</li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">店舗管理</h3>
                <p className="text-slate-300">
                    システムに表示する店舗の追加や削除、連携解除を行います。
                </p>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-slate-400">
                        <span className="text-yellow-400 font-bold">！ 店舗の追加について:</span><br/>
                        Googleアカウント連携を行うと、そのアカウントが管理しているすべての店舗が自動的にインポートされます。<br/>
                        もし新しい店舗が表示されない場合は、「設定」画面で「Google連携」を一度解除し、再度連携し直してください（最新の店舗リストが取得されます）。
                    </p>
                </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
