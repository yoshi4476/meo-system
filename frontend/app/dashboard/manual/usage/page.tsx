'use client';

import { useDashboard } from '../../../../contexts/DashboardContext';
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
  const { userInfo } = useDashboard();

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
          </div>
        </section>

        {/* ■ 3. AI投稿スタジオ */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">3</div>
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

        {/* ■ 4. 複数店舗管理 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">4</div>
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

        {/* ■ 5. ユーザー・店舗設定 */}
        <section className="space-y-6">
          <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">5</div>
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
