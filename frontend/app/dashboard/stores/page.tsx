'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type Store = {
  id: string;
  name: string;
  google_location_id: string;
  company_id?: string;
};

export default function AdminStoresPage() {
  const { userInfo } = useDashboard();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        
        const response = await fetch(`${apiUrl}/admin/stores`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStores(data);
        } else {
          const err = await response.text();
          // 403 logic usually means not super admin
          setError(`Error ${response.status}: ${err}`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userInfo?.role === 'SUPER_ADMIN') {
      fetchStores();
    } else if (userInfo) {
       // Not admin
       setIsLoading(false);
       setError("権限がありません (Super Admin required)");
    }
  }, [userInfo]);

  if (isLoading) return <div className="p-8 text-slate-400">読み込み中...</div>;

  if (error) {
     return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-4">店舗管理</h1>
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded text-red-400">
               {error}
            </div>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-white">店舗管理</h1>
           <p className="text-slate-400 mt-1">システムに登録されている全店舗の一覧</p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded text-slate-300">
           合計: <span className="text-white font-bold ml-1">{stores.length}</span> 店舗
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-white/5">
                    <th className="p-4 font-medium">店舗名 / ID</th>
                    <th className="p-4 font-medium">Google Location ID</th>
                    <th className="p-4 font-medium">会社ID</th>
                    <th className="p-4 font-medium">アクション</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
                {stores.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                            店舗が見つかりません
                        </td>
                    </tr>
                ) : stores.map((store) => (
                    <tr key={store.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                            <div className="font-bold text-white">{store.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{store.id}</div>
                        </td>
                        <td className="p-4 font-mono text-sm text-aurora-cyan">
                            {store.google_location_id || '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                            {store.company_id || '未所属'}
                        </td>
                        <td className="p-4">
                            <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">
                                詳細
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}
