'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type User = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  store_id?: string;
};

export default function AdminUsersPage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (isDemoMode) {
          setUsers([
              { id: 'u1', email: 'admin@example.com', role: 'SUPER_ADMIN', is_active: true },
              { id: 'u2', email: 'store1@example.com', role: 'STORE_USER', is_active: true, store_id: 's1' },
              { id: 'u3', email: 'store2@example.com', role: 'STORE_USER', is_active: false, store_id: 's2' },
          ]);
          setIsLoading(false);
          return;
      }

      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        
        const response = await fetch(`${apiUrl}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          const err = await response.text();
          setError(`Error ${response.status}: ${err}`);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (isDemoMode || userInfo?.role === 'SUPER_ADMIN') {
      fetchUsers();
    } else if (userInfo) {
       setIsLoading(false);
       setError("権限がありません (Super Admin required)");
    }
  }, [userInfo, isDemoMode]);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-white">ユーザー管理</h1>
           <p className="text-slate-400 mt-1">システムに登録されている全ユーザーのアカウント情報</p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded text-slate-300">
           合計: <span className="text-white font-bold ml-1">{users.length}</span> ユーザー
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-800/50 text-slate-400 border-b border-white/5">
                    <th className="p-4 font-medium">メールアドレス / ID</th>
                    <th className="p-4 font-medium">権限ロール</th>
                    <th className="p-4 font-medium">担当店舗ID</th>
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
                ) : users.map((user) => (
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
                        <td className="p-4 text-sm text-slate-500 font-mono">
                            {user.store_id || '未割当'}
                        </td>
                        <td className="p-4">
                             {user.is_active ? 
                                <span className="text-green-400 text-xs flex items-center gap-1">● 有効</span> : 
                                <span className="text-slate-500 text-xs flex items-center gap-1">● 無効</span>
                             }
                        </td>
                        <td className="p-4">
                            <button className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors">
                                編集
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
