'use client';
import { useState } from 'react';

export default function OptimizePage() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const auditItems = [
    { category: '基本情報', items: [
      { name: 'ビジネス名', status: 'good', score: 100 },
      { name: 'カテゴリ', status: 'good', score: 100 },
      { name: '住所', status: 'good', score: 100 },
      { name: '電話番号', status: 'good', score: 100 },
      { name: 'ウェブサイト', status: 'good', score: 100 },
      { name: 'ビジネス説明', status: 'warning', score: 70, tip: 'キーワードを追加して最適化可能' },
    ]},
    { category: '営業時間', items: [
      { name: '通常営業時間', status: 'good', score: 100 },
      { name: '特別営業時間', status: 'error', score: 0, tip: '祝日の営業時間が未設定' },
    ]},
    { category: '写真', items: [
      { name: '外観写真', status: 'warning', score: 50, tip: '推奨: 5枚以上（現在2枚）' },
      { name: '内観写真', status: 'warning', score: 60, tip: '推奨: 5枚以上（現在3枚）' },
      { name: '料理写真', status: 'good', score: 90 },
      { name: 'スタッフ写真', status: 'error', score: 20, tip: '1枚のみ。追加推奨' },
    ]},
    { category: 'エンゲージメント', items: [
      { name: 'クチコミ返信率', status: 'warning', score: 75, tip: '未返信が3件あります' },
      { name: '投稿頻度', status: 'good', score: 85 },
      { name: 'Q&A', status: 'error', score: 30, tip: '3件のみ。10件以上推奨' },
    ]},
  ];

  const totalScore = Math.round(
    auditItems.flatMap(c => c.items).reduce((sum, item) => sum + item.score, 0) / 
    auditItems.flatMap(c => c.items).length
  );

  const getStatusIcon = (status: string) => {
    if (status === 'good') return '✅';
    if (status === 'warning') return '⚠️';
    return '❌';
  };

  const getStatusColor = (status: string) => {
    if (status === 'good') return 'text-green-400';
    if (status === 'warning') return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">プロフィール最適化</h1>
          <p className="text-slate-400 mt-1">AIがプロフィールを分析し、改善点を提案します</p>
        </div>
        <button 
          onClick={() => { setIsOptimizing(true); setTimeout(() => setIsOptimizing(false), 2000); }}
          disabled={isOptimizing}
          className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 transition-colors text-sm font-medium shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isOptimizing ? '分析中...' : '🔄 再分析'}
        </button>
      </div>

      {/* 総合スコア */}
      <div className="glass-card p-8 flex items-center gap-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" stroke="#1e293b" strokeWidth="12" fill="none" />
            <circle 
              cx="64" cy="64" r="56" 
              stroke="url(#gradient)" 
              strokeWidth="12" 
              fill="none" 
              strokeDasharray={`${totalScore * 3.52} 352`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{totalScore}</span>
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">プロフィール完成度</h2>
          <p className="text-slate-400 mb-4">
            {totalScore >= 80 ? '素晴らしい！プロフィールは良好な状態です。' :
             totalScore >= 60 ? 'いくつかの改善点があります。' :
             '重要な改善点があります。早めの対応をお勧めします。'}
          </p>
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">✅ {auditItems.flatMap(c => c.items).filter(i => i.status === 'good').length} 良好</span>
            <span className="text-yellow-400">⚠️ {auditItems.flatMap(c => c.items).filter(i => i.status === 'warning').length} 改善推奨</span>
            <span className="text-red-400">❌ {auditItems.flatMap(c => c.items).filter(i => i.status === 'error').length} 要対応</span>
          </div>
        </div>
        <button 
          onClick={() => {
            setIsOptimizing(true);
            setTimeout(() => {
              setIsOptimizing(false);
              alert('自動最適化が完了しました！\n\n- ビジネス説明文にキーワードを追加\n- 未返信のクチコミにAI返信を下書き\n- 写真の追加を推奨');
            }, 2000);
          }}
          disabled={isOptimizing}
          className="px-6 py-3 rounded-lg bg-aurora-cyan hover:bg-aurora-cyan/80 text-white font-medium transition-colors disabled:opacity-50"
        >
          {isOptimizing ? '最適化中...' : '✨ 自動最適化を実行'}
        </button>
      </div>

      {/* カテゴリ別チェック */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {auditItems.map((category) => (
          <div key={category.category} className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4">{category.category}</h3>
            <div className="space-y-3">
              {category.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span>{getStatusIcon(item.status)}</span>
                    <div>
                      <span className="text-white">{item.name}</span>
                      {item.tip && (
                        <p className="text-xs text-slate-500">{item.tip}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${getStatusColor(item.status)}`}>{item.score}%</span>
                    {item.status !== 'good' && (
                      <button className="text-xs px-2 py-1 rounded bg-aurora-purple/20 text-aurora-purple hover:bg-aurora-purple hover:text-white transition-colors">
                        修正
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AIアドバイス */}
      <div className="glass-card p-6 border-l-4 border-l-aurora-purple">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span>🤖</span> AIからの最適化アドバイス
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">❌</span>
              <span className="font-bold text-white">特別営業時間の設定</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              成人の日（1/13）、建国記念の日（2/11）などの祝日営業時間が未設定です。
              設定することで「営業中」表示が正確になり、来店機会の損失を防げます。
            </p>
            <a href="/dashboard/profile" className="text-sm px-3 py-1.5 rounded bg-aurora-purple text-white hover:bg-aurora-purple/80 transition-colors">
              今すぐ設定
            </a>
          </div>
          
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="font-bold text-white">ビジネス説明文の最適化</span>
            </div>
            <p className="text-sm text-slate-400 mb-3">
              検索キーワード「渋谷 ランチ」「渋谷 カフェ」を説明文に含めると、
              検索表示回数が向上する可能性があります。
            </p>
            <a href="/dashboard/profile" className="text-sm px-3 py-1.5 rounded bg-aurora-purple text-white hover:bg-aurora-purple/80 transition-colors">
              AIで説明文を生成
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
