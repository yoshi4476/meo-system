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
    const { userInfo, isDemoMode, syncData } = useDashboard();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    
    // AI Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [globalPrompt, setGlobalPrompt] = useState('');
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [isPromptLocked, setIsPromptLocked] = useState(false);

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
        // Fetch Global Prompt
        const fetchPrompt = async () => {
            if (isDemoMode) return;
            try {
                const token = localStorage.getItem('meo_auth_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts?category=REVIEW_REPLY`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(res.ok) {
                    const prompts = await res.json();
                    if (prompts.length > 0) {
                        setGlobalPrompt(prompts[0].content);
                        setIsPromptLocked(prompts[0].is_locked);
                    }
                }
            } catch(e) { console.error(e); }
        };
        fetchPrompt();

        if (isDemoMode) {
             setReviews([
                { id: '1', reviewer_name: '田中 健太', star_rating: 'FIVE', comment: '落ち着いた雰囲気で、コーヒーもとても美味しかったです。また利用させていただきます。', create_time: new Date().toISOString() },
                { id: '2', reviewer_name: 'Sarah Jenkins', star_rating: 'FOUR', comment: 'Great coffee but a bit crowded during lunch.', create_time: new Date(Date.now() - 86400000).toISOString(), reply_comment: 'Thank you for visiting! We are planning to expand our seating area soon.', reply_time: new Date().toISOString() },
                { id: '3', reviewer_name: '山本 さくら', star_rating: 'FIVE', comment: '店員さんの笑顔が素敵でした！桜餅ラテも最高🌸', create_time: new Date(Date.now() - 172800000).toISOString() },
                { id: '4', reviewer_name: '高橋 誠', star_rating: 'THREE', comment: 'Wi-Fiが少し遅かったのが気になりました。', create_time: new Date(Date.now() - 259200000).toISOString(), reply_comment: '貴重なご意見ありがとうございます。Wi-Fi環境の改善を検討いたします。', reply_time: new Date().toISOString() },
                { id: '5', reviewer_name: 'MEO User', star_rating: 'FIVE', comment: '仕事が捗る最高のカフェです。', create_time: new Date(Date.now() - 432000000).toISOString() },
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

    const handleSaveSettings = async () => {
        setIsSavingPrompt(true);
        if (isDemoMode) {
            alert("設定を保存しました (デモ)");
            setIsSavingPrompt(false);
            setShowSettings(false);
            return;
        }
        try {
            const token = localStorage.getItem('meo_auth_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title: "Global Review Reply Prompt",
                    content: globalPrompt,
                    category: "REVIEW_REPLY",
                    is_locked: isPromptLocked
                })
            });
            alert("設定を保存しました");
            setShowSettings(false);
        } catch(e) {
            console.error(e);
            alert("保存に失敗しました");
        } finally {
            setIsSavingPrompt(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncData();
            // Fetch reviews again after sync if page didn't reload
             if (!isDemoMode && userInfo?.store_id) fetchReviews();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReply = async (reviewId: string) => {
        if (!replyText) return;
        
        if (isDemoMode) {
            alert('デモモード: 返信を投稿しました！');
            // Mock update UI
            const newReviews = reviews.map(r => {
                if (r.id === reviewId) {
                    return { ...r, reply_comment: replyText, reply_time: new Date().toISOString() };
                }
                return r;
            });
            setReviews(newReviews);
            setReplyingTo(null);
            setReplyText('');
            return;
        }

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
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="bg-slate-800 text-slate-300 border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        ⚙️ AI返信設定
                    </button>
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-slate-700 text-white border border-slate-600 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                        {isSyncing ? '同期中...' : '🔄 Googleから同期'}
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">AI返信設定</h3>
                        
                        <div className="mb-6 relative">
                            <div className="flex justify-between items-center mb-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300">共通プロンプト (返信ポリシー)</label>
                                    <p className="text-xs text-slate-500">すべてのクチコミ返信生成時に、この指示が適用されます。</p>
                                </div>
                                <button
                                    onClick={() => setIsPromptLocked(!isPromptLocked)}
                                    className={`p-2 rounded-lg transition-colors ${isPromptLocked ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                    title={isPromptLocked ? "ロック解除" : "編集をロック"}
                                >
                                    {isPromptLocked ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                            </div>
                            <textarea 
                                value={globalPrompt}
                                onChange={e => setGlobalPrompt(e.target.value)}
                                placeholder="例: 「ありがとうございます」から始めて、最後は「またのご来店をお待ちしております」で締めてください。全体的に親しみやすいトーンで。"
                                disabled={isPromptLocked}
                                className={`w-full bg-slate-800 border rounded-lg px-4 py-3 text-white h-40 focus:outline-none transition-all ${
                                    isPromptLocked 
                                    ? 'border-red-500/30 opacity-70 cursor-not-allowed' 
                                    : 'border-white/10 focus:border-aurora-cyan'
                                }`}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white"
                            >
                                キャンセル
                            </button>
                            <button 
                                onClick={handleSaveSettings}
                                disabled={isSavingPrompt}
                                className="px-6 py-2 bg-aurora-cyan text-deep-navy font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                            >
                                {isSavingPrompt ? '保存中...' : '保存する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                                if(isDemoMode) {
                                                    await new Promise(r => setTimeout(r, 1500));
                                                    setReplyText(`${review.reviewer_name}様、ご来店ありがとうございます。\n\n${review.star_rating === 'FIVE' || review.star_rating === '5' ? '高評価をいただき大変嬉しく思います！桜餅ラテは春限定の人気メニューですので、気に入っていただけて光栄です。' : '貴重なご意見ありがとうございます。ご指摘いただいた点はスタッフ共有し、改善に努めてまいります。'}\n\nまたのご来店を心よりお待ちしております。\nMEO Cafe 渋谷店 店長`);
                                                    return;
                                                }

                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/reply`, {
                                                        method: 'POST',
                                                        headers: { 
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${localStorage.getItem('meo_auth_token')}`,
                                                            'X-Gemini-Api-Key': localStorage.getItem('gemini_api_key') || ''
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
