'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { setToken } from '../../lib/auth';
import { useDashboard } from '../../contexts/DashboardContext';

function DashboardContent() {

  const { userInfo, isDemoMode, refreshUser } = useDashboard();
  const searchParams = useSearchParams();
  const [stats, setStats] = useState<{label: string; value: string; change: string; trend: string; icon: string}[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Demo Data Definitions
  const demoStats = [
      { label: '表示回数', value: '12,450', change: '+15.3%', trend: 'up', icon: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' },
      { label: '検索クエリ', value: '4,821', change: '+5.2%', trend: 'up', icon: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
      { label: 'ルート検索', value: '892', change: '-2.1%', trend: 'down', icon: 'M21.71 11.29l-9-9c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.38.39-1.01 0-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z' },
      { label: 'ウェブサイト', value: '1,203', change: '+8.7%', trend: 'up', icon: 'M15 13V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-4v-2zM7 7h2v2H7V7zm2 10H7v-2h2v2zm2-2H7v-2h4v2zm0-4H7V7h4v4zm2 8v-9h6v9h-6zm0-8v-2h4v2h-4zm2 8v-2h2v2h-2zm0-4v-2h2v2h-2z' },
  ];

  const zeroStats = [
    { label: '表示回数', value: '0', change: '0%', trend: 'neutral', icon: demoStats[0].icon },
    { label: '検索クエリ', value: '0', change: '0%', trend: 'neutral', icon: demoStats[1].icon },
    { label: 'ルート検索', value: '0', change: '0%', trend: 'neutral', icon: demoStats[2].icon },
    { label: 'ウェブサイト', value: '0', change: '0%', trend: 'neutral', icon: demoStats[3].icon },
  ];

  // Fetch Data (Insights, Reviews, Posts) for Dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isDemoMode) {
        setStats(demoStats);
        setIsLoadingStats(false);
        return;
      }

      if (!userInfo?.store_id) {
        setStats(zeroStats);
        setIsLoadingStats(false);
        return;
      }

      try {
        const token = localStorage.getItem('meo_auth_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Parallel fetching
        const [insightsRes, reviewsRes, postsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/insights/${userInfo.store_id}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/?store_id=${userInfo.store_id}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/?store_id=${userInfo.store_id}`, { headers })
        ]);

        // Process Insights
        if (insightsRes.ok) {
          const data = await insightsRes.json();
          const getTotal = (metricName: string) => {
            const series = data.metrics?.find((m: any) => m.dailyMetric === metricName);
            if (!series || !series.dailyMetricTimeSeries) return 0;
            return series.dailyMetricTimeSeries.reduce((acc: number, curr: any) => acc + parseInt(curr.value || '0'), 0);
          };

          const totalViews = getTotal('BUSINESS_IMPRESSIONS_MOBILE_MAPS') + getTotal('BUSINESS_IMPRESSIONS_MOBILE_SEARCH');
          const totalSearchImpressions = getTotal('BUSINESS_IMPRESSIONS_MOBILE_SEARCH');
          const totalDirections = getTotal('DRIVING_DIRECTIONS_CLICKS');
          const totalWebsite = getTotal('WEBSITE_CLICKS');

          setStats([
            { ...demoStats[0], value: totalViews.toLocaleString(), change: 'N/A', trend: 'neutral' },
            { ...demoStats[1], value: totalSearchImpressions.toLocaleString(), change: 'N/A', trend: 'neutral' },
            { ...demoStats[2], value: totalDirections.toLocaleString(), change: 'N/A', trend: 'neutral' },
            { ...demoStats[3], value: totalWebsite.toLocaleString(), change: 'N/A', trend: 'neutral' },
          ]);
        } else {
          setStats(zeroStats);
        }

        // Process Reviews & Posts for AI Actions
        const reviews = reviewsRes.ok ? await reviewsRes.json() : [];
        const posts = postsRes.ok ? await postsRes.json() : [];
        
        const unrepliedReviews = reviews.filter((r: any) => !r.reply_comment).length;
        const lastPostDate = posts.length > 0 ? new Date(posts[0].created_at || posts[0].create_time) : null;
        const daysSinceLastPost = lastPostDate ? Math.floor((new Date().getTime() - lastPostDate.getTime()) / (1000 * 3600 * 24)) : 999;
        
        setRealActionCount(unrepliedReviews + (daysSinceLastPost > 7 ? 1 : 0));
        setDashboardState({ unrepliedReviews, daysSinceLastPost });

      } catch (e) {
        console.error("Failed to fetch dashboard data:", e);
        setStats(zeroStats);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [userInfo, isDemoMode]);

  // State for dynamic content
  const [realActionCount, setRealActionCount] = useState(0);
  const [dashboardState, setDashboardState] = useState({ unrepliedReviews: 0, daysSinceLastPost: 0 });

  useEffect(() => {
    // Extract token from URL after Google OAuth redirect (Authentication Logic)
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      refreshUser();
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, refreshUser]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            ダッシュボード 
            {isDemoMode && <span className="text-xs sm:text-sm bg-aurora-cyan/20 text-aurora-cyan px-2 py-1 rounded ml-2">DEMO MODE</span>}
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">おかえりなさい、{userInfo?.email?.split('@')[0] || 'ゲスト'}様</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
           <a href="/dashboard/reports" className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs sm:text-sm font-medium">レポート出力</a>
           <a href="/dashboard/posts/new" className="px-3 sm:px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-xs sm:text-sm font-medium shadow-lg shadow-purple-500/20">投稿を作成</a>
        </div>
      </div>

      {/* AI Message */}
      <div className="glass-card p-6 border-l-4 border-l-aurora-cyan">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-aurora-purple to-aurora-cyan flex items-center justify-center text-2xl shrink-0">🤖</div>
          <div>
            <h3 className="font-bold text-white mb-1">
                {isDemoMode ? 'おはようございます！今日のタスクは3件です' : 
                 realActionCount > 0 ? `現在、${realActionCount}件のアクションが推奨されています` : '現在のスコアは良好です！'}
            </h3>
            <p className="text-slate-300 text-sm">
              {isDemoMode 
                ? '新しいクチコミが1件届いています。また、先週の投稿パフォーマンスが好調です。詳細はインサイトをご確認ください。' 
                : realActionCount > 0 
                    ? `未返信のクチコミが${dashboardState.unrepliedReviews}件あります。${dashboardState.daysSinceLastPost > 7 ? 'また、1週間以上新しい投稿がありません。' : ''}`
                    : 'すべてのクチコミに返信済みで、定期的な投稿も行えています。この調子で運用を続けましょう。'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
            <MetricCard key={i} title={stat.label} value={stat.value} change={stat.change} trend={stat.trend as 'up' | 'down' | 'neutral'} icon={stat.icon} />
        ))}
      </div>

      {/* AI Actions Section */}
      <h2 className="text-xl font-bold text-white mt-12 flex items-center gap-2">
        <span className="w-2 h-8 bg-aurora-cyan rounded-full"></span>
        AI推奨アクション
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Dynamic Action 1: Review Reply */}
         {(isDemoMode || dashboardState.unrepliedReviews > 0) && (
             <div className="glass-card p-6 border-l-4 border-l-aurora-cyan hover:translate-y-[-2px] transition-transform">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <span className="text-xs font-bold text-aurora-cyan uppercase tracking-wider">優先度: 高</span>
                      <h3 className="text-lg font-bold text-white mt-1">未返信のクチコミがあります</h3>
                   </div>
                   <div className="p-2 bg-cyan-500/20 rounded-lg">
                     <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/></svg>
                   </div>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  {isDemoMode ? '田中さんから「サービスが素晴らしい」と4つ星のクチコミが届きました。' : `${dashboardState.unrepliedReviews}件のクチコミにまだ返信していません。返信は顧客満足度を向上させます。`}
                </p>
                <a href="/dashboard/reviews" className="block w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-center">
                   返信を確認・作成
                </a>
             </div>
         )}

         {/* Dynamic Action 2: New Post */}
         {(isDemoMode || dashboardState.daysSinceLastPost > 7) && (
             <div className="glass-card p-6 border-l-4 border-l-aurora-purple hover:translate-y-[-2px] transition-transform">
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <span className="text-xs font-bold text-aurora-purple uppercase tracking-wider">エンゲージメント</span>
                      <h3 className="text-lg font-bold text-white mt-1">新しい情報を投稿しましょう</h3>
                   </div>
                   <div className="p-2 bg-purple-500/20 rounded-lg">
                     <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                   </div>
                </div>
                <p className="text-slate-400 text-sm mb-6">
                  {isDemoMode ? '今週のランチタイム検索が20%増加していますが、最新のランチ写真は2週間前のものです。' : `前回の投稿から${dashboardState.daysSinceLastPost}日が経過しています。定期的な発信は検索順位に良い影響を与えます。`}
                </p>
                <a href="/dashboard/posts/new" className="block w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors text-center">
                   AIで投稿を作成
                </a>
             </div>
         )}
         
         {/* Static Fallback if Good Status */}
         {!isDemoMode && realActionCount === 0 && (
             <div className="glass-card p-6 border-l-4 border-l-green-500">
                <div className="flex justify-between items-start mb-4">
                   <div>
                       <span className="text-xs font-bold text-green-400 uppercase tracking-wider">ステータス: 良好</span>
                       <h3 className="text-lg font-bold text-white mt-1">運用は順調です！</h3>
                   </div>
                   <div className="p-2 bg-green-500/20 rounded-lg">
                       <svg className="w-6 h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                   </div>
                </div>
                <p className="text-slate-400 text-sm">
                   現在、優先的に対応すべきアクションはありません。インサイトを分析して、次の戦略を立ててみましょう。
                </p>
             </div>
         )}
      </div>

      {/* Schedule (Keep Static/Demo for now as it's complex) */}
      <h2 className="text-xl font-bold text-white mt-12 flex items-center gap-2">
        <span className="w-2 h-8 bg-aurora-purple rounded-full"></span>
        予約投稿スケジュール
      </h2>
      <div className="glass-card p-6">
         {/* ... (Existing Calendar Code) ... */}
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
