'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

type Keyword = {
    id: string;
    text: string;
    location: string;
    current_rank: number | null;
    prev_rank: number | null;
};

export default function RankTrackerPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [newLocation, setNewLocation] = useState('東京都渋谷区');
    const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const fetchKeywords = async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranks/?store_id=${userInfo?.store_id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
        });
        if(res.ok) {
            setKeywords(await res.json());
        }
    };

    // Fetch keywords
    useEffect(() => {
        if (isDemoMode) {
            setKeywords([
                { id: '1', text: '渋谷 カフェ', location: '東京都渋谷区', current_rank: 3, prev_rank: 5 },
                { id: '2', text: '渋谷 ランチ', location: '東京都渋谷区', current_rank: 8, prev_rank: 7 },
                { id: '3', text: '渋谷 スイーツ', location: '東京都渋谷区', current_rank: 1, prev_rank: 1 },
                { id: '4', text: '表参道 カフェ', location: '東京都港区', current_rank: 12, prev_rank: 15 },
            ]);
            return;
        }
        if(userInfo?.store_id) fetchKeywords();
    }, [userInfo, isDemoMode]);

    const fetchHistory = async (id: string) => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranks/history/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
        });
        if(res.ok) {
            const data = await res.json();
            // Transform for chart
            const formated = data.map((d: any) => ({
                date: format(new Date(d.check_date), 'MM/dd'),
                rank: d.rank === 0 ? 21 : d.rank // 0 means unranked, map to 21 for chart
            }));
            setHistory(formated);
        }
    };

    // Fetch history when keyword selected
    useEffect(() => {
        if(selectedKeywordId) {
            if (isDemoMode) {
                // Generate dummy history
                const dummyHistory = Array.from({ length: 14 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (13 - i));
                    // Random rank roughly around current rank (3) but varying
                    const baseRank = 3;
                    const noise = Math.floor(Math.random() * 5) - 2; 
                    let rank = baseRank + noise;
                    if (rank < 1) rank = 1;
                    return {
                        date: format(d, 'MM/dd'),
                        rank: rank
                    };
                });
                setHistory(dummyHistory);
            } else {
                fetchHistory(selectedKeywordId);
            }
        }
    }, [selectedKeywordId, isDemoMode]);

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if(isDemoMode) {
            const mockId = `demo-${Date.now()}`;
            setKeywords([...keywords, { 
                id: mockId, 
                text: newKeyword, 
                location: newLocation, 
                current_rank: null, 
                prev_rank: null 
            }]);
            setNewKeyword('');
            alert('デモモード: キーワードを追加しました');
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranks/?store_id=${userInfo?.store_id}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` 
                },
                body: JSON.stringify({ text: newKeyword, location: newLocation })
            });
            if(res.ok) {
                setNewKeyword('');
                fetchKeywords();
            }
        } catch(e) { alert("Error adding keyword"); }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("削除しますか？")) return;
        
        if (isDemoMode) {
            setKeywords(keywords.filter(k => k.id !== id));
            if (selectedKeywordId === id) setSelectedKeywordId(null);
            alert('デモモード: キーワードを削除しました');
            return;
        }

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranks/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
        });
        fetchKeywords();
    };

    const handleCheckNow = async () => {
        if (isDemoMode) {
            setIsLoading(true); // Assuming there's a loading state, if not, just wait
            // Simulate 'checking'
            await new Promise(r => setTimeout(r, 2000));
            // Update ranks strictly for demo visual effect
            setKeywords(keywords.map(k => ({
                ...k,
                prev_rank: k.current_rank,
                current_rank: k.current_rank ? Math.max(1, k.current_rank + (Math.random() > 0.5 ? -1 : 1)) : Math.floor(Math.random() * 20) + 1
            })));
            setIsLoading(false);
            alert("デモモード: 順位チェックが完了しました！");
            return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ranks/check/${userInfo?.store_id}`, {
            method: 'POST',
             headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
        });
        if(res.ok) {
            alert("順位チェックを開始しました");
            fetchKeywords();
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">順位計測 (Rank Tracker)</h1>
                    <p className="text-slate-400 mt-1">ターゲットキーワードのMEO順位を自動追跡します</p>
                </div>
                <button 
                    onClick={handleCheckNow}
                    className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400"
                >
                    🔄 今すぐチェック
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Keyword List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-4">
                        <h3 className="font-bold text-white mb-4">キーワード一覧</h3>
                        <form onSubmit={handleAddKeyword} className="mb-4 space-y-2">
                            <input 
                                type="text" 
                                placeholder="キーワード (例: 渋谷 カフェ)" 
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                                required
                            />
                            <input 
                                type="text" 
                                placeholder="計測地点 (例: 東京都渋谷区)" 
                                value={newLocation}
                                onChange={(e) => setNewLocation(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-2 text-white text-sm"
                            />
                            <button type="submit" className="w-full bg-slate-700 text-white py-1.5 rounded text-sm hover:bg-slate-600">
                                + 追加
                            </button>
                        </form>
                        
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {keywords.map(k => (
                                <div 
                                    key={k.id} 
                                    onClick={() => setSelectedKeywordId(k.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedKeywordId === k.id ? 'bg-aurora-purple/20 border-aurora-purple' : 'bg-slate-800/50 border-transparent hover:bg-slate-800'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-white text-sm">{k.text}</div>
                                            <div className="text-xs text-slate-500">{k.location}</div>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(k.id); }} className="text-slate-500 hover:text-red-400">×</button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-white">{k.current_rank ? `${k.current_rank}位` : '-'}</span>
                                            {k.prev_rank && k.current_rank && (
                                                <span className={`text-xs ${k.current_rank < k.prev_rank ? 'text-green-400' : k.current_rank > k.prev_rank ? 'text-red-400' : 'text-slate-500'}`}>
                                                    {k.current_rank < k.prev_rank ? '▲' : k.current_rank > k.prev_rank ? '▼' : '−'}
                                                    {Math.abs(k.prev_rank - k.current_rank)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="lg:col-span-2">
                    <div className="glass-card p-6 h-[500px]">
                        {selectedKeywordId ? (
                            <>
                                <h3 className="font-bold text-white mb-4">順位推移グラフ</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <LineChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="date" stroke="#94a3b8" />
                                        <YAxis reversed domain={[1, 21]} stroke="#94a3b8" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                                        />
                                        <Line type="monotone" dataKey="rank" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                左のリストからキーワードを選択してください
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
