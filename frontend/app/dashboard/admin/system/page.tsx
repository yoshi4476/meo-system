'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, Activity, AlertTriangle, Clock } from 'lucide-react';

export default function SystemAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [statsRes, loginsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/system/logins`, { headers })
      ]);

      if (!statsRes.ok || !loginsRes.ok) {
         if (statsRes.status === 403) setError("アクセス権限がありません (Super Admin Only)");
         else setError("データ取得に失敗しました");
         return;
      }

      setStats(await statsRes.json());
      setLogins(await loginsRes.json());
    } catch (e) {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (error) return (
    <div className="p-10 text-center text-red-400 bg-slate-900 border border-slate-800 rounded-xl m-10">
      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <h2 className="text-xl font-bold mb-2">Access Denied</h2>
      <p>{error}</p>
    </div>
  );

  if (loading) return <div className="p-10 text-center text-slate-400">Loading system stats...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          System Admin Dashboard
        </h1>
        <p className="text-slate-400 mt-2">システム全体の稼働状況とセキュリティログ</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Users className="w-6 h-6"/></div>
             <span className="text-2xl font-bold text-white">{stats.user_count}</span>
           </div>
           <h3 className="text-slate-400 text-sm">総ユーザー数</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><Activity className="w-6 h-6"/></div>
             <span className="text-2xl font-bold text-white">{stats.store_count}</span>
           </div>
           <h3 className="text-slate-400 text-sm">総店舗数</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Activity className="w-6 h-6"/></div>
             <span className="text-2xl font-bold text-white">{stats.active_users}</span>
           </div>
           <h3 className="text-slate-400 text-sm">24時間以内アクティブ</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
           <div className="flex items-center justify-between mb-4">
             <div className="p-2 bg-red-500/20 text-red-400 rounded-lg"><AlertTriangle className="w-6 h-6"/></div>
             <span className="text-2xl font-bold text-white">{stats.error_count}</span>
           </div>
           <h3 className="text-slate-400 text-sm">システムエラー (通知)</h3>
        </div>
      </div>

      {/* Login History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Clock className="w-5 h-5 text-slate-400" />
             最近のログイン履歴
           </h2>
           <span className="text-xs text-slate-500">Latest 50 records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">User Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logins.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 text-white font-medium">{log.user_email}</td>
                  <td className="px-6 py-4">{new Date(log.login_at).toLocaleString()}</td>
                  <td className="px-6 py-4"><span className="font-mono bg-slate-800 px-2 py-1 rounded text-xs">{log.ip_address}</span></td>
                  <td className="px-6 py-4 truncate max-w-xs" title={log.user_agent}>{log.user_agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
