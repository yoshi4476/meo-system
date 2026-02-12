'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

interface Notification {
  id: string;
  type: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { userInfo } = useDashboard();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const token = localStorage.getItem('meo_auth_token');
        if (!token) return;

        const res = await fetch(`${apiUrl}/notifications/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
            const data = await res.json();
            setNotifications(data);
        }
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleTestEmail = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        const token = localStorage.getItem('meo_auth_token');
        if (!token) return;

        alert("テストメール送信をリクエストします...");
        
        await fetch(`${apiUrl}/notifications/test-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
        });
        
        // Reload list
        window.location.reload();
      } catch (e) {
          alert("送信に失敗しました");
      }
  }

  if (loading) return <div className="p-8 text-white">読み込み中...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">通知センター</h1>
          <p className="text-slate-400">システムからの重要なお知らせやアラートを確認できます。</p>
        </div>
        <button 
            onClick={handleTestEmail}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
        >
            テストメール送信
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-slate-400">まだ通知はありません</p>
          </div>
        ) : (
          notifications.map((note) => (
            <div 
                key={note.id} 
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            note.type === 'EMAIL' ? 'bg-blue-500/20 text-blue-300' :
                            note.type === 'ALARM' ? 'bg-red-500/20 text-red-300' :
                            'bg-slate-500/20 text-slate-300'
                        }`}>
                            {note.type}
                        </span>
                        <span className="text-xs text-slate-500">
                            {new Date(note.created_at).toLocaleString()}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{note.subject || '無題の通知'}</h3>
                    <p className="text-slate-300 whitespace-pre-wrap text-sm">{note.message}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded border ${
                        note.status === 'SENT' ? 'border-green-500/30 text-green-400' :
                        note.status === 'FAILED' ? 'border-red-500/30 text-red-400' :
                        'border-yellow-500/30 text-yellow-400'
                    }`}>
                        {note.status}
                    </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
