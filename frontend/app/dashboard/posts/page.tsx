'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SmartphonePreview } from '../../../components/dashboard/SmartphonePreview';
import { ImageSelector } from '../../../components/dashboard/ImageSelector';

type Post = {
    id: string;
    content: string;
    media_url?: string;
    status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
    scheduled_at?: string;
    created_at: string;
};

// 過去にアップロードした画像のモックデータ (Demo Mode / Fallback)
const demoImages = [
  { id: 1, name: 'ランチプレート.jpg', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80', date: '2026-01-15' },
  { id: 2, name: '店内写真.jpg', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80', date: '2026-01-10' },
  { id: 3, name: '外観.jpg', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80', date: '2026-01-05' },
  { id: 4, name: 'スタッフ.jpg', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=500&q=80', date: '2025-12-20' },
  { id: 5, name: 'ディナーコース.jpg', url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=500&q=80', date: '2025-12-15' },
];

export default function PostsPage() {
    const { userInfo, isDemoMode } = useDashboard();
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // AI Studio State
    const [postType, setPostType] = useState<'update' | 'event' | 'offer'>('update');
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [prompt, setPrompt] = useState('');
    const [mood, setMood] = useState('プロフェッショナル');
    const [charCount, setCharCount] = useState(300);
    const [keywordsRegion, setKeywordsRegion] = useState('');
    
    // Prompt Locking
    const [lockedPrompt, setLockedPrompt] = useState('');
    const [isPromptLocked, setIsPromptLocked] = useState(false);
    
    // Field Locking (Local Storage)
    const [isKeywordsLocked, setIsKeywordsLocked] = useState(false);
    const [isRegionLocked, setIsRegionLocked] = useState(false);

    // Image Selector
    const [showImageSelector, setShowImageSelector] = useState(false);
    
    // Restoring missing state from previous error
    const [couponCode, setCouponCode] = useState('');
    const [offerTerms, setOfferTerms] = useState('');
    
    // Editor State
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostMedia, setNewPostMedia] = useState('');
    const [showImageGallery, setShowImageGallery] = useState(false);
    
    // Schedule State
    const [scheduleEnabled, setScheduleEnabled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('12:00');
    
    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    
    // API Key Settings
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [hasApiKey, setHasApiKey] = useState(false);

    const fetchPosts = async () => {
        setIsLoading(true);
        if (isDemoMode) {
             setPosts([
                 { id: '1', content: '【3月の限定メニュー🌸】\n桜と抹茶のモンブランが新登場！\n春の訪れを感じる一品をぜひお楽しみください。\n#カフェ #春スイーツ #抹茶', status: 'PUBLISHED', created_at: new Date().toISOString(), media_url: demoImages[0].url },
                 { id: '2', content: 'GW期間中の営業時間について📅\n4/29〜5/5は休まず営業いたします。\n通常通り9:00〜20:00でお待ちしております。', status: 'SCHEDULED', scheduled_at: '2025-04-20T09:00:00', created_at: new Date(Date.now() - 86400000).toISOString() },
                 { id: '3', content: '【スタッフ募集中】\n私たちと一緒に働きませんか？\n未経験者大歓迎！詳細はプロフィールのリンクから。', status: 'PUBLISHED', created_at: new Date(Date.now() - 259200000).toISOString(), media_url: demoImages[3].url },
                 { id: '4', content: '夏の新作ドリンク試作中...🍹\nお楽しみに！', status: 'DRAFT', created_at: new Date(Date.now() - 604800000).toISOString() },
                 { id: '5', content: '雨の日限定クーポン☔\n「インスタ見た」でトッピング無料！\n足元にお気をつけてお越しください。', status: 'PUBLISHED', created_at: new Date(Date.now() - 1209600000).toISOString(), media_url: demoImages[2].url },
             ]);
             setIsLoading(false);
             return;
        }

        try {
            const token = localStorage.getItem('meo_auth_token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/?store_id=${userInfo?.store_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
        
        // Fetch Locked Prompt
        const fetchPrompt = async () => {
            if (isDemoMode) {
                // Demo
                return;
            }
            try {
                const token = localStorage.getItem('meo_auth_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/prompts?category=POST_GENERATION`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if(res.ok) {
                    const prompts = await res.json();
                    if (prompts.length > 0) {
                        setPrompt(prompts[0].content);
                        setLockedPrompt(prompts[0].content);
                        setIsPromptLocked(prompts[0].is_locked);
                    }
                }
            } catch(e) { console.error(e); }
        };
        fetchPrompt();
    }, [userInfo, isDemoMode]);

    const handleToggleLock = async () => {
        const newLockedState = !isPromptLocked;
        setIsPromptLocked(newLockedState);
        
        if (isDemoMode) {
             alert(newLockedState ? "プロンプトを固定しました (デモ)" : "プロンプトの固定を解除しました");
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
                    title: "Locked Post Prompt",
                    content: prompt,
                    category: "POST_GENERATION",
                    is_locked: newLockedState
                })
            });
            if (newLockedState) setLockedPrompt(prompt);
        } catch(e) {
            console.error(e);
            alert("保存に失敗しました");
            setIsPromptLocked(!newLockedState); // Revert
        }
    };

    // Load Local Locks and API Key
    useEffect(() => {
        const savedKeywordsLock = localStorage.getItem('post_keywords_locked') === 'true';
        const savedRegionLock = localStorage.getItem('post_region_locked') === 'true';
        setIsKeywordsLocked(savedKeywordsLock);
        setIsRegionLocked(savedRegionLock);

        if(savedKeywordsLock) {
            const savedK = localStorage.getItem('post_keywords_content');
            if(savedK) setKeywords(savedK);
        }
        if(savedRegionLock) {
            const savedR = localStorage.getItem('post_region_content');
            if(savedR) setKeywordsRegion(savedR);
        }
        
        // Load API Key
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            setApiKey(savedApiKey);
            setHasApiKey(true);
        }
    }, []);

    const handleKeywordsLockChange = (value: string) => {
        const isLocked = value === 'locked';
        setIsKeywordsLocked(isLocked);
        localStorage.setItem('post_keywords_locked', String(isLocked));
        if (isLocked) {
            localStorage.setItem('post_keywords_content', keywords);
        }
    };

    const handleRegionLockChange = (value: string) => {
        const isLocked = value === 'locked';
        setIsRegionLocked(isLocked);
        localStorage.setItem('post_region_locked', String(isLocked));
        if (isLocked) {
            localStorage.setItem('post_region_content', keywordsRegion);
        }
    };
    
    const handleSaveApiKey = () => {
        if (apiKey.trim()) {
            localStorage.setItem('gemini_api_key', apiKey.trim());
            setHasApiKey(true);
            setShowApiKeyModal(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        
        if (isDemoMode) {
            await new Promise(r => setTimeout(r, 1500));
            // Demo Generation based on inputs
            let content = "";
            const storeName = "MEO Cafe 渋谷店";
            
            const regionStr = keywordsRegion ? `(${keywordsRegion}エリア)` : "";
            
            if (postType === 'offer') {
                content = `【限定特典】${topic || '特別クーポン配布中！'}\n\n${storeName}${regionStr}から皆様へプレゼント🎁\n\n${keywords.split(',').map(k => `#${k.trim()}`).join(' ')}\n\n${couponCode ? `クーポンコード: ${couponCode}\n` : ''}${offerTerms ? `利用条件: ${offerTerms}\n` : ''}\n皆様のご来店をお待ちしております！`;
            } else {
                content = `【${mood}な${postType === 'event' ? 'イベント' : 'お知らせ'}】\n${topic || '季節のご挨拶'}\n\nいつも${storeName}をご利用ありがとうございます。\n${keywords.split(',').map(k => `#${k.trim()}`).join(' ')}\n\n${prompt ? `(${prompt}を反映)\n` : ''}ぜひお立ち寄りください！`;
            }
            setNewPostContent(content);
            setIsGenerating(false);
            return;
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/post`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    Authorization: `Bearer ${localStorage.getItem('meo_auth_token')}`,
                    'X-Gemini-Api-Key': localStorage.getItem('gemini_api_key') || ''
                },
                body: JSON.stringify({ 
                    keywords: keywords || topic, 
                    length_option: 'MEDIUM', // Use char_count effectively
                    char_count: charCount,
                    tone: mood === 'プロフェッショナル' ? 'professional' : 'friendly',
                    keywords_region: keywordsRegion,
                    custom_prompt: prompt
                })
            });
            if(res.ok) {
                const data = await res.json();
                setNewPostContent(data.content);
            } else {
                // Determine error message
                const errText = await res.text();
                let errMsg = `生成に失敗しました (Status: ${res.status})`;
                try {
                    const errJson = JSON.parse(errText);
                    if(errJson.detail) errMsg += `\n${errJson.detail}`;
                } catch(e) {
                    errMsg += `\n${errText.substring(0, 100)}`;
                }
                alert(errMsg);
            }
        } catch(e) { 
            console.error(e); 
            alert(`ネットワークエラーまたはサーバーエラー:\n${e}`); 
        }
        finally { setIsGenerating(false); }
    };

    const handleSavePost = async (status: 'DRAFT' | 'PUBLISHED') => {
        if (isDemoMode) {
            alert(`デモモード: 投稿を${status === 'PUBLISHED' ? '公開' : '保存'}しました！\n(仮想データとしてリストに追加されます)`);
            const newPost: Post = {
                id: `demo-new-${Date.now()}`,
                content: newPostContent,
                media_url: newPostMedia,
                status: status,
                created_at: new Date().toISOString(),
                scheduled_at: scheduleEnabled ? `${scheduleDate}T${scheduleTime}:00` : undefined
            };
            setPosts([newPost, ...posts]);
            setIsCreating(false);
            // Reset form
            setNewPostContent('');
            setTopic('');
            return;
        }

        try {
            const endpoint = status === 'PUBLISHED' && !scheduleEnabled ? '/posts/publish' : '/posts/';
            // For now standard create api
             const token = localStorage.getItem('meo_auth_token');
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    store_id: userInfo?.store_id,
                    content: newPostContent,
                    media_url: newPostMedia || undefined,
                    status: scheduleEnabled ? 'SCHEDULED' : status,
                    scheduled_at: scheduleEnabled ? `${scheduleDate}T${scheduleTime}:00` : undefined
                })
            });
            
            if (res.ok) {
                alert('保存しました');
                setNewPostContent('');
                setIsCreating(false);
                fetchPosts();
            } else {
                alert('保存に失敗しました');
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    };

    return (
        <div className="space-y-6">
            {!isCreating ? (
                // リスト表示モード
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white">投稿管理</h1>
                            <p className="text-slate-400 mt-1">AIを活用して魅力的な記事を作成・管理します</p>
                        </div>
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="bg-aurora-cyan text-deep-navy font-bold px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
                        >
                            + 新規投稿を作成
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            <div className="text-slate-400 text-center py-8">読み込み中...</div>
                        ) : posts.length === 0 ? (
                            <div className="text-slate-500 text-center py-8 glass-card">投稿履歴はありません</div>
                        ) : (
                            posts.map(post => (
                                <div key={post.id} className="glass-card p-6 flex flex-col md:flex-row gap-6 hover:bg-white/5 transition-colors">
                                    <div className="w-full md:w-48 h-32 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                                        {post.media_url ? (
                                            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                post.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 
                                                post.status === 'SCHEDULED' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-700 text-slate-300'
                                            }`}>
                                                {post.status === 'PUBLISHED' ? '公開済み' : post.status === 'SCHEDULED' ? '予約済み' : '下書き'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                作成: {format(new Date(post.created_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                            </span>
                                            {post.scheduled_at && (
                                                <span className="text-xs text-blue-400 flex items-center gap-1">
                                                    📅 予約: {format(new Date(post.scheduled_at), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-200 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                                        <div className="flex gap-2">
                                            <button className="text-sm text-slate-400 hover:text-white">編集</button>
                                            <button className="text-sm text-slate-400 hover:text-white">複製</button>
                                            <button className="text-sm text-red-400 hover:text-red-300">削除</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                // 作成モード (AI Studio Integrated)
                <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
                    <div className="flex-1 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="text-aurora-purple">✨</span> AI投稿スタジオ
                            </h2>
                            <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                                キャンセル
                            </button>
                        </div>

                        <div className="glass-card p-6 space-y-6">
                            {/* Type Selection */}
                             <div className="grid grid-cols-3 gap-3">
                              {['update', 'event', 'offer'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setPostType(t as any)}
                                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${postType === t ? 'bg-aurora-cyan text-white ring-2 ring-aurora-cyan/50' : 'bg-slate-800 text-slate-400'}`}
                                >
                                    {t === 'update' ? '📰 最新情報' : t === 'event' ? '🎉 イベント' : '🏷️ 特典'}
                                </button>
                              ))}
                            </div>

                            {/* Inputs */}
                             <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-300 block mb-1">トピック</label>
                                    <input 
                                        value={topic} onChange={e => setTopic(e.target.value)}
                                        placeholder="例: 夏のランチメニュー開始"
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-medium text-slate-300">キーワード</label>
                                            <select
                                                value={isKeywordsLocked ? 'locked' : 'unlocked'}
                                                onChange={(e) => handleKeywordsLockChange(e.target.value)}
                                                className="text-xs bg-slate-800 border border-white/10 rounded px-2 py-1 text-slate-300"
                                            >
                                                <option value="unlocked">🔓 固定しない</option>
                                                <option value="locked">🔒 固定する</option>
                                            </select>
                                        </div>
                                        <input 
                                            value={keywords} onChange={e => setKeywords(e.target.value)}
                                            placeholder="例: 渋谷, カフェ, ランチ"
                                            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white ${isKeywordsLocked ? 'border-aurora-cyan/30 ring-1 ring-aurora-cyan/20' : 'border-white/10'}`}
                                        />
                                        {isKeywordsLocked && <p className="text-xs text-aurora-cyan mt-1">✓ 固定中: 次回も使用されます</p>}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-medium text-slate-300">キーワード地域</label>
                                            <select
                                                value={isRegionLocked ? 'locked' : 'unlocked'}
                                                onChange={(e) => handleRegionLockChange(e.target.value)}
                                                className="text-xs bg-slate-800 border border-white/10 rounded px-2 py-1 text-slate-300"
                                            >
                                                <option value="unlocked">🔓 固定しない</option>
                                                <option value="locked">🔒 固定する</option>
                                            </select>
                                        </div>
                                        <input 
                                            value={keywordsRegion} onChange={e => setKeywordsRegion(e.target.value)}
                                            placeholder="例: 東京都渋谷区"
                                            className={`w-full bg-slate-900/50 border rounded-lg px-4 py-3 text-white ${isRegionLocked ? 'border-aurora-cyan/30 ring-1 ring-aurora-cyan/20' : 'border-white/10'}`}
                                        />
                                        {isRegionLocked && <p className="text-xs text-aurora-cyan mt-1">✓ 固定中: 次回も使用されます</p>}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 block mb-1">トーン</label>
                                        <select 
                                            value={mood} onChange={e => setMood(e.target.value)}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white"
                                        >
                                            <option>プロフェッショナル</option>
                                            <option>フレンドリー</option>
                                            <option>エキサイティング</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-300 block mb-1">文字数目安</label>
                                        <select 
                                            value={charCount} onChange={e => setCharCount(Number(e.target.value))}
                                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white"
                                        >
                                            <option value={150}>短め (150文字)</option>
                                            <option value={300}>標準 (300文字)</option>
                                            <option value={600}>長め (600文字)</option>
                                            <option value={1000}>詳細 (1000文字)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-medium text-slate-300">プロンプト (自由指示)</label>
                                        <button 
                                            onClick={handleToggleLock}
                                            className={`text-xs flex items-center gap-1 ${isPromptLocked ? 'text-aurora-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                                            title={isPromptLocked ? "固定中: 次回もこのプロンプトが使用されます" : "クリックして固定"}
                                        >
                                            {isPromptLocked ? '🔒 固定中' : '🔓 固定する'}
                                        </button>
                                    </div>
                                    <textarea 
                                        value={prompt} onChange={e => setPrompt(e.target.value)}
                                        placeholder="例: 絵文字を多めに使って、親しみやすい感じで。"
                                        className={`w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white h-24 ${isPromptLocked ? 'ring-1 ring-aurora-cyan/30' : ''}`}
                                    />
                                </div>
                            </div>
                            
                            {/* API Key Status & Generate Button */}
                            <div className="space-y-3">
                                {!isDemoMode && (
                                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className={hasApiKey ? 'text-green-400' : 'text-yellow-400'}>
                                                {hasApiKey ? '✓' : '⚠'}
                                            </span>
                                            <span className="text-sm text-slate-300">
                                                {hasApiKey ? 'Google AI Studio APIキー設定済み' : 'APIキーが未設定です'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowApiKeyModal(true)}
                                            className="text-xs px-3 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                                        >
                                            {hasApiKey ? '変更' : '設定'}
                                        </button>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || (!isDemoMode && !hasApiKey)}
                                    className="w-full py-3 bg-linear-to-r from-aurora-purple to-pink-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? 'AIが生成中...' : '✨ AIで文章を生成'}
                                </button>
                                {!isDemoMode && !hasApiKey && (
                                    <p className="text-xs text-yellow-400 text-center">AI生成にはGoogle AI StudioのAPIキーが必要です</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Editor */}
                         <div className="glass-card p-6 space-y-4">
                            <h3 className="font-bold text-white">投稿内容</h3>
                            <textarea 
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-lg p-4 text-white"
                                placeholder="AI生成または手動で入力..."
                            />
                            
                            {/* Image Selection */}
                            <div>
                                <label className="text-sm font-medium text-slate-300 block mb-2">画像</label>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowImageSelector(true)}
                                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded border border-white/10 hover:bg-slate-700 transition-colors"
                                    >
                                        📷 画像を選択...
                                    </button>
                                    <input 
                                        type="text" 
                                        value={newPostMedia} 
                                        onChange={e => setNewPostMedia(e.target.value)}
                                        placeholder="または画像URLを直接入力"
                                        className="flex-1 bg-slate-900/50 border border-white/10 rounded px-3 text-white text-sm"
                                    />
                                </div>
                                {newPostMedia && (
                                    <div className="mt-2 w-full h-48 rounded-lg bg-slate-800 overflow-hidden relative border border-white/10 group">
                                        <img src={newPostMedia} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setNewPostMedia('')} 
                                            className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            {showImageSelector && (
                                <ImageSelector 
                                    onSelect={(url) => {
                                        setNewPostMedia(url);
                                        setShowImageSelector(false);
                                    }}
                                    onClose={() => setShowImageSelector(false)}
                                />
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={scheduleEnabled} 
                                        onChange={e => setScheduleEnabled(e.target.checked)} 
                                        className="w-4 h-4 rounded border-slate-600"
                                    />
                                    <span className="text-slate-300 text-sm">予約投稿する</span>
                                </label>
                                {scheduleEnabled && (
                                    <div className="flex gap-2 items-center">
                                       {/* Changed icons to be visible: using css-built-in color-scheme or simple filters not easy on input[type=date]. 
                                           Best way for raw HTML inputs is `color-scheme: dark`. */}
                                        <input 
                                            type="date" 
                                            value={scheduleDate} 
                                            onChange={e=>setScheduleDate(e.target.value)} 
                                            className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-sm scheme-dark" 
                                        />
                                        <input 
                                            type="time" 
                                            value={scheduleTime} 
                                            onChange={e=>setScheduleTime(e.target.value)} 
                                            className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-white text-sm scheme-dark" 
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 py-3 text-slate-400 hover:text-white" onClick={() => setIsCreating(false)}>キャンセル</button>
                                <button className="flex-1 py-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20" onClick={() => handleSavePost('DRAFT')}>下書き保存</button>
                                <button className="flex-1 py-3 bg-aurora-cyan text-deep-navy font-bold rounded-lg hover:bg-cyan-400" onClick={() => handleSavePost('PUBLISHED')}>
                                    {scheduleEnabled ? '予約する' : '投稿する'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview (Sticky) */}
                    <div className="hidden lg:block w-[380px]">
                        <div className="sticky top-6">
                            <h3 className="text-white font-bold mb-4 text-center">プレビュー</h3>
                            <div className="glass p-6 rounded-2xl bg-white/5">
                                <SmartphonePreview 
                                    content={newPostContent} 
                                    image={newPostMedia || (demoImages[0].url)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Gallery Modal */}
                    {showImageGallery && (
                         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                             <div className="bg-slate-900 p-6 rounded-xl max-w-2xl w-full">
                                 <h3 className="text-xl font-bold text-white mb-4">画像を選択</h3>
                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                     {demoImages.map(img => (
                                         <div key={img.id} onClick={() => { setNewPostMedia(img.url); setShowImageGallery(false); }} className="aspect-square bg-slate-800 rounded cursor-pointer hover:ring-2 hover:ring-aurora-cyan overflow-hidden">
                                             <img src={img.url} className="w-full h-full object-cover" />
                                         </div>
                                     ))}
                                 </div>
                                 <button onClick={() => setShowImageGallery(false)} className="mt-6 w-full py-2 bg-slate-800 text-white rounded">閉じる</button>
                             </div>
                         </div>
                    )}
                    
                    {/* API Key Modal */}
                    {showApiKeyModal && (
                        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 p-6 rounded-xl max-w-md w-full space-y-4">
                                <h3 className="text-xl font-bold text-white">🔑 Google AI Studio APIキー設定</h3>
                                <p className="text-sm text-slate-400">
                                    AI文章生成にはGoogle AI StudioのAPIキーが必要です。<br/>
                                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-aurora-cyan hover:underline">
                                        ここから無料で取得 →
                                    </a>
                                </p>
                                <input 
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="APIキーを入力..."
                                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white"
                                />
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowApiKeyModal(false)} 
                                        className="flex-1 py-2 text-slate-400 hover:text-white"
                                    >
                                        キャンセル
                                    </button>
                                    <button 
                                        onClick={handleSaveApiKey}
                                        disabled={!apiKey.trim()}
                                        className="flex-1 py-2 bg-aurora-cyan text-deep-navy font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50"
                                    >
                                        保存
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
