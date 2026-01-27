'use client';

import { useState } from 'react';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [reportType, setReportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (format: 'pdf' | 'csv') => {
    setIsExporting(true);
    // モックのエクスポート処理
    setTimeout(() => {
      setIsExporting(false);
      alert(`レポートを${format.toUpperCase()}形式でエクスポートしました。`);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <span className="text-aurora-cyan">📊</span> レポート出力
        </h1>
        <p className="text-slate-400 mt-1">店舗のパフォーマンスレポートを作成・エクスポートします。</p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <h2 className="text-xl font-bold text-white mb-4">レポート設定</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 対象期間 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">対象期間</label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan"
            >
              <option value="last_7_days">過去7日間</option>
              <option value="last_30_days">過去30日間</option>
              <option value="last_90_days">過去90日間</option>
              <option value="this_month">今月</option>
              <option value="last_month">先月</option>
              <option value="custom">カスタム期間</option>
            </select>
          </div>

          {/* レポート種類 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">レポートの種類</label>
            <select 
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan"
            >
              <option value="all">全体サマリー</option>
              <option value="insights">インサイト詳細</option>
              <option value="reviews">クチコミ分析</option>
              <option value="posts">投稿パフォーマンス</option>
            </select>
          </div>
        </div>
      </div>

      {/* プレビューエリア (モック) */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">プレビュー</h2>
          <span className="text-sm text-slate-400">
            {dateRange === 'last_30_days' ? '2025年12月24日 - 2026年1月23日' : '期間を選択してください'}
          </span>
        </div>

        <div className="space-y-6">
          {/* サマリーカード */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-slate-400 mb-1">合計検索数</div>
              <div className="text-2xl font-bold text-white">12,540</div>
              <div className="text-xs text-green-400 mt-1">↑ 15% 増加</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-slate-400 mb-1">アクション数</div>
              <div className="text-2xl font-bold text-white">843</div>
              <div className="text-xs text-green-400 mt-1">↑ 8% 増加</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-slate-400 mb-1">平均評価</div>
              <div className="text-2xl font-bold text-white">4.8</div>
              <div className="text-xs text-green-400 mt-1">↑ 0.1 改善</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
              <div className="text-sm text-slate-400 mb-1">新規クチコミ</div>
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-xs text-green-400 mt-1">↑ 20% 増加</div>
            </div>
          </div>

          {/* グラフエリア (プレースホルダー) */}
          <div className="aspect-21/9 bg-slate-900/50 rounded-lg flex items-center justify-center border border-white/5">
            <div className="text-center">
              <p className="text-slate-500 mb-2">パフォーマンス推移グラフ</p>
              <div className="flex items-end gap-1 h-32 justify-center opacity-50">
                {[40, 60, 45, 70, 50, 80, 65, 85, 75, 90, 80, 95].map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} className="w-4 bg-aurora-purple rounded-t-sm"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* エクスポートボタン */}
      <div className="flex gap-4 justify-end">
        <button 
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-white/10 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSVダウンロード
        </button>
        <button 
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="px-6 py-3 btn-primary flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              作成中...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDFレポート出力
            </>
          )}
        </button>
      </div>
    </div>
  );
}
