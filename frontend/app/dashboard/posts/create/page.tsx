'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

export default function CreatePostPage() {
  const { userInfo, isDemoMode, refreshUser } = useDashboard();
  const router = useRouter();
  
  // State
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // Platform Selection
  const [platforms, setPlatforms] = useState({
    google: true,
    instagram: false,
    twitter: false,
    youtube: false
  });
  
  // Connection Status (Derived from userInfo)
  const [connections, setConnections] = useState({
    google: false,
    instagram: false,
    twitter: false,
    youtube: false
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // AI Params
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('friendly');

  // Initial Check
  useEffect(() => {
    if (userInfo) {
       // Logic to determine connections. 
       // Currently userInfo.is_google_connected is the main one.
       // For others, we need to check userInfo.social_connections or similar if available.
       // Since the frontend context might not have the full social list yet, we might need to fetch status.
       // For now, we assume simple checks or fetch logic.
       
       checkConnections();
    }
  }, [userInfo]);
  
  const checkConnections = async () => {
    if (isDemoMode) {
        setConnections({google: true, instagram: true, twitter: true, youtube: true});
        return;
    }
    
    // Check Google
    let googleConnected = !!userInfo?.is_google_connected;
    
    // Check others via API
    try {
        const token = localStorage.getItem('meo_auth_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/social/status`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const status = await res.json();
            setConnections({
                google: googleConnected,
                instagram: status.instagram?.connected || false,
                twitter: status.twitter?.connected || false,
                youtube: status.youtube?.connected || false
            });
        } else {
             // Fallback if endpoint fails
             setConnections({google: googleConnected, instagram: false, twitter: false, youtube: false});
        }
    } catch (e) {
        console.error("Failed to check social status", e);
        setConnections({google: googleConnected, instagram: false, twitter: false, youtube: false});
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'VIDEO' : 'PHOTO');

      const reader = new FileReader();
      reader.onload = (ev) => {
        setMediaPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!keywords) return;
    setIsGenerating(true);
    try {
        const token = localStorage.getItem('meo_auth_token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                keywords,
                tone,
                store_id: userInfo?.store_id
            })
        });
        if (res.ok) {
            const data = await res.json();
            setContent(data.content);
        } else {
            alert('AI生成に失敗しました');
        }
    } catch (e) {
        console.error(e);
        alert('エラーが発生しました');
    } finally {
        setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!content) {
        alert('投稿内容を入力してください');
        return;
    }
    
    // Validate selections
    const selectedPlatforms = Object.entries(platforms).filter(([k, v]) => v).map(([k]) => k);
    if (selectedPlatforms.length === 0) {
        alert('投稿先のプラットフォームを少なくとも1つ選択してください');
        return;
    }
    
    if (platforms.youtube && mediaType !== 'VIDEO') {
        alert('YouTube Shortsには動画ファイルが必要です');
        return;
    }

    setIsPosting(true);
    
    try {
        const token = localStorage.getItem('meo_auth_token');
        const formData = new FormData();
        formData.append('store_id', userInfo?.store_id || '');
        formData.append('content', content);
        formData.append('media_type', mediaType);
        formData.append('status', isScheduled ? 'SCHEDULED' : 'PUBLISHED');
        if (isScheduled && scheduledDate) {
            formData.append('scheduled_at', new Date(scheduledDate).toISOString());
        }
        formData.append('target_platforms', JSON.stringify(selectedPlatforms)); // JSON Stringify for list
        
        // Handle Media Upload if needed
        // Since backend expects media_url, we usually upload first.
        // For simplicity here, assuming media upload endpoint exists or handled separately.
        // Let's assume we have a simple media upload or we pass logic.
        // Actually the backend `create_post` expects `media_url` string.
        // So we need to upload first.
        
        let mediaUrl = null;
        if (mediaFile) {
             const uploadData = new FormData();
             uploadData.append('file', mediaFile);
             const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/media/upload`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}` },
                 body: uploadData
             });
             if (uploadRes.ok) {
                 const uploadJson = await uploadRes.json();
                 mediaUrl = uploadJson.url;
             } else {
                 throw new Error('メディアのアップロードに失敗しました');
             }
        }
        
        // Re-construct payload for Post Creation
        // Note: The backend expects JSON body for create_post, not FormData unless changed.
        // Checking `posts.py` -> `create_post(post: PostCreate)` -> expecting JSON.
        
        const payload = {
            store_id: userInfo?.store_id,
            content: content,
            media_url: mediaUrl,
            media_type: mediaType,
            status: isScheduled ? 'SCHEDULED' : 'PUBLISHED',
            scheduled_at: isScheduled ? new Date(scheduledDate).toISOString() : null,
            target_platforms: selectedPlatforms
        };

        const postRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (postRes.ok) {
            alert(isScheduled ? '投稿を予約しました！' : '投稿が完了しました！');
            router.push('/dashboard/posts');
        } else {
            const err = await postRes.text();
            alert(`投稿に失敗しました: ${err}`);
        }

    } catch (e: any) {
        console.error(e);
        alert(`エラー: ${e.message}`);
    } finally {
        setIsPosting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-4xl">✨</span> AI Posting Studio
          </h1>
          <p className="text-slate-400 mt-2">AIを活用して、複数のSNSへ一括投稿</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: Input & AI */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Platform Selection */}
          <section className="glass-card p-6">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-aurora-cyan/20 text-aurora-cyan w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                投稿先を選択
             </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PlatformCheckbox 
                    id="google" 
                    label="Google" 
                    icon={<svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.013-1.133 8.04-3.24 2.053-2.053 2.68-5.2 2.68-7.84 0-.76-.067-1.467-.173-2H12.48z"/></svg>}
                    color="bg-blue-600" 
                    checked={platforms.google} 
                    onChange={c => setPlatforms({...platforms, google: c})}
                    disabled={!connections.google}
                    connected={connections.google}
                />
                <PlatformCheckbox 
                    id="instagram" 
                    label="Instagram" 
                    icon={<svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                    color="bg-gradient-to-br from-pink-500 to-orange-400" 
                    checked={platforms.instagram} 
                    onChange={c => setPlatforms({...platforms, instagram: c})}
                    disabled={!connections.instagram}
                    connected={connections.instagram}
                />
                <PlatformCheckbox 
                    id="twitter" 
                    label="X (Twitter)" 
                    icon={<svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                    color="bg-black" 
                    checked={platforms.twitter} 
                    onChange={c => setPlatforms({...platforms, twitter: c})}
                    disabled={!connections.twitter}
                    connected={connections.twitter}
                />
                <PlatformCheckbox 
                    id="youtube" 
                    label="YouTube" 
                    icon={<svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>}
                    color="bg-red-600" 
                    checked={platforms.youtube} 
                    onChange={c => setPlatforms({...platforms, youtube: c})}
                    disabled={!connections.youtube}
                    connected={connections.youtube}
                />
             </div>
             {!connections.instagram && !connections.twitter && !connections.youtube && (
                 <p className="text-xs text-yellow-400 mt-2">
                    ※ 他のSNSと連携するには <a href="/dashboard/settings" className="underline">設定ページ</a> でアカウントを接続してください。
                 </p>
             )}
          </section>

          {/* 2. Content Creation */}
          <section className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-aurora-cyan/20 text-aurora-cyan w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                コンテンツ作成
             </h3>
            
            {/* AI Generator Input */}
            <div className="bg-slate-800/50 p-4 rounded-xl mb-4 border border-white/5">
                <div className="flex gap-4 mb-3">
                    <input 
                        type="text" 
                        placeholder="キーワードや話題を入力 (例: ランチ, 新メニュー, 季節限定)"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                    />
                    <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none"
                    >
                        <option value="friendly">親しみやすく</option>
                        <option value="formal">フォーマル</option>
                        <option value="professional">専門的</option>
                        <option value="excited">エネルギッシュ</option>
                    </select>
                </div>
                <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !keywords}
                    className="w-full bg-aurora-purple/80 hover:bg-aurora-purple text-white py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                    {isGenerating ? 'AIが生成中...' : '✨ AIで文章を自動生成'}
                </button>
            </div>

            <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="投稿内容を入力してください..."
                className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-aurora-cyan resize-none"
            />
            <div className="text-right text-xs text-slate-400 mt-2">
                {content.length} 文字
                {platforms.twitter && content.length > 140 && <span className="text-yellow-400 ml-2">⚠️ X(Twitter)用にAIが自動要約します</span>}
            </div>
          </section>

          {/* 3. Media Upload */}
          <section className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-aurora-cyan/20 text-aurora-cyan w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                メディア (写真/動画)
             </h3>
             <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-aurora-cyan transition-colors relative bg-slate-800/30">
                <input 
                    type="file" 
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {!mediaPreview ? (
                    <div className="text-slate-400">
                        <div className="text-4xl mb-2">📷</div>
                        <p>ここにファイルをドラッグ＆ドロップ<br/>またはクリックしてアップロード</p>
                        <p className="text-xs mt-2 text-slate-500">JPG, PNG, MP4 (Max 100MB)</p>
                    </div>
                ) : (
                    <div className="relative h-64 flex items-center justify-center">
                        {mediaType === 'VIDEO' ? (
                            <video src={mediaPreview} controls className="max-h-full max-w-full rounded-lg" />
                        ) : (
                            <img src={mediaPreview} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
                        )}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault(); // Prevent file dialog opening
                                setMediaFile(null);
                                setMediaPreview(null);
                            }}
                            className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>
                )}
             </div>
             {platforms.youtube && mediaType !== 'VIDEO' && (
                 <p className="text-red-400 text-xs mt-2">⚠️ YouTube Shortsには動画が必要です</p>
             )}
          </section>
        </div>

        {/* RIGHT COLUMN: Preview & Action */}
        <div className="lg:col-span-1 space-y-6">
            {/* Preview Card */}
            <section className="glass-card p-6 border border-white/5">
                <h3 className="text-white font-bold mb-4">プレビュー</h3>
                <div className="bg-white rounded-xl overflow-hidden shadow-lg text-black">
                    {/* Mock Preview Header */}
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div>
                           <div className="text-xs font-bold text-gray-800">{userInfo?.store?.name || '店舗名'}</div>
                           <div className="text-[10px] text-gray-500">たった今</div>
                        </div>
                    </div>
                    {/* Media */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {mediaPreview ? (
                            mediaType === 'VIDEO' ? <video src={mediaPreview} className="w-full h-full object-cover" /> : <img src={mediaPreview} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-gray-300 text-sm">No Media</div>
                        )}
                    </div>
                    {/* Content */}
                    <div className="p-3">
                        <p className="text-sm text-gray-800 line-clamp-4 whitespace-pre-wrap">
                            {content || 'ここに投稿内容が表示されます...'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Schedule & Post */}
            <section className="glass-card p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                    <input 
                        type="checkbox" 
                        id="scheduleCheck"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-aurora-cyan focus:ring-aurora-cyan"
                    />
                    <label htmlFor="scheduleCheck" className="text-white cursor-pointer select-none">予約投稿する</label>
                </div>
                
                {isScheduled && (
                    <div className="mb-6">
                        <input 
                            type="datetime-local" 
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                    </div>
                )}

                <button 
                    onClick={handlePost}
                    disabled={isPosting || (isScheduled && !scheduledDate)}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-aurora-cyan/20 transition-all ${
                        isPosting 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-aurora-cyan hover:bg-aurora-cyan/80 text-white hover:scale-[1.02]'
                    }`}
                >
                    {isPosting ? '送信中...' : (isScheduled ? '予約する' : '今すぐ投稿')}
                </button>
            </section>
        </div>
      </div>
    </div>
  );
}

interface PlatformCheckboxProps {
    id: string;
    label: string;
    icon: ReactNode;
    color: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled: boolean;
    connected: boolean;
}

function PlatformCheckbox({ id, label, icon, color, checked, onChange, disabled, connected }: PlatformCheckboxProps) {
    return (
        <div 
            onClick={() => !disabled && onChange(!checked)}
            className={`
                relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center select-none group
                ${checked 
                    ? `bg-slate-800 border-${color.replace('bg-', '')} ring-1 ring-${color.replace('bg-', '')}` 
                    : 'bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                }
                ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
            `}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-110 ${color}`}>
                {icon}
            </div>
            <div className="text-sm font-bold text-white">{label}</div>
            
            {!connected && (
                <div className="text-[10px] text-slate-500 bg-slate-950/50 px-2 py-0.5 rounded-full">未連携</div>
            )}
            
            {checked && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-lg shadow-green-500/50">✓</div>
            )}
        </div>
    );
}
