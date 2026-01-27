'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { setToken } from '../../lib/auth';
import { useDashboard } from '../../contexts/DashboardContext';

function DashboardContent() {

const { refreshUser } = useDashboard();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Extract token from URL after Google OAuth redirect
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      console.log('✅ Token saved to localStorage');
      // Force refresh user info to pick up the new "connected" status
      refreshUser();
      
      // Clean URL (Optional but recommended)
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refreshUser]);

  return (
    <div className="space-y-8">
      {/* ヘッダーセクション */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
          <p className="text-slate-400 mt-1">おかえりなさい、渋谷店マネージャー様</p>
        </div>
        <div className="flex gap-3">
           <a href="/dashboard/reports" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium">
             レポート出力
           </a>
           <a href="/dashboard/posts/new" className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium shadow-lg shadow-purple-500/20">
             投稿を作成
           </a>
        </div>
      </div>

      {/* AIメッセージ */}
      <div className="glass-card p-6 border-l-4 border-l-aurora-cyan">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-aurora-purple to-aurora-cyan flex items-center justify-center text-2xl shrink-0">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-white mb-1">おはようございます！今日のタスクは3件です</h3>
            <p className="text-slate-300 text-sm">
              新しいクチコミが1件届いています。また、先週の投稿パフォーマンスが好調です。詳細は<a href="/dashboard/insights" className="text-aurora-cyan underline">インサイト</a>をご確認ください。
            </p>
          </div>
        </div>
      </div>

      {/* KPIグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="表示回数" 
          value="12,450" 
          change="+15.3%" 
          trend="up"
          icon="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
        />
        <MetricCard 
          title="検索クエリ" 
          value="4,821" 
          change="+5.2%" 
          trend="up"
          icon="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
        />
        <MetricCard 
          title="ルート検索" 
          value="892" 
          change="-2.1%" 
          trend="down"
           icon="M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"
        />
        <MetricCard 
          title="ウェブサイトクリック" 
          value="1,203" 
          change="+8.7%" 
          trend="up"
          icon="M15 13V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-4v-2zM7 7h2v2H7V7zm2 10H7v-2h2v2zm2-2H7v-2h4v2zm0-4H7V7h4v4zm2 8v-9h6v9h-6zm0-8v-2h4v2h-4zm2 8v-2h2v2h-2zm0-4v-2h2v2h-2z"
        />
      </div>

      {/* AIアクションカードセクション */}
      <h2 className="text-xl font-bold text-white mt-12 flex items-center gap-2">
        <span className="w-2 h-8 bg-aurora-cyan rounded-full"></span>
        AI推奨アクション
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* アクションカード1 */}
         <div className="glass-card p-6 border-l-4 border-l-aurora-purple hover:translate-y-[-2px] transition-transform">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-aurora-purple uppercase tracking-wider">高インパクト</span>
                  <h3 className="text-lg font-bold text-white mt-1">ランチメニューの新しい写真を投稿</h3>
               </div>
               <div className="p-2 bg-purple-500/20 rounded-lg">
                 <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
               </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              今週のランチタイム検索が20%増加していますが、最新のランチ写真は2週間前のものです。
            </p>
            <a href="/dashboard/posts/new" className="block w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-center">
               AIで作成（ワンクリック）
            </a>
         </div>

         {/* アクションカード2 */}
         <div className="glass-card p-6 border-l-4 border-l-aurora-cyan hover:translate-y-[-2px] transition-transform">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-aurora-cyan uppercase tracking-wider">中インパクト</span>
                  <h3 className="text-lg font-bold text-white mt-1">新しいクチコミに返信</h3>
               </div>
               <div className="p-2 bg-cyan-500/20 rounded-lg">
                 <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
               </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              田中さんから「サービスが素晴らしい」と4つ星のクチコミが届きました。今すぐ返信してエンゲージメントを高めましょう。
            </p>
            <a href="/dashboard/reviews" className="block w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-center">
               返信を作成
            </a>
         </div>

         {/* アクションカード3 */}
         <div className="glass-card p-6 border-l-4 border-l-green-500 hover:translate-y-[-2px] transition-transform">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">プロフィール最適化</span>
                  <h3 className="text-lg font-bold text-white mt-1">営業時間を更新してください</h3>
               </div>
               <div className="p-2 bg-green-500/20 rounded-lg">
                 <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
               </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              祝日の営業時間が設定されていません。1月の祝日（成人の日など）の営業時間を追加しましょう。
            </p>
            <a href="/dashboard/profile" className="block w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-center">
               営業時間を編集
            </a>
         </div>

         {/* アクションカード4 */}
         <div className="glass-card p-6 border-l-4 border-l-yellow-500 hover:translate-y-[-2px] transition-transform">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Q&A最適化</span>
                  <h3 className="text-lg font-bold text-white mt-1">よくある質問を追加</h3>
               </div>
               <div className="p-2 bg-yellow-500/20 rounded-lg">
                 <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
               </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              「駐車場はありますか？」「予約は必要ですか？」などのよくある質問を事前に登録しておくと、検索意図をカバーできます。
            </p>
            <button className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors">
               AIでQ&Aを生成
            </button>
         </div>
      </div>

      {/* スケジュール */}
      <h2 className="text-xl font-bold text-white mt-12 flex items-center gap-2">
        <span className="w-2 h-8 bg-aurora-purple rounded-full"></span>
        予約投稿スケジュール
      </h2>
      <div className="glass-card p-6">
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
            <div key={day} className="text-slate-500 py-2">{day}</div>
          ))}
          {Array.from({ length: 31 }, (_, i) => (
            <div 
              key={i} 
              className={`py-3 rounded-lg ${i === 14 || i === 21 ? 'bg-aurora-purple/30 border border-aurora-purple' : 'hover:bg-white/5'} ${i === 22 ? 'bg-aurora-cyan/30 border border-aurora-cyan' : ''} cursor-pointer transition-colors`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-aurora-purple"></div>
            <span className="text-slate-400">投稿予定</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-aurora-cyan"></div>
            <span className="text-slate-400">イベント</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-white p-8">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
