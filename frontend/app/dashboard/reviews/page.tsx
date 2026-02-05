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
    // AI Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [globalPrompt, setGlobalPrompt] = useState('');
    const [isSavingPrompt, setIsSavingPrompt] = useState(false);
    const [isPromptLocked, setIsPromptLocked] = useState(false);
    const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
    const [includePastReviews, setIncludePastReviews] = useState(false);

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

        // Fetch Settings (Global Prompt & Auto-Reply)
        const fetchSettings = async () => {
            if (isDemoMode) return;
            try {
                const token = localStorage.getItem('meo_auth_token');
                
                // Fetch Global Prompt
                const promptRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts?category=REVIEW_REPLY`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(promptRes.ok) {
                    const prompts = await promptRes.json();
                    if (prompts.length > 0) {
                        setGlobalPrompt(prompts[0].content);
                        setIsPromptLocked(prompts[0].is_locked);
                    }
                }

                if (userInfo?.store_id) {
                    // Fetch Auto-Reply Settings
                    const storeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stores/${userInfo.store_id}/auto-reply`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (storeRes.ok) {
                        const storeData = await storeRes.json();
                        setAutoReplyEnabled(storeData.auto_reply_enabled);
                        // If we have a stored prompt specifically for auto-reply, maybe use it?
                        // For now, we sync them, so global prompt is sufficient.
                        if (storeData.auto_reply_prompt) {
                             setGlobalPrompt(storeData.auto_reply_prompt);
                        }
                    }
                }
            } catch(e) { console.error(e); }
        };
        fetchSettings();


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
            
            // 1. Save to Store Settings (for Auto-Reply)
            const res1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stores/${userInfo?.store_id}/auto-reply`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    enabled: autoReplyEnabled,
                    prompt: globalPrompt,
                    include_past_reviews: includePastReviews
                })
            });
            
            if (!res1.ok) throw new Error("Auto-reply settings save failed");

            // 2. Save to Global Prompt (for Manual Generation consistency)
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

            alert("設定を保存しました\n自動返信設定も更新されました");
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

    const [showAnalysis, setShowAnalysis] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setShowAnalysis(true);
        setAnalysisResult(null);

        if (isDemoMode) {
            await new Promise(r => setTimeout(r, 2000));
            setAnalysisResult({
                summary: "全体的に非常に好評です。特に「桜餅ラテ」への言及が多く、季節商品がフックとなっています。一方でWi-Fi速度に関する指摘が散見されるため、通信環境の改善が満足度向上への鍵となります。",
                sentiment_score: 85,
                positive_points: ["季節限定メニュー（桜餅ラテ）", "スタッフの接客態度", "落ち着いた雰囲気"],
                negative_points: ["Wi-Fiの通信速度", "ランチタイムの混雑"],
                action_plan: "ピークタイムのオペレーション見直しと、Wi-Fi環境のバックボーン増強を検討する"
            });
            setIsAnalyzing(false);
            return;
        }

        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/analyze/sentiment`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-OpenAI-Api-Key': localStorage.getItem('openai_api_key') || ''
                },
                body: JSON.stringify({ store_id: userInfo?.store_id })
            });
            
            if (res.ok) {
                setAnalysisResult(await res.json());
            } else {
                throw new Error(await res.text());
            }
        } catch (e: any) {
            console.error(e);
            alert(`分析エラー: ${e.message}`);
            setShowAnalysis(false);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!userInfo?.store_id) return <div className="p-8 text-slate-400">店舗を選択してください</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">クチコミ管理</h1>
                    <p className="text-slate-400 mt-1 text-sm sm:text-base">お客様からのクチコミを確認・返信します</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={handleAnalyze}
                        className="bg-linear-to-r from-aurora-purple to-pink-500 text-white font-bold px-3 sm:px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center gap-2"
                    >
                        🧠 AIクチコミ分析
                    </button>
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="bg-slate-800 text-slate-300 border border-slate-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                    >
                        ⚙️ AI返信設定
                    </button>
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-slate-700 text-white border border-slate-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isSyncing ? '同期中...' : '🔄 Googleから同期'}
                    </button>
                </div>
            </div>

            {/* Analysis Modal */}
            {showAnalysis && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-slate-900 rounded-2xl w-full max-w-2xl p-6 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                🧠 AIクチコミ分析結果
                            </h3>
                            <button onClick={() => setShowAnalysis(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        
                        {isAnalyzing ? (
                            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-aurora-cyan"></div>
                                <p>AIが最近のクチコミを分析中...</p>
                            </div>
                        ) : analysisResult ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl">
                                    <div className="text-center px-4 border-r border-slate-700">
                                        <div className="text-sm text-slate-400">センチメントスコア</div>
                                        <div className={`text-3xl font-bold ${analysisResult.sentiment_score >= 80 ? 'text-green-400' : analysisResult.sentiment_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {analysisResult.sentiment_score}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white mb-1">総評</div>
                                        <p className="text-sm text-slate-300">{analysisResult.summary}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                                        <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">👍 高評価ポイント</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                            {analysisResult.positive_points?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                        <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">👎 改善のヒント</h4>
                                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                                            {analysisResult.negative_points?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                {analysisResult.action_plan && (
                                    <div className="bg-aurora-purple/10 border border-aurora-purple/30 p-4 rounded-xl">
                                        <h4 className="font-bold text-aurora-purple mb-2">💡 推奨アクションプラン</h4>
                                        <p className="text-sm text-white font-medium">{analysisResult.action_plan}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center text-red-400">分析に失敗しました</div>
                        )}
                    </div>
                </div>
            )}

            {/* Settings Modal (Existing) */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in">
                    {/* ... existing settings modal code ... */}
                    <div className="bg-slate-900 rounded-2xl w-full max-w-lg p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span>⚙️</span> AI返信・自動返信設定
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Auto Reply Toggle */}
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-white mb-1">自動返信機能</div>
                                        <div className="text-xs text-slate-400">新着のクチコミ（未返信）にAIが自動で返信します。<br/>24時間以内に実行されます（実際は5分毎チェック）。</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={autoReplyEnabled}
                                            onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-aurora-cyan"></div>
                                    </label>
                                </div>
                                
                                {autoReplyEnabled && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-white/5 animate-fade-in">
                                        <input 
                                            type="checkbox" 
                                            id="includePast"
                                            checked={includePastReviews}
                                            onChange={(e) => setIncludePastReviews(e.target.checked)}
                                            className="rounded bg-slate-700 border-slate-600 text-aurora-cyan focus:ring-aurora-cyan"
                                        />
                                        <label htmlFor="includePast" className="text-sm text-slate-300">
                                            過去の未返信クチコミも対象にする
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-300">
                                        AI返信プロンプト（指示）
                                    </label>
                                    <button
                                        onClick={() => setIsPromptLocked(!isPromptLocked)}
                                        className={`p-1.5 rounded-lg transition-colors ${isPromptLocked ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                                        title={isPromptLocked ? "ロック解除" : "編集をロック"}
                                    >
                                        {isPromptLocked ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                </div>
                                <textarea 
                                    value={globalPrompt}
                                    onChange={(e) => setGlobalPrompt(e.target.value)}
                                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white h-32 focus:outline-none transition-all ${
                                        isPromptLocked 
                                        ? 'border-red-500/30 opacity-70 cursor-not-allowed' 
                                        : 'border-slate-600 focus:border-aurora-cyan'
                                    }`}
                                    placeholder="例: 親しみやすいトーンで、感謝の気持ちを伝えてください。また、新メニューの提案も含めてください。"
                                    disabled={isPromptLocked}
                                />
                                <div className="text-xs text-slate-500 mt-2">
                                    ※ この設定は「手動AI生成」と「自動返信」の両方に適用されます。
                                </div>
                            </div>
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
                                                            'X-OpenAI-Api-Key': localStorage.getItem('openai_api_key') || ''
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
                                                        const errText = await res.text();
                                                        let errMsg = "AI生成に失敗しました";
                                                        
                                                        if (res.status === 429) {
                                                            if (errText.includes('insufficient_quota')) {
                                                                errMsg = "⚠️ OpenAI APIのクレジットが不足しています。\nOpenAIのBilling設定を確認してください。";
                                                            } else {
                                                                errMsg = "⚠️ AIの利用制限を超えました。しばらく待ってから再試行してください。";
                                                            }
                                                        } else {
                                                            try {
                                                                const errJson = JSON.parse(errText);
                                                                if(errJson.detail) errMsg += `\n${errJson.detail}`;
                                                            } catch(e) {
                                                                errMsg += ` (Status: ${res.status})`;
                                                            }
                                                        }
                                                        alert(errMsg);
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
