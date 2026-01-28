'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Review = {
    id: string;
    reviewer_name: string;
    star_rating: string; // ENUM or string 'FIVE' etc? Backend schema implies string.
    comment: string;
    reply_comment?: string;
    create_time: string;
    reply_time?: string;
};

// Helper to convert star rating string/literal to number if needed, or visual
const StarRating = ({ rating }: { rating: string }) => {
    // Basic mapping if API returns "FIVE" etc, or numbers. Assuming numbers/strings "5" based on typical Google API unless enum.
    // Google often returns "FIVE", "FOUR". Let's handle both.
    const map: {[key: string]: number} = { 'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1 };
    const stars = map[rating] || parseInt(rating) || 0;
    
    return (
        <div className="flex text-yellow-500">
            {[...Array(5)].map((_, i) => (
                <span key={i} className={i < stars ? "text-yellow-400" : "text-slate-600"}>★</span>
            ))}
        </div>
    );
};

export default function ReviewsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setReviews(await res.json());
            }
        } catch (e) {
            console.error(e);
            setReviews([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isDemoMode) {
             setReviews([
                { id: '1', reviewer_name: '山田 太郎', star_rating: 'FIVE', comment: '店員さんの対応がとても丁寧で良かったです。また利用したいです。', create_time: new Date().toISOString() },
                { id: '2', reviewer_name: 'Suzuki Hanako', star_rating: 'FOUR', comment: '料理は美味しかったですが、提供が少し遅かったです。', create_time: new Date(Date.now() - 86400000).toISOString(), reply_comment: 'この度はご来店ありがとうございます。提供時間についてご不便をおかけし申し訳ございません。改善に努めてまいります。', reply_time: new Date().toISOString() },
                { id: '3', reviewer_name: '田中 健', star_rating: 'FIVE', comment: '最高でした！', create_time: new Date(Date.now() - 172800000).toISOString() },
            ]);
            setIsLoading(false);
            return;
        }

        if (userInfo?.store_id) {
            fetchReviews();
        } else {
             setIsLoading(false);
        }
    }, [userInfo, isDemoMode]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/sync/${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(`同期完了: ${data.message}`);
                fetchReviews();
            } else {
                alert('同期に失敗しました');
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyText) return;
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reply_text: replyText })
            });
            
            if (res.ok) {
                alert('返信しました');
                setReplyingTo(null); // Close box
                setReplyText('');
                fetchReviews();
            } else {
                const err = await res.json();
                alert(`返信失敗: ${err.detail}`);
            }
        } catch (e) {
            alert('エラーが発生しました');
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">クチコミ管理</h1>
                    <p className="text-slate-400 mt-1">お客様からのクチコミを確認・返信します</p>
                </div>
                <button 
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                    {isSyncing ? '同期中...' : '🔄 Googleから同期'}
                </button>
            </div>

            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-slate-400 text-center py-8">読み込み中...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-slate-500 text-center py-8 glass-card">
                        クチコミはまだありません。<br/>
                        同期ボタンを押して最新のクチコミを取得してください。
                    </div>
                ) : (
                    reviews.map(review => (
                        <div key={review.id} className="glass-card p-6 gap-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400">
                                        {review.reviewer_name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{review.reviewer_name}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <StarRating rating={review.star_rating} />
                                            <span>•</span>
                                            <span>{format(new Date(review.create_time), 'yyyy/MM/dd', { locale: ja })}</span>
                                        </div>
                                    </div>
                                </div>
                                {!review.reply_comment && (
                                    <button 
                                        onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                                        className="text-aurora-cyan text-sm hover:underline"
                                    >
                                        {replyingTo === review.id ? 'キャンセル' : '返信する'}
                                    </button>
                                )}
                            </div>

                            <p className="text-slate-300 mb-4 whitespace-pre-wrap">{review.comment || '(コメントなし)'}</p>

                            {review.reply_comment && (
                                <div className="bg-slate-800/50 p-4 rounded-lg border-l-2 border-aurora-cyan ml-4">
                                    <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                        <span className="font-bold text-aurora-cyan">オーナーからの返信</span>
                                        <span>{review.reply_time && format(new Date(review.reply_time), 'yyyy/MM/dd', { locale: ja })}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{review.reply_comment}</p>
                                </div>
                            )}

                            {replyingTo === review.id && !review.reply_comment && (
                                <div className="mt-4 animate-fade-in pl-14">
                                    <textarea 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white h-24 focus:border-aurora-cyan focus:outline-none mb-2"
                                        placeholder="返信内容を入力..."
                                    />
                                    <div className="flex justify-between items-center mb-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/reply`, {
                                                        method: 'POST',
                                                        headers: { 
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${localStorage.getItem('meo_auth_token')}`
                                                        },
                                                        body: JSON.stringify({
                                                            review_text: review.comment || "",
                                                            reviewer_name: review.reviewer_name,
                                                            star_rating: review.star_rating,
                                                            tone: "polite" 
                                                        })
                                                    });
                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        setReplyText(data.content);
                                                    } else {
                                                        alert("AI生成に失敗しました");
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("エラーが発生しました");
                                                }
                                            }}
                                            className="text-xs flex items-center gap-1 text-aurora-purple hover:text-white transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            AIで返信を生成
                                        </button>
                                        <button 
                                            onClick={() => handleReply(review.id)}
                                            className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded text-sm hover:bg-cyan-400"
                                        >
                                            返信を送信
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
