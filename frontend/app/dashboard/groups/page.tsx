'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

interface StoreGroup {
  id: string;
  name: string;
  description: string;
  company_id: string;
}

export default function StoreGroupsPage() {
  const { userInfo } = useDashboard();
  const [groups, setGroups] = useState<StoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const fetchGroups = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const token = localStorage.getItem('meo_auth_token');
      if (!token) return;

      const res = await fetch(`${apiUrl}/groups/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
          const data = await res.json();
          setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async () => {
      if (!newGroupName) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const token = localStorage.getItem('meo_auth_token');
        
        const res = await fetch(`${apiUrl}/groups/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: newGroupName,
                description: newGroupDesc
            })
        });

        if (res.ok) {
            setShowModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
            fetchGroups();
        } else {
            alert('作成に失敗しました');
        }
      } catch (e) {
          alert('エラーが発生しました');
      }
  };

  if (loading) return <div className="p-8 text-white">読み込み中...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">店舗グループ管理</h1>
          <p className="text-slate-400">複数の店舗をエリアやブランドごとにグループ化して管理します。</p>
        </div>
        <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規グループ作成
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
            <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <button className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{group.name}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {group.description || '説明なし'}
                </p>
                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                    <span className="text-xs text-slate-500">店舗数:</span>
                    <span className="text-sm font-bold text-white">- 店舗</span>
                </div>
            </div>
        ))}
        
        {groups.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-xl">
                <p className="text-slate-500">まだグループがありません</p>
            </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">新規グループ作成</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">グループ名</label>
                          <input 
                              type="text" 
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none"
                              placeholder="例: 東京エリア"
                          />
                      </div>
                      <div>
                          <label className="block text-sm text-slate-400 mb-1">説明</label>
                          <textarea 
                              value={newGroupDesc}
                              onChange={(e) => setNewGroupDesc(e.target.value)}
                              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-cyan-500 outline-none h-24 resize-none"
                              placeholder="グループの説明を入力..."
                          />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                      <button 
                          onClick={() => setShowModal(false)}
                          className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                      >
                          キャンセル
                      </button>
                      <button 
                          onClick={handleCreateGroup}
                          className="px-6 py-2 bg-linear-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                      >
                          作成
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
