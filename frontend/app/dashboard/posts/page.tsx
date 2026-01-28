'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Post = {
    id: string;
    content: string;
    media_url?: string;
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    scheduled_at?: string;
    created_at: string;
};

export default function PostsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostMedia, setNewPostMedia] = useState('');

    useEffect(() => {
        if (isDemoMode) {
            setPosts([
                { id: '1', content: '【春の限定メニュー🌸】\n桜餅風味のラテが新登場！期間限定ですのでお見逃しなく。\n#カフェ #春限定 #桜スイーツ', status: 'PUBLISHED', created_at: new Date().toISOString(), media_url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=300&q=80' },
                { id: '2', content: 'ゴールデンウィークの営業時間のお知らせ📅\nGW期間中は休まず営業いたします。混雑が予想されますのでご予約はお早めに！', status: 'SCHEDULED', scheduled_at: '2025-04-29T09:00:00', created_at: new Date(Date.now() - 86400000).toISOString() },
                { id: '3', content: 'スタッフ募集中！\n私たちと一緒に働きませんか？詳細はWebサイトまで。', status: 'DRAFT', created_at: new Date(Date.now() - 172800000).toISOString() },
            ]);
            setIsLoading(false);
            return;
        }

        if (userInfo?.store_id) {
            fetchPosts();
        } else {
            setIsLoading(false);
        }
    }, [userInfo, isDemoMode]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    store_id: userInfo?.store_id,
                    content: newPostContent,
                    media_url: newPostMedia || undefined,
                    status: 'DRAFT'
                })
            });
            
            if (res.ok) {
                setNewPostContent('');
                setNewPostMedia('');
                setIsCreating(false);
                fetchPosts();
            } else {
                alert('作成に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    const handlePublish = async (postId: string) => {
        if (!confirm('Googleビジネスプロフィールに即時投稿しますか？')) return;
        
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}/publish`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                alert('投稿しました！');
                fetchPosts();
            } else {
                const err = await res.json();
                alert(`投稿失敗: ${err.detail}`);
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    const [mediaList, setMediaList] = useState<any[]>([]);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const handleOpenMediaPicker = async () => {
        setShowMediaPicker(!showMediaPicker);
        if (!showMediaPicker && mediaList.length === 0) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/?store_id=${userInfo?.store_id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` }
                });
                if(res.ok) {
                    setMediaList(await res.json());
                }
            } catch(e) {}
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">投稿管理</h1>
                    <p className="text-slate-400 mt-1">Googleビジネスプロフィールの「最新情報」を管理します</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors"
                >
                    + 新規投稿
                </button>
            </div>

            {isCreating && (
                <div className="glass-card p-6 animate-fade-in relative">
                    <button 
                         onClick={() => setIsCreating(false)}
                         className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                    <h3 className="text-lg font-bold text-white mb-4">新規投稿の作成</h3>
                    
                    {/* AI Generator Toggle/Section */}
                    <div className="mb-6 bg-aurora-purple/10 border border-aurora-purple/30 p-4 rounded-lg">
                        <h4 className="text-sm font-bold text-aurora-purple mb-2 flex items-center gap-2">
                            <span className="text-lg">✨</span> AI投稿生成
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">キーワード (例: ランチ, 新メニュー, 季節限定)</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-900/50 border border-white/10 rounded px-2 py-1.5 text-white text-sm"
                                    id="ai-keywords"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 mb-1">長さ</label>
                                <select id="ai-length" className="w-full bg-slate-900/50 border border-white/10 rounded px-2 py-1.5 text-white text-sm">
                                    <option value="SHORT">短め (100-200文字)</option>
                                    <option value="MEDIUM">標準 (300-500文字)</option>
                                    <option value="LONG">長め (800文字〜)</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            type="button"
                            onClick={async () => {
                                const keywords = (document.getElementById('ai-keywords') as HTMLInputElement).value;
                                const length = (document.getElementById('ai-length') as HTMLSelectElement).value;
                                if(!keywords) return alert("キーワードを入力してください");
                                
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/post`, {
                                        method: 'POST',
                                        headers: { 
                                            'Content-Type': 'application/json', 
                                            Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}` 
                                        },
                                        body: JSON.stringify({ keywords, length_option: length, tone: 'friendly' })
                                    });
                                    if(res.ok) {
                                        const data = await res.json();
                                        setNewPostContent(data.content);
                                    }
                                } catch(e) { console.error(e); alert("生成エラー"); }
                            }}
                            className="w-full bg-aurora-purple text-white font-bold py-1.5 rounded-lg text-sm hover:bg-aurora-purple/80 transition-colors"
                        >
                            AIで文章を生成する
                        </button>
                    </div>

                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">投稿内容</label>
                            <textarea 
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white h-32 focus:border-aurora-cyan focus:outline-none"
                                placeholder="新商品の紹介やイベント情報を入力..."
                                required
                            />
                        </div>
                        
                        {/* Media Selector */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">画像</label>
                            <div className="flex gap-2 mb-2">
                                <input 
                                    type="url"
                                    value={newPostMedia}
                                    onChange={(e) => setNewPostMedia(e.target.value)}
                                    className="flex-1 bg-slate-900/50 border border-white/10 rounded-lg p-2 text-white focus:border-aurora-cyan focus:outline-none"
                                    placeholder="URLを直接入力 または 写真を選択"
                                />
                                <button
                                    type="button"
                                    onClick={handleOpenMediaPicker}
                                    className="bg-slate-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-600"
                                >
                                    📷 写真を選択
                                </button>
                            </div>
                            
                            {showMediaPicker && (
                                <div className="bg-slate-900/50 border border-white/10 rounded-lg p-2 mb-4">
                                    <p className="text-xs text-slate-400 mb-2">過去の写真から選択</p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {mediaList.length === 0 ? (
                                            <span className="text-xs text-slate-500">写真が見つかりません</span>
                                        ) : (
                                            mediaList.map((m: any) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewPostMedia(m.google_url || m.thumbnail_url);
                                                        setShowMediaPicker(false);
                                                    }}
                                                    className="shrink-0 relative w-20 h-20 rounded overflow-hidden border border-transparent hover:border-aurora-cyan transition-all"
                                                >
                                                    <img src={m.thumbnail_url || m.google_url} className="w-full h-full object-cover" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="text-slate-400 hover:text-white px-4 py-2"
                            >
                                キャンセル
                            </button>
                            <button 
                                type="submit"
                                className="bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/50 px-6 py-2 rounded-lg hover:bg-aurora-cyan/30 transition-colors"
                            >
                                下書き保存
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-slate-400 text-center py-8">読み込み中...</div>
                ) : posts.length === 0 ? (
                    <div className="text-slate-500 text-center py-8 glass-card">投稿履歴はありません</div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="glass-card p-6 flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        post.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 
                                        'bg-slate-700 text-slate-300'
                                    }`}>
                                        {post.status === 'PUBLISHED' ? '公開済み' : '下書き'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {format(new Date(post.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                    </span>
                                </div>
                                <p className="text-slate-300 whitespace-pre-wrap">{post.content}</p>
                                {post.media_url && (
                                    <img src={post.media_url} alt="Post media" className="mt-3 h-20 w-auto rounded border border-white/10" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                {post.status !== 'PUBLISHED' && (
                                    <button 
                                        onClick={() => handlePublish(post.id)}
                                        className="bg-green-600/20 text-green-400 border border-green-600/50 px-3 py-1.5 rounded text-sm hover:bg-green-600/30 whitespace-nowrap"
                                    >
                                        Googleに投稿
                                    </button>
                                )}
                                <button className="text-slate-400 hover:text-white text-sm">編集</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
