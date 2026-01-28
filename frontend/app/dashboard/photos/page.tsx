'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type MediaItem = {
  id: string;
  google_media_id: string;
  media_format: string;
  location_association: string;
  google_url: string;
  thumbnail_url: string;
  description: string;
  views: number;
  create_time: string;
};

export default function PhotosPage() {
  const { userInfo, isDemoMode } = useDashboard();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Default to first store or handle selection
    // Note: In a real app we need a store selector. For now assume userInfo.store.id or similar
    // Since UserInfo type in DashboardContext might not have store details fully populated, 
    // we should rely on what's available or fetch stores.
    // For this dashboard, let's assume one main store.
    const storeId = userInfo?.store?.id || (userInfo?.store_id) || null;

  useEffect(() => {
    if (storeId) {
      fetchMedia();
    }
  }, [storeId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);

      if (isDemoMode) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const demoImages = [
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60',
              'https://images.unsplash.com/photo-1507133750069-419571604855?w=500&auto=format&fit=crop&q=60'
          ];
          setMediaItems(demoImages.map((url, i) => ({
              id: `demo-${i}`,
              google_media_id: `g-${i}`,
              media_format: 'PHOTO',
              location_association: 'FOOD_AND_MENU',
              google_url: url,
              thumbnail_url: url,
              description: 'Demo Photo',
              views: Math.floor(Math.random() * 1000) + 100,
              create_time: new Date().toISOString()
          })));
          setLoading(false);
          return;
      }

      const token = localStorage.getItem('meo_auth_token');
      if (!token || !storeId) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/?store_id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (isDemoMode) {
        setSyncing(true);
        await new Promise(r => setTimeout(r, 1500));
        setSyncing(false);
        alert('デモモード: 写真を同期しました');
        fetchMedia(); // Reload demo data
        return;
    }

    if (!storeId) return;
    try {
      setSyncing(true);
      const token = localStorage.getItem('meo_auth_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/sync/${storeId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`同期完了: ${data.message}`);
        fetchMedia();
      } else {
        const err = await res.json();
        alert(`同期エラー: ${err.detail}`);
      }
    } catch (e) {
      alert(`エラー: ${e}`);
    } finally {
      setSyncing(false);
    }
  };

  if (!storeId) {
      return <div className="p-8 text-slate-400">店舗情報が見つかりません。設定画面でGoogle連携を確認してください。</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">写真管理</h1>
          <p className="text-slate-400 mt-1">Googleビジネスプロフィールの写真を管理・分析します</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleSync}
                disabled={syncing}
                className={`px-4 py-2 rounded-lg font-bold transition-all ${syncing ? 'bg-slate-700 text-slate-500' : 'bg-aurora-purple text-white hover:bg-aurora-purple/80'}`}
            >
                {syncing ? 'Googleと同期中...' : 'Googleと同期'}
            </button>
            <button 
                onClick={() => {
                    if (isDemoMode) {
                        alert('デモモード: 写真アップロード機能 (モック)');
                        return;
                    }
                    alert('実装予定機能です');
                }}
                className="px-4 py-2 rounded-lg bg-aurora-cyan text-white font-bold hover:bg-aurora-cyan/80"
            >
                + 写真をアップロード
            </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">読み込み中...</div>
      ) : mediaItems.length === 0 ? (
        <div className="glass-card p-10 text-center text-slate-400">
            <p className="text-xl mb-4">写真がまだありません</p>
            <p className="text-sm">「Googleと同期」ボタンを押して、Googleビジネスプロフィールの写真を取り込んでください。</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mediaItems.map((item) => (
            <div key={item.id} className="glass-card overflow-hidden group hover:border-aurora-cyan/50 transition-colors">
              <div className="aspect-square relative bg-slate-800">
                <img 
                    src={item.thumbnail_url || item.google_url} 
                    alt={item.description || 'Photo'} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white" title="詳細">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40 text-red-400" title="削除">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                    {item.media_format === 'VIDEO' ? '🎥 VIDEO' : '📷 PHOTO'}
                </div>
              </div>
              <div className="p-3">
                <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>{item.location_association || 'その他'}</span>
                    <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {item.views.toLocaleString()}
                    </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                    {new Date(item.create_time).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
