'use client';

import { useEffect, useState } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

export default function DebugPage() {
  const { userInfo } = useDashboard();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const token = localStorage.getItem('meo_auth_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/debug/google`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchDebugInfo();
    }
  }, [userInfo]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Google API 接続診断</h1>
        <a href="/dashboard/settings" className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition">
          設定に戻る
        </a>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-4">診断レポート</h2>
        
        {loading && <div className="text-slate-400">診断中...</div>}
        
        {error && (
            <div className="p-4 bg-red-500/20 border border-red-500 rounded text-red-200">
                <h3 className="font-bold">エラーが発生しました</h3>
                <p>{error}</p>
                <p className="text-sm mt-2">APIエンドポイントが見つからない場合は、バックエンドが最新の状態か確認してください。</p>
            </div>
        )}

        {report && (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-900/30 rounded border border-indigo-500/30">
                        <span className="block text-xs text-indigo-300 uppercase">User Email</span>
                        <span className="text-lg font-mono text-white">{report.email}</span>
                    </div>
                    <div className="p-4 bg-indigo-900/30 rounded border border-indigo-500/30">
                        <span className="block text-xs text-indigo-300 uppercase">DB Connection</span>
                        <span className={`text-lg font-bold ${report.db_connection === 'Found' ? 'text-green-400' : 'text-red-400'}`}>
                            {report.db_connection}
                        </span>
                    </div>
                    <div className="p-4 bg-indigo-900/30 rounded border border-indigo-500/30">
                        <span className="block text-xs text-indigo-300 uppercase">Token Status</span>
                        <span className={`text-lg font-bold ${report.token_status !== 'Missing Access Token' ? 'text-green-400' : 'text-red-400'}`}>
                            {report.token_status === 'Missing Access Token' ? 'Missing' : 'Present'}
                        </span>
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-lg font-bold text-white mb-2">API Connectivity Checks</h3>
                    <div className="space-y-2">
                        {Object.entries(report.api_checks || {}).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                                <span className="font-mono text-sm text-slate-300">{key}</span>
                                <span className={`text-sm font-bold ${String(value).startsWith('Success') ? 'text-green-400' : 'text-red-400'}`}>
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 p-4 bg-slate-800 rounded overflow-auto max-h-96">
                    <pre className="text-xs text-green-300 font-mono">
                        {JSON.stringify(report, null, 2)}
                    </pre>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
