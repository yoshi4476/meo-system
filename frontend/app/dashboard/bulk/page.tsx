'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type Store = {
    id: string;
    name: string;
};

export default function BulkPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
    const [postContent, setPostContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const fetchStores = async () => {
        // Fetch all stores available to user (Company Admin or Super Admin)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
            });
            if(res.ok) {
                const data = await res.json();
                setStores(data);
            }
        } catch(e) {}
    };

    useEffect(() => {
        if (isDemoMode) {
            setStores([
                { id: '1', name: '渋谷店 (Demo)' },
                { id: '2', name: '新宿店 (Demo)' },
                { id: '3', name: '池袋店 (Demo)' },
                { id: '4', name: '横浜店 (Demo)' },
            ]);
        } else {
            fetchStores();
        }
    }, [isDemoMode]);

    const toggleStore = (id: string) => {
        const next = new Set(selectedStores);
        if(next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedStores(next);
    };

    const handleSelectAll = () => {
        if(selectedStores.size === stores.length) setSelectedStores(new Set());
        else setSelectedStores(new Set(stores.map(s => s.id)));
    };

    const handleBulkPost = async () => {
        if(selectedStores.size === 0) return alert("店舗を選択してください");
        if(!postContent) return alert("投稿内容を入力してください");

        if(!confirm(`${selectedStores.size}店舗に一括投稿しますか？`)) return;

        setIsSending(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bulk/posts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` 
                },
                body: JSON.stringify({
                    store_ids: Array.from(selectedStores),
                    content: postContent
                })
            });
            if(res.ok) {
                alert("一括投稿を開始しました！");
                setPostContent('');
                setSelectedStores(new Set());
            } else {
                alert("送信に失敗しました");
            }
        } catch(e) {
            alert("エラーが発生しました");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">一括管理 (Bulk Tools)</h1>
                    <p className="text-slate-400 mt-1">複数店舗への一括投稿・管理を行います</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Store Selector */}
                <div className="glass-card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white">対象店舗を選択 ({selectedStores.size}/{stores.length})</h3>
                        <button 
                            onClick={handleSelectAll}
                            className="text-xs text-aurora-cyan hover:underline"
                        >
                            {selectedStores.size === stores.length ? '全解除' : '全選択'}
                        </button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {stores.map(store => (
                            <label key={store.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedStores.has(store.id)}
                                    onChange={() => toggleStore(store.id)}
                                    className="w-5 h-5 rounded border-slate-600 text-aurora-cyan focus:ring-0 focus:ring-offset-0 bg-slate-700"
                                />
                                <span className="text-white text-sm">{store.name}</span>
                            </label>
                        ))}
                        {stores.length === 0 && <div className="text-slate-500 text-center py-4">店舗が見つかりません</div>}
                    </div>
                </div>

                {/* Action Area */}
                <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-4">一括投稿の作成</h3>
                    <textarea 
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-aurora-cyan focus:outline-none mb-4"
                        placeholder="全店舗共通のお知らせを入力してください..."
                    />
                    <div className="flex justify-end">
                        <button 
                            onClick={handleBulkPost}
                            disabled={isSending || selectedStores.size === 0}
                            className="bg-aurora-purple text-white font-bold px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSending ? '送信中...' : '🚀 一括投稿を実行'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">※ バックグラウンドで順次処理されます</p>
                </div>
            </div>
        </div>
    );
}
