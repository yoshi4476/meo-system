'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type User = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  store_id?: string;
  company_id?: string;
};

type Company = {
    id: string;
    name: string;
};

type Store = {
    id: string;
    name: string;
    company_id?: string;
};

export default function AdminUsersPage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STORE_USER');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (isDemoMode) {
          setUsers([
              { id: 'u1', email: 'admin@example.com', role: 'SUPER_ADMIN', is_active: true },
              { id: 'u2', email: 'company1@example.com', role: 'COMPANY_ADMIN', is_active: true, company_id: 'c1' },
              { id: 'u3', email: 'store1@example.com', role: 'STORE_USER', is_active: true, store_id: 's1', company_id: 'c1' },
          ]);
          setCompanies([
              { id: 'c1', name: '株式会社サンプル（デモ）' },
              { id: 'c2', name: '合同会社テスト（デモ）' }
          ]);
          setStores([
              { id: 's1', name: 'MEO Cafe 渋谷店 (Demo)', company_id: 'c1' },
              { id: 's2', name: 'MEO Cafe 新宿店 (Demo)', company_id: 'c1' },
              { id: 's3', name: 'MEO Cafe 池袋店 (Demo)', company_id: 'c2' }
          ]);
          setIsLoading(false);
          return;
      }

      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // 1. Fetch Users
        const usersRes = await fetch(`${apiUrl}/admin/users`, { headers });
        if (usersRes.ok) {
           setUsers(await usersRes.json());
        } else {
           throw new Error(`Users fetch failed: ${usersRes.status}`);
        }

        // 2. Fetch Companies (only if Super Admin)
        if (userInfo?.role === 'SUPER_ADMIN') {
            const compRes = await fetch(`${apiUrl}/admin/companies`, { headers });
            if (compRes.ok) setCompanies(await compRes.json());
        }

        // 3. Fetch Stores (Super Admin gets all, Company Admin gets theirs via normal endpoint or specific one)
        // Note: /admin/stores returns all for Super Admin, and company stores for Company Admin
        const storesRes = await fetch(`${apiUrl}/admin/stores`, { headers });
        if (storesRes.ok) {
            setStores(await storesRes.json());
        }

      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (userInfo?.role === 'SUPER_ADMIN' || userInfo?.role === 'COMPANY_ADMIN' || isDemoMode) {
        fetchData();
    } else if (userInfo) {
       setIsLoading(false);
       setError("権限がいません (Super Admin or Company Admin required)");
    }
  }, [userInfo, isDemoMode]);

  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const token = localStorage.getItem('meo_auth_token');
      const payload: any = {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole
      };

      if (process.env.NEXT_PUBLIC_API_URL?.includes('localhost') && isDemoMode) {
          alert("デモモードでは作成できません");
          return;
      }

      // Logic for Company/Store assignment
      if (userInfo?.role === 'SUPER_ADMIN') {
          if (newUserRole === 'COMPANY_ADMIN') {
              payload.company_id = selectedCompanyId;
          } else if (newUserRole === 'STORE_USER') {
              payload.company_id = selectedCompanyId; // Optional but good for hierarchy
              payload.store_id = selectedStoreId;
          }
      } else if (userInfo?.role === 'COMPANY_ADMIN') {
          // Company Admin can only create Store Users for their company
          payload.role = 'STORE_USER';
          payload.company_id = userInfo.company_id;
          payload.store_id = selectedStoreId;
      }

      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/admin/users`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              window.location.reload();
          } else {
              const err = await res.json();
              alert("作成失敗: " + (err.detail || JSON.stringify(err)));
          }
      } catch (e) {
          console.error(e);
          alert("エラーが発生しました");
      }
  };

  const handleEditRole = (user: User) => {
      const newRole = prompt("新しい権限ロールを入力してください (SUPER_ADMIN / COMPANY_ADMIN / STORE_USER):", user.role);
      if (!newRole || newRole === user.role) return;

      const token = localStorage.getItem('meo_auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

      fetch(`${apiUrl}/admin/users/${user.id}/role?role=${newRole}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
      }).then(async res => {
          if (res.ok) {
              alert("権限を更新しました");
              window.location.reload();
          } else {
              const err = await res.json();
              alert("更新失敗: " + (err.detail || "Unknown error"));
          }
      }).catch(e => alert("Error: " + e));
  };

  if (isLoading) return <div className="p-8 text-slate-400">読み込み中...</div>;

  if (error) {
     return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-white mb-4">ユーザー管理</h1>
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded text-red-400">
               {error}
            </div>
        </div>
     );
  }

  // Filter stores based on selected company (for Super Admin UI)
  const filteredStores = userInfo?.role === 'SUPER_ADMIN' && selectedCompanyId 
      ? stores.filter(s => s.company_id === selectedCompanyId)
      : stores; // If Company Admin, 'stores' is already filtered by backend, or we can filter again by userInfo.company_id just in case

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
           <p className="text-slate-400 mt-1">システムに登録されている全ユーザーのアカウント情報</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors"
            >
                + ユーザーを追加
            </button>
            <div className="bg-slate-800 px-4 py-2 rounded text-slate-300 flex items-center">
               合計: <span className="text-white font-bold ml-1">{users.length}</span> ユーザー
            </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-white/5">
                    <th className="p-4 font-medium">メールアドレス / ID</th>
                    <th className="p-4 font-medium">権限ロール</th>
                    <th className="p-4 font-medium">所属</th>
                    <th className="p-4 font-medium">ステータス</th>
                    <th className="p-4 font-medium">アクション</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
                {users.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                            ユーザーが見つかりません
                        </td>
                    </tr>
                ) : users.map((user) => {
                    const company = companies.find(c => c.id === user.company_id);
                    const store = stores.find(s => s.id === user.store_id);
                    return (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                            <div className="font-bold text-white">{user.email}</div>
                            <div className="text-xs text-slate-500 font-mono mt-1">{user.id}</div>
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                user.role === 'SUPER_ADMIN' ? 'bg-red-500/20 text-red-400' : 
                                user.role === 'COMPANY_ADMIN' ? 'bg-purple-500/20 text-purple-400' : 
                                'bg-slate-700 text-slate-300'
                            }`}>
                                {user.role}
                            </span>
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                            {user.role === 'COMPANY_ADMIN' && company && (
                                <div className="text-purple-300">🏢 {company.name}</div>
                            )}
                            {user.role === 'STORE_USER' && store && (
                                <div className="text-green-300">🏪 {store.name}</div>
                            )}
                            {user.role === 'STORE_USER' && !store && <span className="text-slate-600">未割当</span>}
                        </td>
                        <td className="p-4">
                             {user.is_active ? 
                                <span className="text-green-400 text-xs flex items-center gap-1">● 有効</span> : 
                                <span className="text-slate-500 text-xs flex items-center gap-1">● 無効</span>
                             }
                        </td>
                        <td className="p-4">
                            <button 
                                onClick={() => handleEditRole(user)}
                                className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">
                                編集
                            </button>
                        </td>
                    </tr>
                )})}
            </tbody>
        </table>
      </div>

        {/* Create User Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-4">新規ユーザー作成</h2>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">メールアドレス</label>
                            <input 
                                type="email" 
                                required
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-400 mb-1">パスワード</label>
                            <input 
                                type="password" 
                                required
                                value={newUserPassword}
                                onChange={e => setNewUserPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                            />
                        </div>

                        {/* Role Selection (Only for Super Admin) */}
                        {userInfo?.role === 'SUPER_ADMIN' && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">権限ロール</label>
                                <select 
                                    value={newUserRole}
                                    onChange={e => setNewUserRole(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                                >
                                    <option value="STORE_USER">店長 (STORE_USER)</option>
                                    <option value="COMPANY_ADMIN">企業管理者 (COMPANY_ADMIN)</option>
                                </select>
                            </div>
                        )}

                        {/* Company Selection (If creating Company Admin or Store User as Super Admin) */}
                        {userInfo?.role === 'SUPER_ADMIN' && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">所属企業</label>
                                <select 
                                    value={selectedCompanyId}
                                    onChange={e => setSelectedCompanyId(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                                    required={newUserRole === 'COMPANY_ADMIN'}
                                >
                                    <option value="">未選択</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Store Selection (If creating Store User) */}
                        {(newUserRole === 'STORE_USER') && (
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">担当店舗</label>
                                <select 
                                    value={selectedStoreId}
                                    onChange={e => setSelectedStoreId(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded px-3 py-2 text-white"
                                >
                                    <option value="">未選択</option>
                                    {filteredStores.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
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
