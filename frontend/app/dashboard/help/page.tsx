'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function HelpPage() {
  const [category, setCategory] = useState('FEATURE_REQUEST');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/inquiries`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('SENDING');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/support/inquiry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ category, message })
      });

      if (!res.ok) throw new Error('Send failed');

      setStatus('SUCCESS');
      setMessage('');
      fetchInquiries(); // Refresh list
      
      setTimeout(() => setStatus('IDLE'), 3000);
    } catch (error) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Mail className="w-6 h-6 text-purple-400" />
        お問い合わせ・ヘルプ
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">メッセージを送信</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">カテゴリ</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="BUG">不具合の報告</option>
                <option value="FEATURE_REQUEST">機能の要望</option>
                <option value="Billing">契約・支払いについて</option>
                <option value="OTHER">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">内容</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="詳細をご記入ください..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={status === 'SENDING' || !message.trim()}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                status === 'SUCCESS' ? 'bg-green-600 text-white' :
                status === 'ERROR' ? 'bg-red-600 text-white' :
                'bg-purple-600 hover:bg-purple-500 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {status === 'SENDING' ? '送信中...' : 
               status === 'SUCCESS' ? <><CheckCircle className="w-5 h-5"/> 送信しました</> :
               status === 'ERROR' ? <><AlertCircle className="w-5 h-5"/> エラーが発生しました</> :
               <><Send className="w-5 h-5"/> 送信</>}
            </button>
          </form>
        </div>

        {/* History / FAQ */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">送信履歴</h2>
            {history.length === 0 ? (
              <p className="text-slate-500 text-center py-8">履歴はありません</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {history.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.category === 'BUG' ? 'bg-red-900/50 text-red-200' :
                        item.category === 'FEATURE_REQUEST' ? 'bg-blue-900/50 text-blue-200' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{item.message}</p>
                    <div className="mt-2 flex justify-end">
                      <span className={`text-xs ${item.status === 'RESOLVED' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {item.status === 'RESOLVED' ? '解決済み' : '対応中'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
             <h3 className="text-sm font-medium text-slate-400 mb-2">よくある質問</h3>
             <ul className="text-sm space-y-2 text-slate-300">
               <li>• Google連携がうまくいかない場合は？</li>
               <li>• 投稿予約の変更方法は？</li>
               <li>• プランの変更について</li>
             </ul>
             <a href="/dashboard/manual/usage" className="block mt-4 text-purple-400 text-sm hover:underline">
               操作マニュアルを見る →
             </a>
          </div>
        </div>
      </div>
    </div>
  );
}
