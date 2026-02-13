'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface RankLog {
  id: string;
  date: string;
  rank: number;
}

interface Keyword {
  id: string;
  text: string;
  location: string | null;
  current_rank: number | null;
}

export default function RankingPage() {
  const { userInfo } = useDashboard();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [history, setHistory] = useState<RankLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeywordText, setNewKeywordText] = useState('');
  const [newKeywordLocation, setNewKeywordLocation] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchKeywords();
  }, [userInfo?.store_id]);

  useEffect(() => {
    if (selectedKeyword) {
      fetchHistory(selectedKeyword.id);
    }
  }, [selectedKeyword]);

  const fetchKeywords = async () => {
    if (!userInfo?.token || !userInfo?.store_id) return;
    try {
      const res = await fetch(`${API_URL}/ranking/keywords`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeywords(data);
        if (data.length > 0 && !selectedKeyword) {
          setSelectedKeyword(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch keywords", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (keywordId: string) => {
    if (!userInfo?.token) return;
    try {
      const res = await fetch(`${API_URL}/ranking/keywords/${keywordId}/history`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo?.token || !newKeywordText) return;

    try {
      const res = await fetch(`${API_URL}/ranking/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ text: newKeywordText, location: newKeywordLocation })
      });

      if (res.ok) {
        await fetchKeywords();
        setShowAddModal(false);
        setNewKeywordText('');
        setNewKeywordLocation('');
      } else {
        alert("キーワードの追加に失敗しました");
      }
    } catch (error) {
      console.error("Error adding keyword", error);
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (!confirm("このキーワードを削除しますか？") || !userInfo?.token) return;
    try {
        const res = await fetch(`${API_URL}/ranking/keywords/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        if(res.ok) {
            setKeywords(prev => prev.filter(k => k.id !== id));
            if(selectedKeyword?.id === id) setSelectedKeyword(null);
        }
    } catch(err) {
        alert("削除に失敗しました");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              順位計測エンジン
            </h1>
            <p className="text-slate-400 mt-2">Googleマップの検索順位を自動計測・可視化します</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            キーワード追加
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Keyword List */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-800 bg-slate-800/50">
              <h2 className="font-semibold text-slate-300">計測キーワード ({keywords.length})</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500">読み込み中...</div>
              ) : keywords.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  キーワードが登録されていません。<br/>右上のボタンから追加してください。
                </div>
              ) : (
                keywords.map(keyword => (
                  <div 
                    key={keyword.id}
                    onClick={() => setSelectedKeyword(keyword)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex justify-between items-center group ${
                      selectedKeyword?.id === keyword.id 
                        ? 'bg-blue-900/30 border border-blue-500/30 text-white' 
                        : 'hover:bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{keyword.text}</div>
                      {keyword.location && <div className="text-xs text-slate-500">{keyword.location}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                         <div className={`text-xl font-bold ${
                            !keyword.current_rank ? 'text-slate-600' :
                            keyword.current_rank <= 3 ? 'text-yellow-400' : 
                            keyword.current_rank <= 10 ? 'text-blue-400' : 'text-slate-400'
                         }`}>
                             {keyword.current_rank ? `${keyword.current_rank}位` : '-'}
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteKeyword(keyword.id); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1"
                         >
                            ×
                         </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Main: Chart */}
          <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col h-[600px]">
            {selectedKeyword ? (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      {selectedKeyword.text}
                      <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded">
                        {selectedKeyword.location || 'エリア指定なし'}
                      </span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">過去30日間の順位推移</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">現在</div>
                    <div className="text-4xl font-bold text-white mb-2">
                        {selectedKeyword.current_rank ? `${selectedKeyword.current_rank}位` : '圏外'}
                    </div>
                    <button
                        onClick={async () => {
                             if(!selectedKeyword || !userInfo?.token) return;
                             try {
                                 // Show loading state (could be improved with local state)
                                 alert("順位を再計測しています...（数秒かかります）");
                                 const res = await fetch(`${API_URL}/ranking/keywords/${selectedKeyword.id}/check`, {
                                     method: 'POST',
                                     headers: { Authorization: `Bearer ${userInfo.token}` }
                                 });
                                 if(res.ok) {
                                     // Refresh data
                                     await fetchKeywords();
                                     await fetchHistory(selectedKeyword.id);
                                     alert("計測完了しました");
                                 } else {
                                     alert("計測に失敗しました");
                                 }
                             } catch(e) {
                                 alert("エラーが発生しました");
                             }
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition-colors"
                    >
                        再計測 (Real)
                    </button>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8" 
                        tickFormatter={(str) => format(new Date(str), 'M/d')}
                        tick={{fontSize: 12}}
                      />
                      <YAxis 
                        reversed 
                        domain={[1, 20]} 
                        stroke="#94a3b8"
                        tick={{fontSize: 12}}
                        label={{ value: '順位', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        labelFormatter={(label) => format(new Date(label), 'yyyy年M月d日')}
                        formatter={(value: number) => [`${value}位`, '順位']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rank" 
                        stroke="#60a5fa" 
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#fff' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    <div>
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p>左側のリストからキーワードを選択してください</p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">キーワードを追加</h3>
            <form onSubmit={handleAddKeyword}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">キーワード (必須)</label>
                  <input 
                    type="text" 
                    required
                    value={newKeywordText}
                    onChange={e => setNewKeywordText(e.target.value)}
                    placeholder="例: 新宿 カフェ"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">計測エリア (任意)</label>
                  <input 
                    type="text"
                    value={newKeywordLocation}
                    onChange={e => setNewKeywordLocation(e.target.value)}
                    placeholder="例: 東京都新宿区"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">※ Google Mapsでの検索基準位置となります</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  追加する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
