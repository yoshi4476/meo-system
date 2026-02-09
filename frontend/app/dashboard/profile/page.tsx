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
    postalAddress?: {
        regionCode?: string;
        languageCode?: string;
        postalCode?: string;
        administrativeArea?: string;
        locality?: string;
        subLocality?: string; // Added for robust fallback
        addressLines?: string[];
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
    labels?: string[];
    openInfo?: {
        status: string;
        canReopen?: boolean;
        openingDate?: {
            year: number;
            month: number;
            day: number;
        };
    };
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_LABELS: {[key:string]: string} = { 'Monday': '月曜日', 'Tuesday': '火曜日', 'Wednesday': '水曜日', 'Thursday': '木曜日', 'Friday': '金曜日', 'Saturday': '土曜日', 'Sunday': '日曜日' };

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
        rawCategoryId: '',
        storeCode: '',
        openingDate: '',
        // Address
        postalCode: '',
        administrativeArea: '',
        locality: '',
        addressLine1: '',
        addressLine2: '',
        labels: '', // Comma separated
    });

    // Hours State: { Day: { open: "0900", close: "1700", isClosed: false } }
    const [hoursState, setHoursState] = useState<{[key:string]: {open: string, close: string, isClosed: boolean}}>({});

    useEffect(() => {
        if (userInfo?.store_id) {
            fetchDetails(userInfo.store_id);
        }
    }, [userInfo]);

    const fetchDetails = async (storeId: string, force: boolean = false) => {
        setLoading(true);
        setError(null);
        try {
            if (isDemoMode) {
                 await new Promise(resolve => setTimeout(resolve, 800));
                 const demoData: LocationDetails = {
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
                     postalAddress: {
                         postalCode: '150-0002',
                         administrativeArea: '東京都',
                         locality: '渋谷区',
                         addressLines: ['渋谷2-2-2', '青山ビル1F']
                     },
                     latlng: { latitude: 35.658034, longitude: 139.701636 },
                     metadata: { mapsUri: 'https://goo.gl/maps/example' }
                 };
                 setDetails(demoData);
                 mapDataToForm(demoData);
                 if (force) alert('Googleから最新情報を同期しました(Demo)');
                 return;
            }

            const token = localStorage.getItem('meo_auth_token');
            const url = `${process.env.NEXT_PUBLIC_API_URL}/locations/${storeId}${force ? '?force_refresh=true' : ''}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(await res.text());
            
            const data: LocationDetails = await res.json();
            
            if (!data) {
                setDetails({ name: '', title: 'No Data' });
                return;
            }

            setDetails(data);
            mapDataToForm(data);
            if (force) alert('Googleから最新情報を同期しました');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const mapDataToForm = (data: LocationDetails) => {
        setFormData({
            title: data.title || '',
            description: data.profile?.description || '',
            websiteUri: data.websiteUri || '',
            primaryPhone: data.phoneNumbers?.primaryPhone || '',
            rawCategoryId: data.categories?.primaryCategory?.categoryId || '',
            storeCode: data.storeCode || '',
            openingDate: (data as any).openInfo?.openingDate ? 
                `${(data as any).openInfo.openingDate.year}-${String((data as any).openInfo.openingDate.month).padStart(2,'0')}-${String((data as any).openInfo.openingDate.day).padStart(2,'0')}` 
                : '',
            // Address mapping with Frontend-Side Polyfill (Robustness Level 500)
            postalCode: data.postalAddress?.postalCode || '',
            administrativeArea: data.postalAddress?.administrativeArea || '',
            locality: data.postalAddress?.locality || '',
            addressLine1: data.postalAddress?.addressLines?.[0] || 
                          data.postalAddress?.subLocality || 
                          data.postalAddress?.locality || 
                          data.postalAddress?.administrativeArea || '',
            addressLine2: data.postalAddress?.addressLines?.[1] || '',
            // Labels (if available in type, add to type def if missing)
            labels: (data as any).labels ? (data as any).labels.join(', ') : '',
        });

        // Map Hours
        const initialHours: any = {};
        DAYS.forEach(day => {
            const period = data.regularHours?.periods?.find(p => p.openDay?.toUpperCase() === day.toUpperCase());
            if (period) {
                // Function to format time
                const formatTime = (t: any) => {
                    if (!t) return "09:00";
                    if (typeof t === 'string') return t; // Already "HH:MM"
                    if (typeof t === 'object' && t.hours !== undefined) {
                        return `${String(t.hours).padStart(2, '0')}:${String(t.minutes || 0).padStart(2, '0')}`;
                    }
                    return "09:00";
                };

                const openTime = formatTime(period.openTime);
                const closeTime = formatTime(period.closeTime);
                
                initialHours[day] = {
                    open: openTime,
                    close: closeTime,
                    isClosed: false
                };
            } else {
                initialHours[day] = { open: '09:00', close: '18:00', isClosed: true };
            }
        });
        setHoursState(initialHours);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isDemoMode) {
            setSaving(true);
            await new Promise(r => setTimeout(r, 1500));
            setSaving(false);
            alert('デモモード: 店舗情報を更新しました！\n(※実際のGoogleビジネスプロフィールには反映されません)');
            return;
        }

        if (!userInfo?.store_id) return;
        
        setSaving(true);
        try {
            const token = localStorage.getItem('meo_auth_token');
            const body: any = {
                title: formData.title,
                storeCode: formData.storeCode,
                websiteUri: formData.websiteUri,
                phoneNumbers: { primaryPhone: formData.primaryPhone },
                profile: { description: formData.description },
                postalAddress: {
                    regionCode: "JP",
                    postalCode: formData.postalCode,
                    administrativeArea: formData.administrativeArea,
                    locality: formData.locality,
                    addressLines: [formData.addressLine1, formData.addressLine2].filter(Boolean)
                }
            };

            // Opening Date
            if (formData.openingDate) {
                const [y, m, d] = formData.openingDate.split('-').map(Number);
                if (y && m && d) {
                    body.openInfo = {
                        status: "OPEN", // Default to OPEN
                        openingDate: { year: y, month: m, day: d }
                    };
                }
            }

            // Format category
            if (formData.rawCategoryId) {
                let catId = formData.rawCategoryId.trim();
                if (!catId.startsWith('categories/')) {
                     if (!catId.startsWith('gcid:')) {
                         catId = `gcid:${catId}`;
                     }
                     catId = `categories/${catId}`;
                }
                body.categories = {
                    primaryCategory: { name: catId }
                };
            }
            
            // Labels
            if (formData.labels) {
                body.labels = formData.labels.split(',').map(l => l.trim()).filter(Boolean);
            }

            // Format Hours
            const periods: any[] = [];
            DAYS.forEach(day => {
                const h = hoursState[day];
                if (h && !h.isClosed && h.open && h.close) {
                    periods.push({
                        openDay: day.toUpperCase(),
                        openTime: h.open, // Keep HH:MM format
                        closeDay: day.toUpperCase(),
                        closeTime: h.close // Keep HH:MM format
                    });
                }
            });
            body.regularHours = { periods };

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
                    {userInfo?.is_google_connected ? (
                        <>
                            <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20 mb-2">
                                Google連携中
                            </span>
                            <button
                                onClick={() => {
                                    if (userInfo?.store_id) {
                                        if (confirm('Googleから最新の情報を再取得しますか？\n(ローカルの未保存の変更は破棄されます)')) {
                                            fetchDetails(userInfo.store_id, true);
                                        }
                                    }
                                }}
                                disabled={loading}
                                className="block w-full text-xs text-aurora-cyan hover:underline"
                            >
                                🔄 最新情報を同期
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="inline-block px-3 py-1 rounded-full bg-slate-700 text-slate-400 text-xs font-bold border border-slate-600 mb-2">
                                未連携
                            </span>
                            <button
                                onClick={() => window.location.href = '/dashboard/settings'}
                                className="block w-full text-xs text-aurora-cyan hover:underline"
                            >
                                ⚙️ 連携設定へ
                            </button>
                        </>
                    )}
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
                                <div className="p-3 bg-slate-800 rounded text-sm text-white flex justify-between items-center">
                                    <span>{details?.categories?.primaryCategory?.displayName || '未設定'}</span>
                                    {/* <span className="text-xs text-slate-500 font-mono">{details?.categories?.primaryCategory?.categoryId}</span> */}
                                </div>
                                {/* Hiding raw ID input to prevent confusion */}
                                <div className="hidden">
                                    <input
                                        value={formData.rawCategoryId}
                                        onChange={(e) => setFormData({...formData, rawCategoryId: e.target.value})}
                                        className="hidden"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    ※カテゴリの変更はGoogleビジネスプロフィールの管理画面から行うことを推奨します。<br/>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">店舗コード (Store Code)</label>
                                    <input 
                                        value={formData.storeCode}
                                        onChange={(e) => setFormData({...formData, storeCode: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                                        placeholder="STORE-001"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-400">開業日 (Opening Date)</label>
                                    <input 
                                        type="date"
                                        value={formData.openingDate}
                                        onChange={(e) => setFormData({...formData, openingDate: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan scheme-dark"
                                    />
                                </div>
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

                        {/* ADDRESS SECTION */}
                        <div className="border-t border-white/5 pt-6 space-y-4">
                            <h3 className="text-sm font-bold text-slate-300">店舗住所</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400">郵便番号</label>
                                    <input 
                                        value={formData.postalCode}
                                        onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                        placeholder="100-0001"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">都道府県</label>
                                    <input 
                                        value={formData.administrativeArea}
                                        onChange={(e) => setFormData({...formData, administrativeArea: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                        placeholder="東京都"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">市区町村・番地</label>
                                    <input 
                                        value={formData.locality}
                                        onChange={(e) => setFormData({...formData, locality: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                        placeholder="千代田区千代田1-1"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">住所ライン2 (ビル名など)</label>
                                    <input 
                                        value={formData.addressLine1}
                                        onChange={(e) => setFormData({...formData, addressLine1: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-2"
                                        placeholder=""
                                    />
                                     <input 
                                        value={formData.addressLine2}
                                        onChange={(e) => setFormData({...formData, addressLine2: e.target.value})}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                                        placeholder=""
                                    />
                                </div>
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
                        <div className="flex justify-between items-center">
                             <h3 className="text-sm font-bold text-slate-300">通常営業時間</h3>
                        </div>
                        
                        <div className="space-y-2">
                            {DAYS.map(day => {
                                const h = hoursState[day];
                                return (
                                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/5 last:border-0 gap-2">
                                        <div className="w-24 text-slate-300 font-medium">{DAY_LABELS[day]}</div>
                                        <div className="flex-1 flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="checkbox" 
                                                    checked={h?.isClosed}
                                                    onChange={(e) => {
                                                        const isClosed = e.target.checked;
                                                        setHoursState(prev => ({
                                                            ...prev,
                                                            [day]: { ...prev[day], isClosed }
                                                        }));
                                                    }}
                                                    className="rounded bg-slate-800 border-slate-600"
                                                />
                                                <span className={`text-sm ${h?.isClosed ? 'text-red-400' : 'text-slate-500'}`}>定休日</span>
                                            </div>
                                            
                                            {!h?.isClosed && (
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={h?.open || '09:00'}
                                                        onChange={(e) => setHoursState(prev => ({
                                                            ...prev,
                                                            [day]: { ...prev[day], open: e.target.value }
                                                        }))}
                                                        className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-aurora-cyan"
                                                    >
                                                        {Array.from({length: 48}).map((_, i) => {
                                                            const hour = Math.floor(i / 2).toString().padStart(2, '0');
                                                            const min = (i % 2 === 0) ? '00' : '30';
                                                            const time = `${hour}:${min}`;
                                                            return <option key={time} value={time}>{time}</option>;
                                                        })}
                                                    </select>
                                                    <span className="text-slate-500">〜</span>
                                                    <select
                                                        value={h?.close || '18:00'}
                                                        onChange={(e) => setHoursState(prev => ({
                                                            ...prev,
                                                            [day]: { ...prev[day], close: e.target.value }
                                                        }))}
                                                        className="bg-slate-800 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-aurora-cyan"
                                                    >
                                                        {Array.from({length: 48}).map((_, i) => {
                                                            const hour = Math.floor(i / 2).toString().padStart(2, '0');
                                                            const min = (i % 2 === 0) ? '00' : '30';
                                                            const time = `${hour}:${min}`;
                                                            return <option key={time} value={time}>{time}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-500 mt-4">※時間は24時間表記で入力してください。</p>
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
