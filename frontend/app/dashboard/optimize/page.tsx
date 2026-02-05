'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function OptimizePage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [score, setScore] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
      if (isDemoMode) {
           setAnalyzing(true);
           setTimeout(() => {
               setScore(72);
               setAnalyzing(false);
               setSuggestions([
                   { done: false, title: "最新の写真を5枚追加しましょう", description: "写真が豊富な店舗はクリック率が30%向上します", action: "UPLOAD_PHOTO", type: "INFO" },
                   { done: false, title: "特別営業時間の設定", description: "来週の祝日の営業時間を設定してください", action: "EDIT_HOURS", type: "INFO" },
                   { done: true, title: "ビジネスの説明文の最適化", description: "キーワード「ランチ」を含めた説明文に更新済み", action: "EDIT_DESCRIPTION", type: "SUCCESS" },
                   { done: false, title: "Q&Aに回答する", description: "未回答の質問が2件あります", action: "GO_TO_QA", type: "URGENT" }
               ]);
           }, 1500);
           return;
      }

      const fetchOptimization = async () => {
          if (!userInfo?.store_id) return;
          setAnalyzing(true);
          try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/optimization/${userInfo.store_id}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
              });
              if (res.ok) {
                  const data = await res.json();
                  setScore(data.score);
                  setSuggestions(data.suggestions.map((s: any) => ({
                      ...s,
                      done: false, // Backend currently returns pending suggestions
                      impact: s.type === 'URGENT' ? 'High' : 'Medium'
                  })));
              }
          } catch (e) {
              console.error(e);
          } finally {
              setAnalyzing(false);
          }
      };

      fetchOptimization();
  }, [userInfo, isDemoMode]);

  return (
    <div className="space-y-8">
       <div>
         <h1 className="text-3xl font-bold text-white">プロフィール最適化</h1>
         <p className="text-slate-400 mt-1">AIが店舗情報の充実度を診断し、改善案を提示します</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score Card */}
          <div className="glass-card p-8 flex flex-col items-center justify-center text-center lg:col-span-1">
              <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                        <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                        {!analyzing && (
                            <circle 
                                cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                className="text-aurora-cyan transition-all duration-1000 ease-out"
                                strokeDasharray={500}
                                strokeDashoffset={500 - (500 * score) / 100}
                            />
                        )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      {analyzing ? (
                          <span className="text-slate-400 animate-pulse">分析中...</span>
                      ) : (
                          <>
                            <span className="text-5xl font-bold text-white">{score}</span>
                            <span className="text-sm text-slate-400">/ 100</span>
                          </>
                      )}
                  </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">最適化スコア</h3>
              <p className="text-slate-400 text-sm">
                  {score >= 80 ? '素晴らしい状態です！' : score >= 60 ? 'あと一息です。改善点を確認しましょう' : '情報の充実が必要です'}
              </p>
          </div>

          {/* Suggestions List */}
          <div className="glass-card p-6 lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">🚀 改善アクションリスト</h3>
              {analyzing ? (
                  <div className="space-y-4">
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />)}
                  </div>
              ) : suggestions.length > 0 ? (
                  <div className="space-y-3">
                      {suggestions.map((s, i) => (
                          <SuggestionItem 
                            key={i}
                            done={s.done} 
                            title={s.title} 
                            desc={s.description}
                            impact={s.impact || (s.type === 'URGENT' ? 'High' : 'Medium')}
                          />
                      ))}
                  </div>
              ) : (
                  <div className="text-slate-500 text-center py-8">
                      提案事項はありません。現在の状態は良好です。
                  </div>
              )}
          </div>
      </div>
    </div>
  );
}

function SuggestionItem({ done, title, desc, impact }: { done: boolean, title: string, desc: string, impact: string }) {
    return (
        <div className={`flex items-center gap-4 p-4 rounded-lg border ${done ? 'bg-slate-900/30 border-slate-700 opacity-60' : 'bg-slate-800/50 border-white/10 hover:border-aurora-cyan/50'}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${done ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-slate-500 text-transparent'}`}>
                {done && '✓'}
            </div>
            <div className="flex-1">
                <div className={`font-bold ${done ? 'text-slate-400 line-through' : 'text-white'}`}>{title}</div>
                <div className="text-xs text-slate-400">{desc}</div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold ${impact === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {impact}
            </div>
        </div>
    );
}
