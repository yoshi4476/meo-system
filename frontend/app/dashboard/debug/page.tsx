'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

export default function DebugPage() {
    const { userInfo } = useDashboard();
    const [activeTab, setActiveTab] = useState('system');
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [aiStatus, setAiStatus] = useState<any>(null);
    const [snsStatus, setSnsStatus] = useState<any>(null);
    const [googleStatus, setGoogleStatus] = useState<any>(null);
    const [analysisReport, setAnalysisReport] = useState<any>(null);
    const [syncResult, setSyncResult] = useState<any>(null);

    const fetchData = async (endpoint: string, setter: any) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setter(data);
        } catch (e: any) {
            console.error(e);
            setter({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch based on tab
    useEffect(() => {
        if (activeTab === 'system' && !systemInfo) fetchData('system', setSystemInfo);
        if (activeTab === 'ai' && !aiStatus) fetchData('ai', setAiStatus);
        if (activeTab === 'sns' && !snsStatus) fetchData('sns', setSnsStatus);
        if (activeTab === 'google' && !googleStatus) fetchData('google', setGoogleStatus);
    }, [activeTab]);

    const runDeepAnalysis = async () => {
        setLoading(true);
        setAnalysisReport(null);
        try {
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

    const triggerSync = async (type: string) => {
        setLoading(true);
        setSyncResult(null);
        try {
             const token = localStorage.getItem('meo_auth_token');
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/sync/${type}`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}` }
             });
             const data = await res.json();
             setSyncResult(data);
        } catch (e: any) {
            setSyncResult({ error: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-white mb-6">🛠️ 統合デバッグコンソール</h1>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-1 overflow-x-auto">
                {['system', 'google', 'sns', 'ai', 'sync'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-t-lg font-bold text-sm transition-colors ${
                            activeTab === tab 
                            ? 'bg-aurora-cyan/20 text-aurora-cyan border-b-2 border-aurora-cyan' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                
                {/* SYSTEM TAB */}
                {activeTab === 'system' && (
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">システム情報</h2>
                            <button onClick={() => fetchData('system', setSystemInfo)} className="text-xs bg-slate-700 px-3 py-1 rounded">Refresh</button>
                        </div>
                        {systemInfo ? (
                             <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 p-4 rounded">
                                        <div className="text-xs text-slate-400">Server Time (UTC)</div>
                                        <div className="text-lg font-mono text-white">{systemInfo.server_time}</div>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded">
                                        <div className="text-xs text-slate-400">Python Version</div>
                                        <div className="text-xs font-mono text-white">{systemInfo.python_version}</div>
                                    </div>
                                </div>
                                <div className="bg-black/30 p-4 rounded">
                                    <h3 className="text-sm font-bold text-slate-300 mb-2">Environment Variables</h3>
                                    <pre className="text-xs text-green-400 font-mono">
                                        {JSON.stringify(systemInfo.env_vars, null, 2)}
                                    </pre>
                                </div>
                             </div>
                        ) : (
                            <div className="text-slate-400 animate-pulse">Loading system info...</div>
                        )}
                    </div>
                )}

                {/* GOOGLE TAB */}
                {activeTab === 'google' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-white">Google 連携ステータス</h2>
                                <button onClick={() => fetchData('google', setGoogleStatus)} className="text-xs bg-slate-700 px-3 py-1 rounded">Refresh</button>
                            </div>
                            {googleStatus ? (
                                <div className="mt-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                         <div className="p-4 bg-slate-800 rounded border border-white/5">
                                             <div className="text-xs text-slate-400">DB Connection</div>
                                             <div className={`text-lg font-bold ${googleStatus.db_connection === 'Found' ? 'text-green-400' : 'text-red-400'}`}>
                                                 {googleStatus.db_connection}
                                             </div>
                                         </div>
                                         <div className="p-4 bg-slate-800 rounded border border-white/5">
                                             <div className="text-xs text-slate-400">Token Status</div>
                                             <div className={`text-lg font-bold ${googleStatus.token_status === 'Present' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                 {googleStatus.token_status}
                                             </div>
                                         </div>
                                    </div>
                                    
                                     {googleStatus.api_checks && (
                                        <div className="bg-black/30 p-4 rounded font-mono text-xs overflow-auto max-h-60 border border-white/10">
                                            <div className="text-xs text-slate-400 mb-2">API Connectivity Checks</div>
                                            <pre>{JSON.stringify(googleStatus.api_checks, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-slate-400 animate-pulse">Checking Google status...</div>
                            )}
                        </div>

                        <div className="glass-card p-6 border border-orange-500/30">
                            <h2 className="text-lg font-bold text-white mb-4">Deep Dive Analysis</h2>
                            <button
                                onClick={runDeepAnalysis}
                                disabled={loading}
                                className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-400 disabled:opacity-50 text-sm"
                            >
                                {loading ? 'Analyzing...' : 'Run Deep Analysis'}
                            </button>
                            {analysisReport && (
                                <div className="mt-4 bg-slate-900 p-4 rounded overflow-auto h-96 border border-orange-500/20 text-xs font-mono">
                                    <pre>{JSON.stringify(analysisReport, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SNS TAB */}
                {activeTab === 'sns' && (
                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">SNS Integration Status</h2>
                            <button onClick={() => fetchData('sns', setSnsStatus)} className="text-xs bg-slate-700 px-3 py-1 rounded">Refresh</button>
                        </div>
                        {snsStatus ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 mb-2">Custom Credentials (Settings)</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {Object.entries(snsStatus.custom_credentials_configured || {}).map(([key, val]) => (
                                            <div key={key} className={`p-3 rounded border ${val ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                                <div className="text-xs uppercase font-bold text-white">{key}</div>
                                                <div className={`text-sm ${val ? 'text-green-400' : 'text-red-400'}`}>{val ? 'Configured' : 'Missing'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 mb-2">Active OAuth Connections.</h3>
                                    {Object.keys(snsStatus.active_connections || {}).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(snsStatus.active_connections).map(([key, val]: any) => (
                                                 <div key={key} className="bg-slate-800 p-3 rounded flex justify-between items-center">
                                                     <span className="text-white font-bold capitalize">{key}</span>
                                                     <div className="text-right">
                                                         <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">Connected</span>
                                                         <div className="text-[10px] text-slate-500 mt-1">Exp: {val.expiry}</div>
                                                     </div>
                                                 </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-sm">No active SNS connections found.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 animate-pulse">Loading SNS status...</div>
                        )}
                    </div>
                )}

                {/* AI TAB */}
                {activeTab === 'ai' && (
                    <div className="glass-card p-6">
                         <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">AI Capabilities</h2>
                            <button onClick={() => fetchData('ai', setAiStatus)} className="text-xs bg-slate-700 px-3 py-1 rounded">Refresh</button>
                        </div>
                        {aiStatus ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900 p-4 rounded border border-white/5">
                                        <div className="text-xs text-slate-400">OpenAI Key Source</div>
                                        <div className="text-white font-bold">{aiStatus.openai_key_source}</div>
                                    </div>
                                    <div className="bg-slate-900 p-4 rounded border border-white/5">
                                        <div className="text-xs text-slate-400">Gemini Key Source</div>
                                        <div className="text-white font-bold">{aiStatus.gemini_key_source}</div>
                                    </div>
                                </div>
                                
                                <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                                    <h3 className="text-indigo-300 text-sm font-bold mb-2">Connection Test Result</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`text-lg font-bold ${aiStatus.connection_status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {aiStatus.connection_status}
                                        </div>
                                    </div>
                                    {aiStatus.test_generation && (
                                        <div className="bg-black/40 p-3 rounded">
                                            <div className="text-[10px] text-slate-500 mb-1">Generated Output:</div>
                                            <p className="text-white text-sm">"{aiStatus.test_generation}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                             <div className="text-slate-400 animate-pulse">Testing AI connection...</div>
                        )}
                    </div>
                )}

                {/* SYNC TAB */}
                {activeTab === 'sync' && (
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Manual Sync Triggers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-800 p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-aurora-cyan/50 transition-colors">
                                <div className="text-4xl mb-3">💬</div>
                                <h3 className="text-white font-bold mb-2">クチコミ同期</h3>
                                <p className="text-xs text-slate-400 mb-4">最新のGoogleクチコミを取得します</p>
                                <button 
                                    onClick={() => triggerSync('reviews')}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm"
                                >
                                    reviews同期を実行
                                </button>
                            </div>
                            
                            <div className="bg-slate-800 p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-aurora-cyan/50 transition-colors">
                                <div className="text-4xl mb-3">📊</div>
                                <h3 className="text-white font-bold mb-2">インサイト同期</h3>
                                <p className="text-xs text-slate-400 mb-4">過去30日間のパフォーマンスデータを取得</p>
                                <button 
                                    onClick={() => triggerSync('insights')}
                                    disabled={loading}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-bold text-sm"
                                >
                                    insights同期を実行
                                </button>
                            </div>

                             <div className="bg-slate-800 p-6 rounded-xl border border-white/5 flex flex-col items-center text-center hover:border-aurora-cyan/50 transition-colors">
                                <div className="text-4xl mb-3">🔄</div>
                                <h3 className="text-white font-bold mb-2">全データ同期</h3>
                                <p className="text-xs text-slate-400 mb-4">すべてのデータを一括更新（時間がかかります）</p>
                                <button 
                                    onClick={() => triggerSync('all')}
                                    disabled={loading}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg font-bold text-sm"
                                >
                                    完全同期を実行
                                </button>
                            </div>
                        </div>

                        {syncResult && (
                            <div className="mt-8 p-4 bg-slate-900 rounded border border-white/10">
                                <h3 className="text-white font-bold mb-2">実行結果</h3>
                                <pre className="text-xs text-green-400 font-mono">
                                    {JSON.stringify(syncResult, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
