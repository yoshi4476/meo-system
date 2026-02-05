'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type Suggestion = {
    done: boolean;
    title: string;
    description: string;
    type: 'URGENT' | 'WARNING' | 'INFO' | 'SUCCESS';
    action: string;
    points: number;
};

type OptimizationData = {
    score: number;
    completeness: {
        basicInfo: number;
        photos: number;
        reviews: number;
        posts: number;
        qa: number;
    };
    suggestions: Suggestion[];
};

export default function OptimizePage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [data, setData] = useState<OptimizationData | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (isDemoMode) {
            setAnalyzing(true);
            setTimeout(() => {
                setData({
                    score: 72,
                    completeness: {
                        basicInfo: 90,
                        photos: 60,
                        reviews: 85,
                        posts: 50,
                        qa: 40,
                    },
                    suggestions: [
                        { done: false, title: "最新の写真を5枚追加", description: "写真が豊富な店舗はクリック率が30%向上します", action: "UPLOAD_PHOTO", type: "WARNING", points: 10 },
                        { done: false, title: "特別営業時間の設定", description: "来週の祝日の営業時間を設定してください", action: "EDIT_HOURS", type: "INFO", points: 5 },
                        { done: true, title: "ビジネスの説明文の最適化", description: "キーワード「ランチ」を含めた説明文に更新済み", action: "EDIT_DESCRIPTION", type: "SUCCESS", points: 0 },
                        { done: false, title: "Q&Aに回答する", description: "未回答の質問が2件あります", action: "GO_TO_QA", type: "URGENT", points: 15 },
                        { done: false, title: "週1回の投稿を維持", description: "定期的な投稿で検索順位が向上します", action: "CREATE_POST", type: "INFO", points: 10 },
                    ]
                });
                setAnalyzing(false);
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
                    const apiData = await res.json();
                    // Transform API response
                    setData({
                        score: apiData.score,
                        completeness: {
                            basicInfo: apiData.score > 80 ? 95 : 70,
                            photos: 60,
                            reviews: apiData.suggestions.some((s: any) => s.action === 'GO_TO_REVIEWS') ? 50 : 80,
                            posts: 50,
                            qa: 40,
                        },
                        suggestions: apiData.suggestions.map((s: any, i: number) => ({
                            ...s,
                            done: false,
                            points: s.type === 'URGENT' ? 15 : s.type === 'WARNING' ? 10 : 5,
                        }))
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setAnalyzing(false);
            }
        };

        fetchOptimization();
    }, [userInfo, isDemoMode]);

    const potentialPoints = data?.suggestions.filter(s => !s.done).reduce((sum, s) => sum + s.points, 0) || 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white">プロフィール最適化</h1>
                <p className="text-slate-400 mt-1">Googleビジネスプロフィールの充実度を診断し、改善案を提示します</p>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Score */}
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                    <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-800" />
                            {!analyzing && data && (
                                <circle 
                                    cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="10" fill="transparent" 
                                    className={data.score >= 80 ? "text-green-500" : data.score >= 60 ? "text-yellow-500" : "text-red-500"}
                                    strokeDasharray={377}
                                    strokeDashoffset={377 - (377 * data.score) / 100}
                                />
                            )}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {analyzing ? (
                                <span className="text-slate-400 animate-pulse text-sm">分析中...</span>
                            ) : (
                                <>
                                    <span className="text-4xl font-bold text-white">{data?.score || 0}</span>
                                    <span className="text-xs text-slate-400">/ 100</span>
                                </>
                            )}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-white">最適化スコア</h3>
                    <p className="text-slate-500 text-xs mt-1">
                        {data && data.score >= 80 ? '素晴らしい！' : data && data.score >= 60 ? '改善の余地あり' : '改善が必要'}
                    </p>
                </div>

                {/* Potential Points */}
                <div className="glass-card p-6 flex flex-col items-center justify-center text-center">
                    <div className="text-5xl mb-2">🎯</div>
                    <h3 className="text-lg font-bold text-white">獲得可能ポイント</h3>
                    <p className="text-3xl font-bold text-aurora-cyan mt-2">+{potentialPoints}</p>
                    <p className="text-xs text-slate-500 mt-1">すべて完了で{(data?.score || 0) + potentialPoints}点に</p>
                </div>

                {/* Quick Stats */}
                <div className="glass-card p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-4">📊 項目別完成度</h3>
                    <div className="space-y-3">
                        <ProgressBar label="基本情報" value={data?.completeness.basicInfo || 0} />
                        <ProgressBar label="写真" value={data?.completeness.photos || 0} />
                        <ProgressBar label="クチコミ対応" value={data?.completeness.reviews || 0} />
                        <ProgressBar label="投稿" value={data?.completeness.posts || 0} />
                        <ProgressBar label="Q&A" value={data?.completeness.qa || 0} />
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">🚀 アクションリスト</h3>
                    <div className="text-sm text-slate-400">
                        完了: {data?.suggestions.filter(s => s.done).length || 0} / {data?.suggestions.length || 0}
                    </div>
                </div>
                
                {analyzing ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-800/50 rounded-lg animate-pulse" />)}
                    </div>
                ) : data?.suggestions && data.suggestions.length > 0 ? (
                    <div className="space-y-3">
                        {data.suggestions.sort((a, b) => {
                            // Sort: URGENT first, then WARNING, then INFO, SUCCESS last
                            const order = { URGENT: 0, WARNING: 1, INFO: 2, SUCCESS: 3 };
                            return order[a.type] - order[b.type];
                        }).map((s, i) => (
                            <ActionItem key={i} suggestion={s} />
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-500 text-center py-8">
                        改善事項はありません。素晴らしい状態です！🎉
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TipCard 
                    emoji="📸" 
                    title="写真の重要性" 
                    desc="写真を10枚以上追加すると、問い合わせ数が42%増加する傾向があります。"
                />
                <TipCard 
                    emoji="💬" 
                    title="クチコミ返信" 
                    desc="24時間以内にクチコミに返信すると、好印象を与えリピーターが増加します。"
                />
                <TipCard 
                    emoji="📝" 
                    title="定期投稿" 
                    desc="週1回以上の投稿を維持することで、検索結果での表示順位が向上します。"
                />
            </div>
        </div>
    );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
    const color = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 w-24">{label}</span>
            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
            </div>
            <span className="text-sm text-white font-bold w-10 text-right">{value}%</span>
        </div>
    );
}

function ActionItem({ suggestion }: { suggestion: Suggestion }) {
    const { done, title, description, type, points } = suggestion;
    
    const typeStyles = {
        URGENT: 'border-l-red-500 bg-red-500/5',
        WARNING: 'border-l-yellow-500 bg-yellow-500/5',
        INFO: 'border-l-blue-500 bg-blue-500/5',
        SUCCESS: 'border-l-green-500 bg-green-500/5 opacity-60',
    };
    
    const typeBadge = {
        URGENT: { label: '緊急', style: 'bg-red-500/20 text-red-400' },
        WARNING: { label: '重要', style: 'bg-yellow-500/20 text-yellow-400' },
        INFO: { label: '推奨', style: 'bg-blue-500/20 text-blue-400' },
        SUCCESS: { label: '完了', style: 'bg-green-500/20 text-green-400' },
    };

    return (
        <div className={`flex items-center gap-4 p-4 rounded-lg border-l-4 ${typeStyles[type]}`}>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${done ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-slate-500'}`}>
                {done && '✓'}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`font-bold ${done ? 'text-slate-400 line-through' : 'text-white'}`}>{title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{description}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {!done && points > 0 && (
                    <span className="text-aurora-cyan text-sm font-bold">+{points}pt</span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-bold ${typeBadge[type].style}`}>
                    {typeBadge[type].label}
                </span>
            </div>
        </div>
    );
}

function TipCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
    return (
        <div className="glass-card p-5">
            <div className="text-2xl mb-2">{emoji}</div>
            <h4 className="font-bold text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-400">{desc}</p>
        </div>
    );
}
