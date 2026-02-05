'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Answer = {
    id: string;
    text: string;
    create_time: string;
    author_name: string;
    author_type: string; // "MERCHANT" or "USER"
};

type Question = {
    id: string;
    text: string;
    create_time: string;
    author_name: string;
    upvote_count: number;
    answers: Answer[];
};

export default function QAPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        if (userInfo?.store_id) {
            fetchExpectedQuestions();
        }
    }, [userInfo]);

    const fetchExpectedQuestions = async () => {
        setIsLoading(true);
        try {
            if (isDemoMode) {
                 await new Promise(resolve => setTimeout(resolve, 800));
                 setQuestions([
                     {
                         id: '1', author_name: '田中 太郎', text: '駐車場のサービス券はありますか？', create_time: new Date().toISOString(), upvote_count: 2,
                         answers: [
                             { id: 'a1', text: 'はい、2000円以上のご利用で1時間サービス券をお渡ししています。', author_name: 'オーナー', author_type: 'MERCHANT', create_time: new Date().toISOString() }
                         ]
                     },
                     {
                         id: '2', author_name: '鈴木 花子', text: 'ベビーカーでの入店は可能ですか？', create_time: new Date(Date.now() - 86400000).toISOString(), upvote_count: 5,
                         answers: [] // Unanswered
                     }
                 ]);
                 setIsLoading(false);
                 return;
            }

            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qa/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setQuestions(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        if (isDemoMode) {
            setIsSyncing(true);
            await new Promise(r => setTimeout(r, 1500));
            setIsSyncing(false);
            alert('デモモード: Q&Aを同期しました');
            fetchExpectedQuestions();
            return;
        }

        setIsSyncing(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qa/sync/${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                alert(`同期完了: ${data.message}`);
                fetchExpectedQuestions();
            } else {
                const errData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                alert(`Q&A同期に失敗しました: ${errData.detail}`);
            }
        } catch (e) {
            alert('エラーが発生しました');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleReply = async (questionId: string) => {
        if (!replyText) return;
        
        if (isDemoMode) {
            alert('デモモード: 回答を投稿しました');
            const newQuestions = questions.map(q => {
                if (q.id === questionId) {
                    return {
                        ...q,
                        answers: [
                            ...q.answers,
                            { id: `demo-ans-${Date.now()}`, text: replyText, author_name: 'オーナー', author_type: 'MERCHANT', create_time: new Date().toISOString() }
                        ]
                    };
                }
                return q;
            });
            setQuestions(newQuestions);
            setReplyingTo(null);
            setReplyText('');
            return;
        }

        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qa/${questionId}/answer`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: replyText })
            });
            
            if (res.ok) {
                alert('回答しました');
                setReplyingTo(null);
                setReplyText('');
                fetchExpectedQuestions();
            } else {
                const err = await res.json();
                alert(`回答失敗: ${err.detail}`);
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
                    <h1 className="text-3xl font-bold text-white">Q&A管理</h1>
                    <p className="text-slate-400 mt-1">お客様からの質問を確認・回答します</p>
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
                ) : questions.length === 0 ? (
                    <div className="text-slate-500 text-center py-8 glass-card">
                        質問はまだありません。<br/>
                        同期ボタンを押して最新の質問を取得してください。
                    </div>
                ) : (
                    questions.map(q => (
                        <div key={q.id} className="glass-card p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-400">
                                        Q
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{q.text}</div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{q.author_name}</span>
                                            <span>•</span>
                                            <span>{format(new Date(q.create_time), 'yyyy/MM/dd', { locale: ja })}</span>
                                            {q.upvote_count > 0 && <span className="text-amber-500">★ {q.upvote_count}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)}
                                    className="text-aurora-cyan text-sm hover:underline"
                                >
                                    {replyingTo === q.id ? 'キャンセル' : '回答する'}
                                </button>
                            </div>

                            {/* Answers List */}
                            {q.answers && q.answers.length > 0 && (
                                <div className="space-y-3 pl-14 mb-4">
                                    {q.answers.map(a => (
                                        <div key={a.id} className={`p-4 rounded-lg border-l-2 ${a.author_type === 'MERCHANT' ? 'bg-slate-800/50 border-aurora-cyan' : 'bg-slate-900/50 border-slate-600'}`}>
                                            <div className="text-xs text-slate-400 mb-1 flex justify-between">
                                                <span className={`font-bold ${a.author_type === 'MERCHANT' ? 'text-aurora-cyan' : 'text-slate-300'}`}>
                                                    {a.author_type === 'MERCHANT' ? 'オーナーからの回答' : a.author_name}
                                                </span>
                                                <span>{format(new Date(a.create_time), 'yyyy/MM/dd', { locale: ja })}</span>
                                            </div>
                                            <p className="text-slate-300 text-sm whitespace-pre-wrap">{a.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {replyingTo === q.id && (
                                <div className="mt-4 animate-fade-in pl-14">
                                    <textarea 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white h-24 focus:border-aurora-cyan focus:outline-none mb-2"
                                        placeholder="回答を入力..."
                                    />
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => handleReply(q.id)}
                                            className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded text-sm hover:bg-cyan-400"
                                        >
                                            回答を送信
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
