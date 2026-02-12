import React, { useState, useEffect } from 'react';

type MediaItem = {
    id: string;
    url: string;
    type: 'PHOTO' | 'VIDEO';
};

interface MediaLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, type: 'PHOTO' | 'VIDEO') => void;
    storeId?: string;
}

export default function MediaLibraryModal({ isOpen, onClose, onSelect, storeId }: MediaLibraryModalProps) {
    const [activeTab, setActiveTab] = useState<'photos' | 'history'>('photos');
    const [mediaList, setMediaList] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && storeId) {
            fetchMedia(activeTab);
        }
    }, [isOpen, activeTab, storeId]);

    const fetchMedia = async (tab: 'photos' | 'history') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
            let endpoint = tab === 'photos'
                ? `${apiUrl}/media/?store_id=${storeId}`
                : `${apiUrl}/posts/?store_id=${storeId}`;

            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                let items: MediaItem[] = [];

                if (tab === 'photos') {
                    items = data.map((d: any) => ({
                        id: d.id,
                        url: d.thumbnail_url || d.google_url,
                        type: d.media_format === 'VIDEO' ? 'VIDEO' : 'PHOTO'
                    }));
                } else {
                    // Post history: filter posts with media
                    items = data
                        .filter((p: any) => p.media_url)
                        .map((p: any) => ({
                            id: p.id,
                            url: p.media_url,
                            type: p.media_type || 'PHOTO' 
                        }));
                }
                
                // Deduplicate by URL
                const unique = Array.from(new Map(items.map(item => [item.url, item])).values());
                setMediaList(unique as MediaItem[]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">メディアライブラリ</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('photos')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
                            activeTab === 'photos'
                                ? 'border-aurora-cyan text-aurora-cyan bg-white/5'
                                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Googleフォト
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
                            activeTab === 'history'
                                ? 'border-aurora-purple text-aurora-purple bg-white/5'
                                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        過去の投稿で使用
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {[...Array(10)].map((_, i) => (
                                <div key={i} className="aspect-square bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : mediaList.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            画像が見つかりません
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {mediaList.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item.url, item.type)}
                                    className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-aurora-cyan transition-all"
                                >
                                    {item.type === 'VIDEO' ? (
                                        <video src={item.url} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={item.url} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="bg-aurora-cyan text-deep-navy font-bold text-xs px-3 py-1 rounded-full">
                                            選択
                                        </span>
                                    </div>
                                    {item.type === 'VIDEO' && (
                                        <div className="absolute top-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white">
                                            VIDEO
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
