'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type LocationDetails = {
    name: string; // Resource name "locations/..."
    title: string;
    websiteUri?: string;
    phoneNumbers?: {
        primaryPhone?: string;
    };
    regularHours?: {
        periods: Array<{
            openDay: string;
            openTime: string;
            closeDay: string;
            closeTime: string;
        }>;
    };
};

export default function ProfilePage() {
    const { userInfo, isLoading: userLoading } = useDashboard();
    const [details, setDetails] = useState<LocationDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [website, setWebsite] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (userInfo?.store_id) {
            fetchDetails(userInfo.store_id);
        }
    }, [userInfo]);

    const fetchDetails = async (storeId: string) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations/${storeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());
            
            const data: LocationDetails = await res.json();
            setDetails(data);
            setTitle(data.title);
            setWebsite(data.websiteUri || '');
            setPhone(data.phoneNumbers?.primaryPhone || '');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInfo?.store_id) return;
        
        setSaving(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const body = {
                title,
                websiteUri: website,
                phoneNumbers: { primaryPhone: phone }
            };
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations/${userInfo.store_id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error(await res.text());
            
            alert('Googleビジネスプロフィールの情報を更新しました！（反映には時間がかかる場合があります）');
            fetchDetails(userInfo.store_id); // Refresh
        } catch (e: any) {
            alert(`更新エラー: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (userLoading || loading) return <div className="p-8 text-slate-400">読み込み中...</div>;
    
    if (!userInfo?.store_id) {
        return <div className="p-8 text-slate-400">店舗が選択されていません。設定画面で店舗を選択してください。</div>;
    }

    if (error) {
         return (
            <div className="p-8">
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded text-red-400">{error}</div>
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">店舗情報管理</h1>
                <p className="text-slate-400 mt-1">
                    ここでの変更は<strong className="text-aurora-cyan">Googleビジネスプロフィールに直接反映されます</strong>。
                </p>
            </div>

            <form onSubmit={handleSave} className="glass-card p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">ビジネス名 (Google上の表示名)</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                        />
                    </div>

                    <div className="space-y-2">
                         <label className="text-sm text-slate-400">電話番号</label>
                        <input 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                        />
                    </div>

                     <div className="space-y-2 md:col-span-2">
                         <label className="text-sm text-slate-400">ウェブサイトURL</label>
                        <input 
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                        />
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-aurora-cyan text-deep-navy font-bold px-6 py-2 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Googleに送信中...' : '変更をGoogleに反映する'}
                    </button>
                </div>
            </form>
            
            {/* 読み取り専用情報 */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">システム情報</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="block text-slate-500">Google Location ID</span>
                        <span className="font-mono text-slate-300">{details?.name}</span>
                    </div>
                     <div>
                        <span className="block text-slate-500">営業時間の編集</span>
                        <span className="text-slate-300">現在はGoogleビジネスプロフィールから直接編集してください（今後実装予定）</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
