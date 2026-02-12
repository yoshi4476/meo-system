'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type Store = {
  id: string;
  name: string;
  google_location_id: string;
  company_id?: string;
};

type Company = {
    id: string;
    name: string;
};

export default function AdminStoresPage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [stores, setStores] = useState<Store[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (isDemoMode) {
          setStores([
              { id: 's1', name: 'MEO Cafe 渋谷店 (Demo)', google_location_id: 'loc-001', company_id: 'c1' },
              { id: 's2', name: 'MEO Cafe 新宿店 (Demo)', google_location_id: 'loc-002', company_id: 'c1' },
              { id: 's3', name: 'MEO Cafe 池袋店 (Demo)', google_location_id: 'loc-003', company_id: 'c1' },
          ]);
          setCompanies([
              { id: 'c1', name: '株式会社サンプル（デモ）' },
              { id: 'c2', name: '合同会社テスト（デモ）' }
          ]);
          setIsLoading(false);
          return;
      }

      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Stores
        const storesRes = await fetch(`${apiUrl}/admin/stores`, { headers });
        if (storesRes.ok) {
           setStores(await storesRes.json());
        } else {
           const err = await storesRes.text();
           setError(`Error ${storesRes.status}: ${err}`);
        }
        
        // Fetch Companies (Only for Super Admin)
        if (userInfo?.role === 'SUPER_ADMIN') {
            const compRes = await fetch(`${apiUrl}/admin/companies`, { headers });
            if (compRes.ok) setCompanies(await compRes.json());
        }

      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isDemoMode || (userInfo && (userInfo.role === 'SUPER_ADMIN' || userInfo.role === 'COMPANY_ADMIN'))) {
        fetchData();
    } else if (userInfo) {
       setIsLoading(false);
       setError("権限がありません (Super Admin or Company Admin required)");
    }
  }, [userInfo, isDemoMode]);

  const handleCreateStore = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const token = localStorage.getItem('meo_auth_token');
      const payload: any = { name: newStoreName };
      
      if (userInfo?.role === 'SUPER_ADMIN' && selectedCompanyId) {
          payload.company_id = selectedCompanyId;
      }

      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/admin/stores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
          });
          
          if(res.ok) {
              window.location.reload();
          } else { 
              const err = await res.json();
              alert("作成に失敗しました: " + (err.detail || JSON.stringify(err)));
          }
      } catch (e) {
          console.error(e);
          alert("エラーが発生しました");
      }
  };

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-white">店舗管理</h1>
           <p className="text-slate-400 mt-1 text-sm sm:text-base">システムに登録されている全店舗の一覧</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-aurora-cyan text-deep-navy font-bold px-3 sm:px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors text-sm sm:text-base"
            >
                + 店舗を追加
            </button>
            <div className="bg-slate-800 px-3 sm:px-4 py-2 rounded text-slate-300 flex items-center text-sm sm:text-base">
               合計: <span className="text-white font-bold ml-1">{stores.length}</span> 店舗
            </div>
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-white/5">
                    <th className="p-4 font-medium">店舗名 / ID</th>
                    <th className="p-4 font-medium">Google Location ID</th>
                    <th className="p-4 font-medium">所属企業</th>
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
                ) : stores.map((store) => {
                    const company = companies.find(c => c.id === store.company_id);
                    return (
                    <tr key={store.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                            <div className="font-bold text-white">{store.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{store.id}</div>
                        </td>
                        <td className="p-4 font-mono text-sm text-aurora-cyan">
                            {store.google_location_id || '-'}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                             {company ? (
                                <div className="text-purple-300">🏢 {company.name}</div>
                             ) : (
                                store.company_id ? store.company_id : '未所属'
                             )}
                        </td>
                        <td className="p-4">
                            <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">
                                詳細
                            </button>
                        </td>
                    </tr>
                )})}
            </tbody>
        </table>
      </div>

      {/* Create Store Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-4">新規店舗作成</h2>
                  <form onSubmit={handleCreateStore} className="space-y-4">
                      <div>
                          <label className="block text-xs text-slate-400 mb-1">店舗名</label>
                          <input 
                              type="text" 
                              required
                              value={newStoreName}
                              onChange={e => setNewStoreName(e.target.value)}
                              className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                          />
                      </div>
                      
                      {/* Company Selection (Only for Super Admin) */}
                      {userInfo?.role === 'SUPER_ADMIN' && (
                          <div>
                              <label className="block text-xs text-slate-400 mb-1">所属企業</label>
                              <select 
                                  value={selectedCompanyId}
                                  onChange={e => setSelectedCompanyId(e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                                  required
                              >
                                  <option value="">未選択</option>
                                  {companies.map(c => (
                                      <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                              </select>
                          </div>
                      )}

                      <div className="flex gap-3 pt-4">
                          <button 
                              type="button" 
                              onClick={() => setIsModalOpen(false)}
                              className="flex-1 bg-slate-800 text-slate-300 py-2 rounded hover:bg-slate-700"
                          >
                              キャンセル
                          </button>
                          <button 
                              type="submit" 
                              className="flex-1 bg-aurora-cyan text-deep-navy font-bold py-2 rounded hover:bg-cyan-400"
                          >
                              作成
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}
