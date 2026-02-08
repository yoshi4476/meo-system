'use client';

import { useState } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

export default function DebugPage() {
    const { userInfo } = useDashboard();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<any>(null);

    const checkStatus = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/google`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStatus(data);
        } catch (e: any) {
            console.error(e);
            setStatus({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    const runDeepAnalysis = async () => {
        setLoading(true);
        setAnalysisReport(null);
        try {
            // Using the hardcoded secret from backend/routers/debug.py for this specific debug tool
            const secret = "debug123"; 
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/analyze_store?secret=${secret}`);
            const data = await res.json();
            setAnalysisReport(data);
        } catch (e: any) {
            setAnalysisReport({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">デバッグツール</h1>
            
            <div className="glass-card p-6">
                <h2 className="text-lg font-bold text-white mb-4">Google連携ステータス確認</h2>
                <button
                    onClick={checkStatus}
                    disabled={loading}
                    className="bg-aurora-cyan text-deep-navy px-4 py-2 rounded font-bold hover:bg-cyan-400 disabled:opacity-50"
                >
                    {loading ? '確認中...' : 'ステータス詳細を確認'}
                </button>

                {status && (
                    <div className="mt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-slate-800 rounded">
                                 <div className="text-xs text-slate-400">DB接続</div>
                                 <div className={`text-lg font-bold ${status.db_connection === 'Found' ? 'text-green-400' : 'text-red-400'}`}>
                                     {status.db_connection}
                                 </div>
                             </div>
                             <div className="p-4 bg-slate-800 rounded">
                                 <div className="text-xs text-slate-400">トークン有効期限</div>
                                 <div className="text-sm font-mono text-white break-all">
                                     {status.token_expiry || '-'}
                                 </div>
                             </div>
                        </div>

                        {status.api_checks && (
                            <div className="bg-black/30 p-4 rounded font-mono text-xs overflow-auto max-h-60">
                                <pre>{JSON.stringify(status.api_checks, null, 2)}</pre>
                            </div>
                        )}
                        
                        <div className="bg-slate-900 p-4 rounded overflow-auto">
                            <pre className="text-xs text-slate-300">
                                {JSON.stringify(status, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass-card p-6 border border-orange-500/30">
                <h2 className="text-lg font-bold text-white mb-4">店舗データ詳細調査 (Production Deep Dive)</h2>
                <p className="text-sm text-slate-400 mb-4">
                    データベース内の店舗データの状態、スキーマ定義、およびGoogle APIからの生データを直接比較します。
                    「反映されない」という問題の原因（DB未保存、APIエラー、表示バグ）を特定します。
                </p>
                <button
                    onClick={runDeepAnalysis}
                    disabled={loading}
                    className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-400 disabled:opacity-50"
                >
                    {loading ? '調査中...' : '徹底調査を実行 (Analyze Store)'}
                </button>

                {analysisReport && (
                    <div className="mt-6 bg-slate-900 p-4 rounded overflow-auto border border-orange-500/20">
                         <h3 className="text-orange-400 font-bold mb-2">調査レポート</h3>
                         {analysisReport.schema_columns && (
                             <div className="mb-4">
                                 <div className="text-xs text-slate-400">DBスキーマ (Column Check):</div>
                                 <div className="text-xs text-green-400 break-all">
                                    {analysisReport.schema_columns.includes('phone_number') ? 'OK: phone_number exists' : 'MISSING: phone_number'} | 
                                    {analysisReport.schema_columns.includes('regular_hours') ? ' OK: regular_hours exists' : ' MISSING: regular_hours'} | 
                                    {analysisReport.schema_columns.includes('attributes') ? ' OK: attributes exists' : ' MISSING: attributes'}
                                 </div>
                             </div>
                         )}

                         <pre className="text-xs text-slate-300 font-mono">
                            {JSON.stringify(analysisReport, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
