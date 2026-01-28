'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

export default function SolicitationPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [target, setTarget] = useState('');
    const [message, setMessage] = useState('この度はご来店ありがとうございます。\nサービス向上のため、クチコミのご協力をお願いいたします。\n\n回答リンク: https://g.page/r/...');
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<{id: number, target: string, status: string}[]>([]);

    useEffect(() => {
        if(isDemoMode) {
            setHistory([
                { id: 1, target: '090-1234-5678', status: '送信済み' },
                { id: 2, target: 'sample@example.com', status: '送信済み' },
                { id: 3, target: '080-9876-5432', status: '開封済み' },
            ]);
        }
    }, [isDemoMode]);

    const handleSend = async () => {
        if(!target) return alert("送信先を入力してください");
        
        setIsSending(true);
        // Simulation
        await new Promise(r => setTimeout(r, 1500));
        alert("送信しました！");
        setTarget('');
        setIsSending(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">クチコミ獲得 (Review Solicitation)</h1>
                <p className="text-slate-400 mt-1">SMSやメールでお客様にクチコミ投稿を依頼します</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6">
                    <h3 className="font-bold text-white mb-4">新規依頼を作成</h3>
                    
                    <div className="mb-4">
                        <label className="text-xs text-slate-500 mb-2 block">送信先 (メールアドレス または 電話番号)</label>
                        <input 
                            type="text" 
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-aurora-cyan focus:outline-none"
                            placeholder="090-1234-5678"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="text-xs text-slate-500 mb-2 block">メッセージ内容</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-aurora-cyan focus:outline-none"
                        />
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-full bg-aurora-cyan text-deep-navy font-bold py-3 rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                        {isSending ? '送信中...' : '依頼を送信'}
                    </button>
                    
                    <p className="text-xs text-slate-500 mt-4 text-center">
                        ※ SMS送信には別途キャリア連携が必要です。<br/>
                        ※ 現在はシミュレーションモードで動作しています。
                    </p>
                </div>

                {/* Preview / History */}
                <div className="space-y-6">
                    <div className="glass-card p-6 bg-slate-800/50">
                        <h3 className="font-bold text-white mb-2">プレビュー</h3>
                        <div className="bg-white rounded-lg p-4 text-slate-900 text-sm shadow-lg max-w-xs mx-auto">
                            <p className="whitespace-pre-wrap">{message}</p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="font-bold text-white mb-4">最近の送信履歴</h3>
                        <div className="space-y-3">
                        <div className="space-y-3">
                            {(isDemoMode && history.length > 0 ? history : []).map(h => (
                                <div key={h.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <div className="text-slate-300">{h.target}</div>
                                    <div className="text-green-400">{h.status}</div>
                                </div>
                            ))}
                            {!isDemoMode && [1,2,3].map(i => (
                                <div key={i} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <div className="text-slate-300">090-****-123{i}</div>
                                    <div className="text-green-400">送信済み</div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
