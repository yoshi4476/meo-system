'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

// 過去にアップロードした画像のモックデータ (Demo Mode / Fallback)
const demoImages = [
  { id: 1, name: 'ランチプレート.jpg', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80', date: '2026-01-15' },
  { id: 2, name: '店内写真.jpg', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80', date: '2026-01-10' },
  { id: 3, name: '外観.jpg', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80', date: '2026-01-05' },
  { id: 4, name: 'スタッフ.jpg', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=500&q=80', date: '2025-12-20' },
  { id: 5, name: 'ディナーコース.jpg', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80', date: '2025-12-15' },
];

function PostsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { userInfo, isDemoMode } = useDashboard();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            router.push('/dashboard/posts/create');
        }
    }, [searchParams, router]);


    const fetchPosts = async () => {
        setIsLoading(true);
        if (isDemoMode) {
             setPosts([
                 { id: '1', content: '【3月の限定メニュー🌸】\n桜と抹茶のモンブランが新登場！\n春の訪れを感じる一品をぜひお楽しみください。\n#カフェ #春スイーツ #抹茶', status: 'PUBLISHED', created_at: new Date().toISOString(), media_url: demoImages[0].url },
                 { id: '2', content: 'GW期間中の営業時間について📅\n4/29〜5/5は休まず営業いたします。\n通常通り9:00〜20:00でお待ちしております。', status: 'SCHEDULED', scheduled_at: '2025-04-20T09:00:00', created_at: new Date(Date.now() - 86400000).toISOString() },
                 { id: '3', content: '【スタッフ募集中】\n私たちと一緒に働きませんか？\n未経験者大歓迎！詳細はプロフィールのリンクから。', status: 'PUBLISHED', created_at: new Date(Date.now() - 259200000).toISOString(), media_url: demoImages[3].url },
                 { id: '4', content: '夏の新作ドリンク試作中...🍹\nお楽しみに！', status: 'DRAFT', created_at: new Date(Date.now() - 604800000).toISOString() },
                 { id: '5', content: '雨の日限定クーポン☔\n「インスタ見た」でトッピング無料！\n足元にお気をつけてお越しください。', status: 'PUBLISHED', created_at: new Date(Date.now() - 1209600000).toISOString(), media_url: demoImages[2].url },
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
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [userInfo, isDemoMode]);


    const handleEdit = (post: Post) => {
        router.push(`/dashboard/posts/create?edit=${post.id}`);
    };

    const handleDuplicate = (post: Post) => {
        // Future: Support duplication. For now, just go to create.
        router.push(`/dashboard/posts/create`);
    };

    const handleDelete = async (postId: string) => {
        if (!confirm('本当に削除しますか？')) return;
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(posts.filter(p => p.id !== postId));
                alert('削除しました');
            } else {
                alert('削除に失敗しました');
            }
        } catch(e) { console.error(e); alert('エラーが発生しました'); }
    };

    return (
        <div className="space-y-6">
            {/* リスト表示モード */}
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white">投稿管理</h1>
                        <p className="text-slate-400 mt-1">AIを活用して魅力的な記事を作成・管理します</p>
                    </div>
                    <button 
                        onClick={() => {
                            router.push('/dashboard/posts/create');
                        }}
                        className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        + 新規投稿を作成
                    </button>
                </div>

                <div className="grid gap-4">
                    {isLoading ? (
                        <div className="text-slate-400 text-center py-8">読み込み中...</div>
                    ) : posts.length === 0 ? (
                        <div className="text-slate-500 text-center py-8 glass-card">投稿履歴はありません</div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-colors">
                                <div className="w-full md:w-48 h-32 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                    {post.media_url ? (
                                        <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            post.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 
                                            post.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-slate-700 text-slate-300'
                                        }`}>
                                            {post.status === 'PUBLISHED' ? '公開済み' : post.status === 'SCHEDULED' ? '予約済み' : '下書き'}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            作成: {format(new Date(post.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                        </span>
                                        {post.scheduled_at && (
                                            <span className="text-xs text-blue-400 flex items-center gap-1">
                                                📅 予約: {(() => {
                                                    if (!post.scheduled_at) return '';
                                                    try {
                                                        // Force treat as UTC if no timezone indicator is present
                                                        let dateStr = post.scheduled_at.replace(/ /g, 'T');
                                                        if (!/Z|[\+\-]\d{2}:?\d{2}$/.test(dateStr)) {
                                                            dateStr += 'Z';
                                                        }
                                                        // Check if it's already Z (UTC)
                                                        const date = new Date(dateStr);
                                                        return format(date, 'yyyy/MM/dd HH:mm', { locale: ja });
                                                    } catch (e) {
                                                        return post.scheduled_at;
                                                    }
                                                })()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-200 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(post)} className="text-sm text-slate-400 hover:text-white">編集</button>
                                        <button onClick={() => handleDuplicate(post)} className="text-sm text-slate-400 hover:text-white">複製</button>
                                        <button onClick={() => handleDelete(post.id)} className="text-sm text-red-400 hover:text-red-300">削除</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PostsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PostsContent />
        </Suspense>
    );
}
