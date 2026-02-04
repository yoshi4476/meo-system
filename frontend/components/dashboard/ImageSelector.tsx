import { useState, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

type ImageSelectorProps = {
    onSelect: (url: string) => void;
    onClose: () => void;
};

type MediaItem = {
    id: string;
    google_url?: string;
    thumbnail_url?: string;
    media_url?: string; // For posts
    create_time?: string;
};

export function ImageSelector({ onSelect, onClose }: ImageSelectorProps) {
    const { userInfo, isDemoMode } = useDashboard();
    const [tab, setTab] = useState<'upload' | 'gallery' | 'posts'>('upload');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    useEffect(() => {
        if (tab === 'gallery') fetchGallery();
        if (tab === 'posts') fetchPastPosts();
    }, [tab]);

    const fetchGallery = async () => {
        setIsLoading(true);
        if (isDemoMode) {
            setMediaItems([
                { id: '1', google_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80' },
                { id: '2', google_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80' },
                { id: '3', google_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80' },
            ]);
            setIsLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setMediaItems(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPastPosts = async () => {
        setIsLoading(true);
        if (isDemoMode) {
             setMediaItems([
                { id: 'p1', media_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=500&q=80' },
                { id: 'p2', media_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80' },
            ]);
            setIsLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const posts: any[] = await res.json();
                // Filter posts with media and unique URLs
                const uniqueMedia = new Map();
                posts.forEach(p => {
                    if (p.media_url && !uniqueMedia.has(p.media_url)) {
                        uniqueMedia.set(p.media_url, { id: p.id, media_url: p.media_url });
                    }
                });
                setMediaItems(Array.from(uniqueMedia.values()));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-slate-900 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-white/10 shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">画像を選択</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div className="flex border-b border-white/10">
                    <button 
                        onClick={() => setTab('upload')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'upload' ? 'bg-slate-800 text-aurora-cyan border-b-2 border-aurora-cyan' : 'text-slate-400 hover:text-white'}`}
                    >
                        URL入力 / アップロード
                    </button>
                    <button 
                        onClick={() => setTab('gallery')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'gallery' ? 'bg-slate-800 text-aurora-cyan border-b-2 border-aurora-cyan' : 'text-slate-400 hover:text-white'}`}
                    >
                        ギャラリー (Google Photo)
                    </button>
                    <button 
                        onClick={() => setTab('posts')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'posts' ? 'bg-slate-800 text-aurora-cyan border-b-2 border-aurora-cyan' : 'text-slate-400 hover:text-white'}`}
                    >
                        過去の投稿
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {tab === 'upload' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">画像URL</label>
                                <input 
                                    type="text" 
                                    value={customUrl}
                                    onChange={e => setCustomUrl(e.target.value)}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-aurora-cyan focus:outline-none"
                                />
                            </div>
                            <button 
                                onClick={() => { if(customUrl) onSelect(customUrl); }}
                                disabled={!customUrl}
                                className="w-full bg-aurora-cyan text-deep-navy font-bold py-3 rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                            >
                                この画像を使用
                            </button>
                            <p className="text-xs text-slate-500 text-center mt-4">
                                ※ ファイルアップロード機能は準備中です。現在はURL指定のみ対応しています。
                            </p>
                        </div>
                    )}

                    {(tab === 'gallery' || tab === 'posts') && (
                        <div>
                            {isLoading ? (
                                <div className="text-center py-8 text-slate-400">読み込み中...</div>
                            ) : mediaItems.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">画像が見つかりませんでした</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {mediaItems.map((item) => {
                                        const url = item.google_url || item.thumbnail_url || item.media_url;
                                        if (!url) return null;
                                        return (
                                            <button 
                                                key={item.id}
                                                onClick={() => onSelect(url)}
                                                className="aspect-square relative rounded-lg overflow-hidden group border border-white/5 hover:border-aurora-cyan transition-colors"
                                            >
                                                <img src={url} alt="Media" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">選択</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
