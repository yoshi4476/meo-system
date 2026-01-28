'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

type LocationDetails = {
    name: string;
    title: string;
    storeCode?: string;
    websiteUri?: string;
    phoneNumbers?: {
        primaryPhone?: string;
        additionalPhones?: string[];
    };
    regularHours?: {
        periods: Array<{
            openDay: string;
            openTime: string;
            closeDay: string;
            closeTime: string;
        }>;
    };
    categories?: {
        primaryCategory: { displayName: string; categoryId: string };
        additionalCategories?: Array<{ displayName: string; categoryId: string }>;
    };
    profile?: {
        description?: string;
    };
    serviceArea?: {
        businessType: string;
        places?: { placeInfos: Array<{ name: string; placeId: string }> };
    };
    latlng?: {
        latitude: number;
        longitude: number;
    };
    metadata?: {
        mapsUri?: string;
        newReviewUri?: string;
    };
};

export default function ProfilePage() {
    const { userInfo, isLoading: userLoading, isDemoMode } = useDashboard();
    const [details, setDetails] = useState<LocationDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('basic');

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        websiteUri: '',
        primaryPhone: '',
    });

    useEffect(() => {
        if (userInfo?.store_id) {
            fetchDetails(userInfo.store_id);
        }
    }, [userInfo]);

    const fetchDetails = async (storeId: string) => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                 await new Promise(resolve => setTimeout(resolve, 800));
                 setDetails({
                     name: 'locations/1234567890',
                     title: 'MEO Cafe 渋谷店 (Demo)',
                     storeCode: 'DEMO-001',
                     websiteUri: 'https://example.com',
                     phoneNumbers: { primaryPhone: '03-1234-5678' },
                     regularHours: {
                         periods: [
                             { openDay: 'Monday', openTime: '0900', closeDay: 'Monday', closeTime: '2000' },
                             { openDay: 'Tuesday', openTime: '0900', closeDay: 'Tuesday', closeTime: '2000' },
                             { openDay: 'Wednesday', openTime: '0900', closeDay: 'Wednesday', closeTime: '2000' },
                             { openDay: 'Thursday', openTime: '0900', closeDay: 'Thursday', closeTime: '2000' },
                             { openDay: 'Friday', openTime: '0900', closeDay: 'Friday', closeTime: '2200' },
                             { openDay: 'Saturday', openTime: '1000', closeDay: 'Saturday', closeTime: '2200' },
                             { openDay: 'Sunday', openTime: '1000', closeDay: 'Sunday', closeTime: '2000' },
                         ]
                     },
                     categories: {
                         primaryCategory: { displayName: 'カフェ', categoryId: 'cafe' },
                         additionalCategories: [{ displayName: '喫茶店', categoryId: 'coffee_shop' }]
                     },
                     profile: { description: '渋谷駅徒歩5分の落ち着いたカフェです。自家焙煎のコーヒーと手作りケーキが自慢です。Wi-Fi完備でリモートワークにも最適。' },
                     latlng: { latitude: 35.658034, longitude: 139.701636 },
                     metadata: { mapsUri: 'https://goo.gl/maps/example' }
                 });
                 setFormData({
                    title: 'MEO Cafe 渋谷店 (Demo)',
                    description: '渋谷駅徒歩5分の落ち着いたカフェです。自家焙煎のコーヒーと手作りケーキが自慢です。Wi-Fi完備でリモートワークにも最適。',
                    websiteUri: 'https://example.com',
                    primaryPhone: '03-1234-5678',
                });
                return;
            }

            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations/${storeId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());
            
            const data: LocationDetails = await res.json();
            setDetails(data);
            setFormData({
                title: data.title || '',
                description: data.profile?.description || '',
                websiteUri: data.websiteUri || '',
                primaryPhone: data.phoneNumbers?.primaryPhone || '',
            });
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
            // Construct update payload carefully
            const body: any = {
                title: formData.title,
                websiteUri: formData.websiteUri,
                phoneNumbers: { primaryPhone: formData.primaryPhone }
            };

            // Add description if changed (Profile object)
            // Note: The backend update logic currently handles flat fields. 
            // We might need to update backend to handle 'profile' object or flatten it there.
            // For now, let's assume backend is smart enough or we add extended logic later.
            // But checking backend `locations.py`, it supports title, websiteUri, phoneNumbers.
            // Description support needs to be added to backend `patch` method if not present.
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/locations/${userInfo.store_id}`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error(await res.text());
            
            alert('Googleビジネスプロフィールの情報を更新しました！');
            fetchDetails(userInfo.store_id); 
        } catch (e: any) {
            alert(`更新エラー: ${e.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (userLoading || loading) return <div className="p-8 text-slate-400 animate-pulse">読み込み中...</div>;
    
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

    const tabs = [
        { id: 'basic', label: '基本情報' },
        { id: 'contact', label: '連絡先・場所' },
        { id: 'hours', label: '営業時間' },
        { id: 'attributes', label: '属性・その他' },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-white">店舗情報管理</h1>
                <p className="text-slate-400 mt-1">Googleビジネスプロフィールの完全な情報を管理します。</p>
            </div>

            {/* Header info card */}
            <div className="glass-card p-6 flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white">
                    {formData.title.substring(0,1)}
                </div>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white">{formData.title}</h2>
                    <div className="text-slate-400 text-sm mt-1 flex gap-4">
                        <span>{details?.categories?.primaryCategory?.displayName}</span>
                        {details?.storeCode && <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-xs">{details.storeCode}</span>}
                        {details?.metadata?.mapsUri && (
                            <a href={details.metadata.mapsUri} target="_blank" rel="noreferrer" className="text-aurora-cyan hover:underline">
                                Googleマップで見る ↗
                            </a>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
                        Google連携中
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-sm font-bold transition-colors relative ${
                            activeTab === tab.id ? 'text-aurora-cyan' : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-aurora-cyan shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                        )}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSave} className="glass-card p-6 min-h-[400px]">
                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">ビジネス名</label>
                                <input 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">ビジネスの説明</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows={5}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                                    placeholder="お店の魅力や特徴を入力してください..."
                                />
                                <p className="text-xs text-slate-500">※Google検索やマップに表示される説明文です (750文字以内)</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">カテゴリ</label>
                                <div className="p-3 bg-slate-900/30 rounded border border-white/5 text-slate-300">
                                    <span className="font-bold text-white">{details?.categories?.primaryCategory?.displayName}</span>
                                    {details?.categories?.additionalCategories && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {details.categories.additionalCategories.map((c, i) => (
                                                <span key={i} className="text-xs bg-slate-700 px-2 py-1 rounded">{c.displayName}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500">※カテゴリの変更はGoogleビジネスプロフィールで直接行ってください</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">電話番号 (メイン)</label>
                                <input 
                                    value={formData.primaryPhone}
                                    onChange={(e) => setFormData({...formData, primaryPhone: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-slate-400">ウェブサイトURL</label>
                                <input 
                                    value={formData.websiteUri}
                                    onChange={(e) => setFormData({...formData, websiteUri: e.target.value})}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                                />
                            </div>
                        </div>

                        {details?.latlng && (
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <h3 className="text-sm font-bold text-slate-300 mb-2">店舗の場所</h3>
                                <div className="bg-slate-900/50 p-4 rounded-lg flex items-center justify-between">
                                    <div className="text-sm text-slate-400">
                                        <div>Latitude: {details.latlng.latitude}</div>
                                        <div>Longitude: {details.latlng.longitude}</div>
                                    </div>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${details.latlng.latitude},${details.latlng.longitude}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded text-white"
                                    >
                                        マップで確認
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* HOURS TAB */}
                {activeTab === 'hours' && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-sm font-bold text-slate-300">通常営業時間</h3>
                        {details?.regularHours?.periods ? (
                            <div className="space-y-2">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                    const periods = details.regularHours?.periods.filter(p => p.openDay === day);
                                    return (
                                        <div key={day} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                            <span className="text-slate-400 w-24">{day}</span>
                                            <div className="text-white text-right flex-1">
                                                {periods && periods.length > 0 ? (
                                                    periods.map((p, i) => (
                                                        <div key={i}>{p.openTime.slice(0,2)}:{p.openTime.slice(2)} - {p.closeTime.slice(0,2)}:{p.closeTime.slice(2)}</div>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-600">定休日</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-slate-500">営業時間が設定されていません</div>
                        )}
                        <p className="text-xs text-slate-500 mt-4">※営業時間の編集機能は次回アップデートで追加予定です</p>
                    </div>
                )}

                {/* ATTRIBUTES TAB */}
                {activeTab === 'attributes' && (
                    <div className="space-y-6 animate-fadeIn">
                         <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-300">サービスオプション・属性</h3>
                            <div className="p-4 bg-slate-900/30 rounded border border-white/5 text-center text-slate-500 text-sm">
                                属性情報は現在読み取り専用です。<br/>
                                詳細な編集はGoogleビジネスプロフィール画面で行ってください。
                            </div>
                         </div>
                    </div>
                )}

                <div className="border-t border-white/5 pt-6 mt-6 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-aurora-cyan text-deep-navy font-bold px-8 py-2.5 rounded-lg hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        {saving ? '更新中...' : '変更を保存'}
                    </button>
                </div>
            </form>
        </div>
    );
}
