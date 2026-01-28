'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type SentimentData = {
    summary: string;
    sentiment_score: number;
    positive_points: string[];
    negative_points: string[];
    action_plan: string;
};

export default function SentimentPage() {
    const { userInfo } = useDashboard();
    const [data, setData] = useState<SentimentData | null>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/analyze/sentiment`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ store_id: userInfo?.store_id })
            });
            if (res.ok) {
                setData(await res.json());
            } else {
                alert("分析に失敗しました");
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        } finally {
            setLoading(false);
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">AI感情分析</h1>
                    <p className="text-slate-400 mt-1">クチコミからお客様の本音と改善点を分析します</p>
                </div>
                <button 
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="bg-aurora-purple text-white font-bold px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            分析中...
                        </>
                    ) : (
                        '✨ 今すぐ分析実行'
                    )}
                </button>
            </div>

            {data ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    {/* Score & Summary */}
                    <div className="glass-card p-6 lg:col-span-2 flex flex-col md:flex-row gap-8 items-center">
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" className="text-slate-700" />
                                <circle 
                                    cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="transparent" 
                                    className={data.sentiment_score >= 80 ? "text-green-500" : data.sentiment_score >= 50 ? "text-yellow-500" : "text-red-500"}
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * data.sentiment_score) / 100}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-white">{data.sentiment_score}</span>
                                <span className="text-xs text-slate-400">スコア</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">総評</h3>
                            <p className="text-slate-300 leading-relaxed">{data.summary}</p>
                            
                            <div className="mt-4 bg-aurora-cyan/10 border border-aurora-cyan/30 p-4 rounded-lg">
                                <h4 className="font-bold text-aurora-cyan mb-1">🚀 アクションプラン</h4>
                                <p className="text-white">{data.action_plan}</p>
                            </div>
                        </div>
                    </div>

                    {/* Positive Points */}
                    <div className="glass-card p-6 border-t-4 border-green-500">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-green-400">👍</span> 高評価ポイント
                        </h3>
                        <ul className="space-y-2">
                            {data.positive_points.map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300">
                                    <span className="text-green-500 mt-1">✓</span>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Negative Points */}
                    <div className="glass-card p-6 border-t-4 border-red-500">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-red-400">👎</span> 改善の余地（低評価要因）
                        </h3>
                        <ul className="space-y-2">
                            {data.negative_points.map((p, i) => (
                                <li key={i} className="flex items-start gap-2 text-slate-300">
                                    <span className="text-red-500 mt-1">⚠</span>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4">🧠</div>
                    <h3 className="text-xl font-bold text-white mb-2">AIがクチコミを分析します</h3>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        直近のクチコミデータを収集し、顧客満足度や具体的な改善点をレポート形式で出力します。<br/>
                        「今すぐ分析実行」ボタンを押してください。
                    </p>
                </div>
            )}
        </div>
    );
}
