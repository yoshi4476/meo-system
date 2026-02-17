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
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
    scheduled_at?: string;
    created_at: string;
    social_post_ids?: any;
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
    const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'PUBLISHED' | 'DRAFT'>('ALL');

    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            router.push('/dashboard/posts/create');
        }
    }, [searchParams, router]);


    const fetchPosts = async () => {
        setIsLoading(true);
        if (isDemoMode) {
             setPosts([
                 { id: '1', content: '【3月の限定メニュー🌸】\n桜と抹茶のモンブランが新登場！\n春の訪れを感じる一品をぜひお楽しみください。\n#カフェ #春スイーツ #抹茶', status: 'PUBLISHED', created_at: new Date().toISOString(), media_url: demoImages[0].url, social_post_ids: { google: { searchUrl: 'https://google.com' } } },
                 { id: '2', content: 'GW期間中の営業時間について📅\n4/29〜5/5は休まず営業いたします。\n通常通り9:00〜20:00でお待ちしております。', status: 'SCHEDULED', scheduled_at: '2025-04-20T09:00:00', created_at: new Date(Date.now() - 86400000).toISOString() },
                 { id: '3', content: '【スタッフ募集中】\n私たちと一緒に働きませんか？\n未経験者大歓迎！詳細はプロフィールのリンクから。', status: 'PUBLISHED', created_at: new Date(Date.now() - 259200000).toISOString(), media_url: demoImages[3].url },
                 { id: '4', content: '夏の新作ドリンク試作中...🍹\nお楽しみに！', status: 'DRAFT', created_at: new Date(Date.now() - 604800000).toISOString() },
                 { id: '5', content: '雨の日限定クーポン☔\n「インスタ見た」でトッピング無料！\n足元にお気をつけてお越しください。', status: 'PUBLISHED', created_at: new Date(Date.now() - 1209600000).toISOString(), media_url: demoImages[2].url },
                 { id: '6', content: '投稿失敗のテストケース', status: 'FAILED' as any, created_at: new Date().toISOString() },
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
                const data = await res.json();
                // Ensure social_post_ids is parsed if string
                const parsedData = data.map((p: any) => ({
                    ...p,
                    social_post_ids: typeof p.social_post_ids === 'string' ? JSON.parse(p.social_post_ids) : p.social_post_ids
                }));
                setPosts(parsedData);
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

    // Filtering Logic
    const filteredPosts = posts.filter(post => {
        if (activeTab === 'ALL') return true;
        if (activeTab === 'SCHEDULED' && post.status === 'SCHEDULED') return true;
        if (activeTab === 'PUBLISHED' && post.status === 'PUBLISHED') return true;
        if (activeTab === 'DRAFT' && (post.status === 'DRAFT' || post.status === 'FAILED')) return true; // Include FAILED in Drafts for now or separate?
        return false;
    });

    return (
        <div className="space-y-6">
            {/* Header & New Post */}
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

            {/* Tabs */}
            <div className="flex border-b border-slate-700 space-x-6">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'ALL' ? 'border-aurora-cyan text-aurora-cyan' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    すべて
                </button>
                <button 
                    onClick={() => setActiveTab('SCHEDULED')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'SCHEDULED' ? 'border-blue-400 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    予約済み
                    <span className="ml-2 bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full">
                        {posts.filter(p => p.status === 'SCHEDULED').length}
                    </span>
                </button>
                <button 
                    onClick={() => setActiveTab('PUBLISHED')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'PUBLISHED' ? 'border-green-400 text-green-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    公開済み
                </button>
                <button 
                    onClick={() => setActiveTab('DRAFT')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'DRAFT' ? 'border-slate-400 text-slate-200' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                    下書き/失敗
                    <span className="ml-2 bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full">
                        {posts.filter(p => p.status === 'DRAFT' || p.status === 'FAILED').length}
                    </span>
                </button>
            </div>

            {/* Post List */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-slate-400 text-center py-8">読み込み中...</div>
                ) : filteredPosts.length === 0 ? (
                    <div className="text-slate-500 text-center py-12 glass-card border border-dashed border-slate-700">
                        <div className="text-4xl mb-2">📭</div>
                        <p>このステータスの投稿はありません</p>
                    </div>
                ) : (
                    filteredPosts.map(post => {
                        // Extract Google URL if available
                        let googleUrl = null;
                        if (post.social_post_ids && typeof post.social_post_ids === 'object') {
                             const g = (post.social_post_ids as any).google;
                             if (g && typeof g === 'object' && g.searchUrl) {
                                  googleUrl = g.searchUrl;
                             }
                        }

                        return (
                        <div key={post.id} className={`glass-card p-6 flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-colors relative ${post.status === 'SCHEDULED' ? 'border-l-4 border-l-blue-500' : ''}`}>
                            <div className="w-full md:w-48 h-32 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                {post.media_url ? (
                                    <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">No Image</div>
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1 ${
                                        post.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 
                                        post.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' :
                                        post.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                                        'bg-slate-700 text-slate-300'
                                    }`}>
                                        {post.status === 'PUBLISHED' && '✅ 公開済み'}
                                        {post.status === 'SCHEDULED' && '🗓️ 予約済み'}
                                        {post.status === 'DRAFT' && '📝 下書き'}
                                        {post.status === 'FAILED' && '⚠️ 失敗'}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        作成: {(() => {
                                            if (!post.created_at) return '';
                                            try {
                                                // Ensure treated as UTC
                                                let dateStr = post.created_at.replace(/ /g, 'T');
                                                if (!/Z|[\+\-]\d{2}:?\d{2}$/.test(dateStr)) dateStr += 'Z';
                                                return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: ja });
                                            } catch (e) {
                                                return post.created_at;
                                            }
                                        })()}
                                    </span>
                                    {post.scheduled_at && (
                                        <span className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded ${
                                            post.status === 'SCHEDULED' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30' : 'text-slate-500'
                                        }`}>
                                            ⏰ 予約日時: {(() => {
                                                if (!post.scheduled_at) return '';
                                                try {
                                                    // Ensure treated as UTC
                                                    let dateStr = post.scheduled_at.replace(/ /g, 'T');
                                                    if (!/Z|[\+\-]\d{2}:?\d{2}$/.test(dateStr)) dateStr += 'Z';
                                                    return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: ja });
                                                } catch (e) {
                                                    return post.scheduled_at;
                                                }
                                            })()}
                                        </span>
                                    )}
                                    {/* Google Link */}
                                    {googleUrl && (
                                        <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded flex items-center gap-1 transition-colors">
                                           <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                           Googleマップで見る
                                        </a>
                                    )}
                                </div>
                                <p className="text-slate-200 whitespace-pre-wrap line-clamp-3 leading-relaxed">{post.content}</p>
                                
                                {post.status === 'FAILED' && (
                                    <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded border border-red-900/50">
                                        ※ 投稿に失敗しました。編集して再試行するか、設定を確認してください。
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => handleEdit(post)} className="px-3 py-1.5 rounded text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors">
                                        編集・再投稿
                                    </button>
                                    <button onClick={() => handleDuplicate(post)} className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                                        複製
                                    </button>
                                    <div className="flex-1"></div>
                                    <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                                        削除
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})
                )}
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
