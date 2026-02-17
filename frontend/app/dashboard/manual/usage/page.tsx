'use client';

// import { useDashboard } from '../../../../contexts/DashboardContext';
import React from 'react';
import { 
    MapPin, 
    Search, 
    MessageSquare, 
    BarChart2, 
    Settings, 
    HelpCircle, 
    ExternalLink, 
    ChevronRight,
    LayoutDashboard as DashboardIcon, // Aliased to avoid conflict/cache issues
    CheckCircle2,
    PenTool,
    MessageCircle,
    BarChart3
} from 'lucide-react';

export default function UsageManualPage() {
// useDashboard removed as it was unused

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto w-full max-w-5xl mx-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      <div className="mb-10 border-b border-white/10 pb-6">

        <p className="text-slate-400 text-lg">MEO Mastermind AIシステムの全機能を活用するための詳細ガイド</p>
      </div>

      <div className="space-y-16 pb-20">
        
        {/* ■ 1. 初期設定（Google連携・SNS連携） */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">1</div>
                <h2 className="text-2xl font-bold text-white">初期設定：アカウント連携</h2>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                        MEO Mastermind AIをフル活用するために、まずはGoogleビジネスプロフィールおよび各SNSアカウントをシステムと連携させます。
                    </p>
                    
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> 連携の手順
                        </h4>
                        <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                            <li>サイドメニューの「<span className="text-white font-bold">設定</span>」をクリックします。</li>
                            <li>「<span className="text-white font-bold">Googleアカウント連携</span>」で「連携する」ボタンを押し、Google認証を行います。</li>
                            <li>「<span className="text-white font-bold">ソーシャルメディア連携</span>」セクションへ移動します。</li>
                            <li>Instagram, X (旧Twitter), YouTube の各「連携」ボタンを押し、認証を完了させます。</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                        <h4 className="font-bold text-yellow-300 mb-2 flex items-center gap-2">
                             重要：店舗の選択
                        </h4>
                        <p className="text-sm text-slate-300">
                            Google連携後、管理可能な店舗の一覧が表示されます。<br/>
                            <span className="text-white font-bold">操作したい店舗を選択して「保存」</span>を押してください。<br/>
                            これを行わないと、ダッシュボードにデータが表示されません。
                        </p>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 2. 機能一覧 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">2</div>
                <h2 className="text-2xl font-bold text-white">主な機能の紹介</h2>
          </div>
          
          <div className="ml-14 grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Dashboard */}
                    <div className="group bg-slate-800/50 rounded-2xl border border-white/5 shadow-sm hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                    <DashboardIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">ダッシュボード</h3>
                                    <p className="text-xs text-slate-400">すべてを俯瞰する</p>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>店舗の最新状況をひと目で確認</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>重要な通知ややるべきことを表示</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="group bg-slate-800/50 rounded-2xl border border-white/5 shadow-sm hover:border-green-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">AI投稿作成</h3>
                                    <p className="text-xs text-slate-400">集客の要</p>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>キーワードから高品質な記事を自動生成</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                    <span>予約投稿で運用を自動化</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="group bg-slate-800/50 rounded-2xl border border-white/5 shadow-sm hover:border-yellow-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400">
                                    <MessageCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">クチコミ管理</h3>
                                    <p className="text-xs text-slate-400">ファンを増やす</p>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                    <span>AIが返信文案を数秒で作成</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                                    <span>ポジティブ・ネガティブを自動分析</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="group bg-slate-800/50 rounded-2xl border border-white/5 shadow-sm hover:border-purple-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                    <BarChart3 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">インサイト分析</h3>
                                    <p className="text-xs text-slate-400">結果を可視化</p>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                                    <span>検索キーワードや閲覧数の推移をグラフ化</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                                    <span>競合分析や改善提案（Coming Soon）</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* Rank Tracking */}
                    <div className="group bg-slate-800/50 rounded-2xl border border-white/5 shadow-sm hover:border-pink-500/50 hover:bg-slate-800 transition-all duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400">
                                    <BarChart2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">順位計測</h3>
                                    <p className="text-xs text-slate-400">SEO成果を追跡</p>
                                </div>
                            </div>
                            <ul className="space-y-2 mb-4 text-sm text-slate-300">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                                    <span>Google検索順位を自動で毎日計測</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-pink-500 shrink-0 mt-0.5" />
                                    <span>エリア指定でローカル検索に対応</span>
                                </li>
                            </ul>
                        </div>
                    </div>
          </div>
        </section>

        {/* ■ 3. 順位計測エンジンの設定 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">3</div>
                <h2 className="text-2xl font-bold text-white">順位計測エンジンの設定と活用</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
                あなたの店舗がGoogle検索で何位に表示されているかを正確に把握することは、MEO対策の第一歩です。<br/>
                「順位計測」機能を使って、注力すべきキーワードの成果をモニタリングしましょう。
            </p>
            
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-white text-lg mb-3">設定手順</h3>
                    <ol className="list-decimal list-inside text-slate-300 space-y-4 ml-2">
                        <li className="pl-2">
                            <strong className="text-white block mb-1">キーワードの追加</strong>
                            サイドメニューの「<span className="text-white font-bold">順位計測</span>」を開き、右上の「キーワード追加」ボタンをクリックします。
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">条件の入力</strong>
                            <ul className="list-disc list-inside ml-4 mt-2 space-y-1 text-sm">
                                <li><span className="text-blue-400 font-bold">キーワード:</span> 検索されそうな言葉（例: 「渋谷 カフェ」「新宿 ランチ」）を入力します。</li>
                                <li><span className="text-blue-400 font-bold">計測エリア (任意):</span> どこで検索したことにするかを指定します（例: 「東京都新宿区」）。<br/>
                                <span className="text-xs text-slate-500">※ Googleマップは検索地点によって順位が大きく変わるため、店舗のある市区町村を入力することを強く推奨します。</span></li>
                            </ul>
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">計測開始と確認</strong>
                            「追加する」を押すと、即座にGoogle検索を実行し、現在の順位を取得します。<br/>
                            以降は自動的に毎日計測が行われ、グラフで推移を確認できるようになります。
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">手動での再計測</strong>
                            順位表示の横にある「再計測 (Real)」ボタンを押すことで、最新の状況をその場で確認することも可能です。
                        </li>
                    </ol>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 4. AI投稿スタジオ */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">4</div>
                <h2 className="text-2xl font-bold text-white">AI投稿スタジオ（マルチプラットフォーム投稿）</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            <p className="text-slate-300">
                Googleビジネスプロフィール、Instagram、X (旧Twitter)、YouTube Shortsへ一括投稿できる強力なツールです。<br/>
                投稿管理画面右上の「+ 新規投稿を作成」からアクセスできます。
            </p>
            
            <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-white text-lg mb-3">基本ステップ</h3>
                    <ol className="list-decimal list-inside text-slate-300 space-y-4 ml-2">
                        <li className="pl-2">
                            <strong className="text-white block mb-1">投稿先の選択</strong>
                            画面上部のアイコン（Google, Instagram, X, YouTube）をクリックして選択します。<br/>
                            <span className="text-xs text-yellow-400">※ 未連携のアイコンはここからは選択できません。「設定」画面で連携してください。</span>
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">コンテンツの作成（AI活用）</strong>
                            <div className="bg-slate-900/50 p-4 rounded-lg mt-2 space-y-3 border border-blue-500/20">
                                <p><span className="text-blue-400 font-bold">キーワード (固定機能):</span> 投稿テーマを入力します。鍵アイコンをクリックすると次回以降も入力を保持できます。</p>
                                <p><span className="text-blue-400 font-bold">地域・エリア (固定機能):</span> ターゲット地域を入力します。こちらも固定可能です。</p>
                                <p><span className="text-blue-400 font-bold">文字数・長さ:</span> 「自動」「短文 (140文字/X向け)」「標準」「長文 (ブログ風)」から選択し、AIの出力長をコントロールできます。</p>
                                <p><span className="text-blue-400 font-bold">ハッシュタグ提案:</span> 本文生成後、「Hashtag AI提案 #」ボタンを押すと、内容に最適なタグを自動追加します。</p>
                            </div>
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">メディアの追加</strong>
                            <p className="mb-2">写真または動画をアップロードします。<span className="text-xs text-pink-400">※ Instagramは写真必須、YouTube Shortsは動画必須です。</span></p>
                            <div className="flex gap-2 items-center flex-wrap">
                                <span className="text-xs bg-slate-700 px-3 py-1.5 rounded border border-white/10 text-slate-300">PCからアップロード</span>
                                <span className="text-xs text-slate-500">または</span>
                                <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded border border-white/10 text-white flex items-center gap-1 transition-colors">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    メディアライブラリから選択
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">※ 「メディアライブラリ」から、過去にアップロードした画像を再利用できます。</p>
                        </li>
                        <li className="pl-2">
                            <strong className="text-white block mb-1">公開または予約</strong>
                            「今すぐ投稿」で即時公開、または日時指定で予約投稿が可能です。
                        </li>
                    </ol>
                </div>
            </div>
          </div>
        </section>

        {/* ■ 5. 複数店舗管理 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">5</div>
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
            </div>
          </div>
        </section>

        {/* ■ 6. エンタープライズ機能（通知・グループ） */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">6</div>
               <h2 className="text-2xl font-bold text-white">エンタープライズ機能</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">通知センター</h3>
                <p className="text-slate-300">
                    システムからの重要なお知らせ、投稿の失敗、低い評価のクチコミなどのアラートを一元管理します。
                </p>
                <ul className="list-disc list-inside text-slate-400 ml-4 space-y-2">
                    <li>サイドメニューの「設定」→「通知センター」からアクセスできます。</li>
                    <li>重要な通知は登録メールアドレスにも送信されます。</li>
                </ul>
            </div>

            <div className="space-y-4 pt-4">
                <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">店舗グループ管理（管理者向け）</h3>
                <p className="text-slate-300">
                    多数の店舗を運営する場合、エリアやブランドごとにグループ化して管理できます。
                </p>
                <ul className="list-disc list-inside text-slate-400 ml-4 space-y-2">
                    <li>サイドメニューの「管理者用」→「グループ管理」からアクセスします。</li>
                    <li>新規グループを作成し、店舗を割り当てることで、将来的にグループ単位での分析や権限管理が可能になります。</li>
                </ul>
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

        {/* ■ 8. SNS連携設定 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">8</div>
               <h2 className="text-2xl font-bold text-white">SNS連携設定（APIキー取得ガイド）</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-8 ml-14">
            <p className="text-slate-300">
                本システムの自動投稿機能を有効にするには、各SNSプラットフォームで「APIキー（Client ID / Secret）」を取得し、設定画面に入力する必要があります。
            </p>

            {/* Instagram */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-pink-500">📸</span> Instagram (Meta)
                </h3>
                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-slate-200 mb-2">必要なもの</h4>
                    <ul className="list-disc list-inside text-slate-400 text-sm mb-4">
                        <li>Facebookアカウント</li>
                        <li>Instagramプロアカウント（ビジネス/クリエイター）</li>
                        <li>Facebookページ（Instagramとリンク済み）</li>
                    </ul>
                    <h4 className="font-bold text-slate-200 mb-2">手順: Meta for Developers</h4>
                    <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2">
                        <li><a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Meta for Developers</a> にアクセスし、「マイアプリ」→「アプリを作成」をクリック。</li>
                        <li>タイプは<strong>「ビジネス」</strong>を選択。</li>
                        <li>「製品を追加」で<strong>「Instagram Graph API」</strong>を設定。</li>
                        <li><strong>「設定」→「ベーシック」</strong>で <strong>アプリID (Client ID)</strong> と <strong>App Secret (Client Secret)</strong> を取得。</li>
                        <li>「有効なOAuthリダイレクトURI」に以下を追加:<br/>
                            <code className="bg-black/30 px-2 py-1 rounded text-xs select-all">https://[あなたのドメイン]/dashboard/settings</code>
                        </li>
                    </ol>
                </div>
            </div>

            {/* X (Twitter) */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-white">🕊️</span> X (旧Twitter)
                </h3>
                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-slate-200 mb-2">手順: Twitter Developer Portal</h4>
                    <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2">
                        <li><a href="https://developer.twitter.com/en/portal/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Twitter Developer Portal</a> でアプリを作成 (Create App)。</li>
                        <li><strong>User authentication settings</strong> をセットアップ:
                            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                <li>App permissions: <strong>Read and Write</strong></li>
                                <li>Type of App: <strong>Web App, Automated App or Bot</strong></li>
                                <li>Redirect URL: <code className="bg-black/30 px-2 py-1 rounded text-xs select-all">https://[あなたのドメイン]/dashboard/settings</code></li>
                            </ul>
                        </li>
                        <li><strong>Keys and tokens</strong> タブの <strong>OAuth 2.0 Client ID and Client Secret</strong> を取得。<br/>
                        <span className="text-xs text-yellow-500">※ "Consumer Keys" ではありません。</span></li>
                    </ol>
                </div>
            </div>

            {/* YouTube */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-red-500">▶️</span> YouTube / Shorts
                </h3>
                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5">
                    <h4 className="font-bold text-slate-200 mb-2">手順: Google Cloud Console</h4>
                    <ol className="list-decimal list-inside text-slate-400 text-sm space-y-2">
                        <li><a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a> でプロジェクトを作成。</li>
                        <li><strong>YouTube Data API v3</strong> を有効化。</li>
                        <li><strong>OAuth同意画面</strong> を作成（User Type: 外部）。</li>
                        <li><strong>認証情報</strong> → <strong>OAuth クライアント ID</strong> を作成（ウェブ アプリケーション）。</li>
                        <li>承認済みのリダイレクト URI: <code className="bg-black/30 px-2 py-1 rounded text-xs select-all">https://[あなたのドメイン]/dashboard/settings</code></li>
                        <li>発行された <strong>クライアント ID</strong> と <strong>クライアント シークレット</strong> を取得。</li>
                    </ol>
                </div>
            </div>

            {/* System Setup */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mt-4">
                 <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                     <Settings className="w-4 h-4" /> システムへの登録方法
                 </h4>
                 <ol className="list-decimal list-inside text-slate-300 space-y-2 text-sm">
                     <li>サイドメニューの「<span className="text-white font-bold">設定</span>」を開きます。</li>
                     <li>各SNSのパネルにある「<span className="text-white font-bold">▼ 独自のClient IDを使用する (高度な設定)</span>」をクリック。</li>
                     <li>取得したIDとSecretを入力し、「設定を保存」をクリック。</li>
                     <li>その後、「連携する」ボタンを押して認証を完了させてください。</li>
                 </ol>
            </div>

          </div>
        </section>

        {/* ■ 9. 推奨ルーティン */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">9</div>
                <h2 className="text-2xl font-bold text-white">運用の推奨ルーティン</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-blue-500/20">
                    <div className="bg-blue-500/20 text-blue-400 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4">Daily</div>
                    <h3 className="text-lg font-bold text-white mb-4">毎日やること</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                             <span>通知センターの確認（エラーや低評価がないか）</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                             <span>自動返信されたクチコミの確認（必要に応じて修正）</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-xl border border-green-500/20">
                    <div className="bg-green-500/20 text-green-400 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4">Weekly</div>
                    <h3 className="text-lg font-bold text-white mb-4">週1回やること</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                             <span>AI投稿スタジオで翌週分の記事を3本予約</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                             <span>インサイトで検索数の増減をチェック</span>
                        </li>
                    </ul>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-xl border border-purple-500/20">
                    <div className="bg-purple-500/20 text-purple-400 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4">Monthly</div>
                    <h3 className="text-lg font-bold text-white mb-4">月1回やること</h3>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                             <span>新しい写真（メニューや店内）を10枚以上追加</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                             <span>店舗情報の更新（営業時間やキャンペーン情報）</span>
                        </li>
                        <li className="flex items-start gap-2">
                             <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                             <span>レポート機能で月次成果を確認・保存</span>
                        </li>
                    </ul>
                </div>
            </div>

          </div>
        </section>


        {/* ■ 10. トラブルシューティング */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-500 flex items-center justify-center text-white font-bold text-lg">10</div>
                <h2 className="text-2xl font-bold text-white">トラブルシューティング・よくある質問</h2>
          </div>
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-white/5 space-y-6 ml-14">
            
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-yellow-500">⚠️</span> ログイン画面がなかなか開かない / エラーが出る
                </h3>
                <div className="bg-slate-900/50 p-5 rounded-xl border border-yellow-500/20">
                    <p className="text-slate-300 mb-2">
                        本システムはクラウドサーバーの「自動スリープ機能」を使用しているため、しばらく操作していない状態からアクセスすると、<strong>起動に50秒〜1分程度かかる場合があります。</strong>
                    </p>
                    <ul className="list-disc list-inside text-slate-400 text-sm space-y-2">
                        <li>ログイン画面で「システム起動中...」と表示されている間は、そのままお待ちください。</li>
                        <li>もし「Render」のロゴが入ったエラー画面や「502/504 Bad Gateway」が表示された場合は、1分ほど待ってからブラウザを再読み込み（リロード）してください。</li>
                        <li>これは無料プラン特有の挙動であり、有料プランへの移行で解消可能です（必要な場合はお問い合わせください）。</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="text-blue-500">🔄</span> データが反映されない
                </h3>
                <p className="text-slate-300 text-sm">
                    Googleビジネスプロフィールの変更（投稿や情報更新）が反映されるまで、Google側で数分〜数時間のタイムラグが発生することがあります。<br/>
                    また、ダッシュボードの数値がおかしい場合は、ページを再読み込みするか、一度ログアウトして再ログインをお試しください。
                </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
