'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type Company = {
  id: string;
  name: string;
  plan: string;
};

export default function AdminCompaniesPage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      if (isDemoMode) {
          setCompanies([
              { id: 'c1', name: '株式会社サンプル（デモ）', plan: 'STANDARD' },
              { id: 'c2', name: '合同会社テスト（デモ）', plan: 'BASIC' },
          ]);
          setIsLoading(false);
          return;
      }

      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        
        const response = await fetch(`${apiUrl}/admin/companies`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCompanies(data);
        } else {
          const err = await response.text();
          // 403 or 404 might mean not super admin
          if (response.status === 403) {
             setError("権限がありません (Super Admin required)");
          } else {
             setError(`Error ${response.status}: ${err}`);
          }
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userInfo?.role === 'SUPER_ADMIN' || isDemoMode) {
        fetchCompanies();
    } else {
        setIsLoading(false);
        setError("権限がありません (Super Admin required)");
    }
  }, [userInfo, isDemoMode]);

  const handleCreateCompany = () => {
      const name = prompt("会社名を入力してください:");
      if (!name) return;
      const plan = prompt("プランを入力してください (BASIC / STANDARD / PREMIUM):", "BASIC");
      if (!plan) return;
      
      const token = localStorage.getItem('meo_auth_token');
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/admin/companies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ name, plan })
      }).then(async res => {
          if(res.ok) window.location.reload();
          else {
              const err = await res.json();
              alert("作成失敗: " + err.detail);
          }
      });
  };

  const handleDeleteCompany = async (id: string) => {
      if(!confirm("本当に削除しますか？紐づくすべてのデータが影響を受ける可能性があります。")) return;

      const token = localStorage.getItem('meo_auth_token');
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/admin/companies/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              setCompanies(companies.filter(c => c.id !== id));
          } else {
              alert("削除失敗");
          }
      } catch(e) { console.error(e); alert("エラーが発生しました"); }
  };

  if (isLoading) return <div className="p-8 text-slate-400">読み込み中...</div>;

  if (error) {
     return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-4">企業管理</h1>
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
           <h1 className="text-3xl font-bold text-white">企業管理</h1>
           <p className="text-slate-400 mt-1">クライアント企業（契約者）の管理</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={handleCreateCompany}
                className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors"
            >
                + 企業を追加
            </button>
            <div className="bg-slate-800 px-4 py-2 rounded text-slate-300 flex items-center">
               合計: <span className="text-white font-bold ml-1">{companies.length}</span> 社
            </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-white/5">
                    <th className="p-4 font-medium">会社名 / ID</th>
                    <th className="p-4 font-medium">プラン</th>
                    <th className="p-4 font-medium">アクション</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
                {companies.length === 0 ? (
                    <tr>
                        <td colSpan={3} className="p-8 text-center text-slate-500">
                            企業が見つかりません
                        </td>
                    </tr>
                ) : companies.map((company) => (
                    <tr key={company.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                            <div className="font-bold text-white">{company.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{company.id}</div>
                        </td>
                        <td className="p-4">
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-bold">
                                {company.plan}
                            </span>
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => handleDeleteCompany(company.id)}
                                className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1 rounded transition-colors"
                            >
                                削除
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
