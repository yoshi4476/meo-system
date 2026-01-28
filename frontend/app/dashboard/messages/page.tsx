'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';

type Message = {
    id: number;
    sender: 'user' | 'customer';
    text: string;
    time: string;
};

export default function MessagesPage() {
    const { isDemoMode } = useDashboard();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (isDemoMode) {
            setMessages([
                { id: 1, sender: 'customer', text: '今週末の予約は可能でしょうか？', time: '10:00' },
                { id: 2, sender: 'user', text: 'お問い合わせありがとうございます。今週末は土曜日の18時以降であれば空きがございます。', time: '10:05' },
                { id: 3, sender: 'customer', text: 'ありがとうございます、では18時でお願いします。', time: '10:10' },
            ]);
        }
    }, [isDemoMode]);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { 
            id: Date.now(), 
            sender: 'user', 
            text: input, 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }]);
        setInput('');
        
        // Demo AI Reply Mock
        if (isDemoMode) {
             setTimeout(() => {
                 setMessages(prev => [...prev, {
                     id: Date.now() + 1,
                     sender: 'customer',
                     text: '(自動応答) かしこまりました。お待ちしております。',
                     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                 }]);
             }, 1000);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h1 className="font-bold text-white">メッセージ (Demo)</h1>
                <span className="text-xs text-slate-400">佐藤 健 (Customer)</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && <div className="text-center text-slate-500 mt-10">メッセージはありません</div>}
                
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user' ? 'bg-aurora-purple text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <p className="text-sm">{msg.text}</p>
                            <span className="text-[10px] opacity-70 block text-right mt-1">{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-white/10 bg-slate-900/50">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-aurora-cyan text-white px-4" // Removed py-2 to fix vertical alignment if needed, or keep standard
                        placeholder="メッセージを入力..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button onClick={handleSend} className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors">
                        送信
                    </button>
                     <button className="bg-white/10 text-aurora-cyan px-3 py-2 rounded-lg hover:bg-white/20 transition-colors" title="AI返信生成">
                        ✨
                    </button>
                </div>
            </div>
        </div>
    );
}
