'use client';

import { useState } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function ReportsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        
        if (isDemoMode) {
             await new Promise(r => setTimeout(r, 2000));
             alert("デモモード: レポート（サンプル）がダウンロードされました");
             setIsGenerating(false);
             return;
        }

        if (!userInfo?.store_id) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/download/${userInfo.store_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
            });
            
            if (res.ok) {
                // Trigger download
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${userInfo.store_id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("レポート生成に失敗しました");
            }
        } catch (e) {
            console.error(e);
            alert("エラーが発生しました");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">レポート出力</h1>
                <p className="text-slate-400 mt-1">店舗のパフォーマンスとAI分析結果をPDFレポートとして出力します</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Monthly Report Card */}
                <div className="glass-card p-6 flex flex-col justify-between h-full">
                    <div>
                        <div className="w-12 h-12 bg-aurora-purple/20 rounded-lg flex items-center justify-center mb-4 text-aurora-purple">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">月次パフォーマンスレポート</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            検索数、アクション数、クチコミ感情分析など、MEO対策の成果をまとめた総合レポートです。<br/>
                            クライアントへの報告や社内共有に最適です。
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full bg-slate-100 text-deep-navy font-bold py-3 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-deep-navy" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                生成中...
                            </>
                        ) : (
                            <>
                                📥 PDFをダウンロード
                            </>
                        )}
                    </button>
                </div>

                {/* Placeholder for future reports */}
                <div className="glass-card p-6 flex flex-col justify-between h-full opacity-50 border border-dashed border-slate-700">
                    <div>
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-slate-500">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2">競合比較レポート</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            近隣の競合店舗との順位・クチコミ比較レポート。<br/>
                            (Comming Soon)
                        </p>
                    </div>
                    <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3 rounded-lg cursor-not-allowed">
                        準備中
                    </button>
                </div>
            </div>
        </div>
    );
}
