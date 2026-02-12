'use client';

import { useState, useEffect, ReactNode, Suspense } from 'react';
import { useDashboard } from '../../../../contexts/DashboardContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import MediaLibraryModal from '../../../../components/dashboard/MediaLibraryModal';

function CreatePostContent() {
  const { userInfo, isDemoMode, refreshUser } = useDashboard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
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
  const [isHashtagGenerating, setIsHashtagGenerating] = useState(false); // New state
  const [isPosting, setIsPosting] = useState(false);
  
  // AI Params
  const [keywords, setKeywords] = useState('');
  const [isKeywordsLocked, setIsKeywordsLocked] = useState(false); 
  const [tone, setTone] = useState('friendly');
  const [keyArea, setKeyArea] = useState('');
  const [isKeyAreaLocked, setIsKeyAreaLocked] = useState(false); 
  const [charCount, setCharCount] = useState<string>('auto'); // 'auto', '140', '300', '500'
  const [customPrompt, setCustomPrompt] = useState('');

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Platform Preview Tab
  const [previewTab, setPreviewTab] = useState<'google' | 'instagram' | 'twitter'>('google'); // New state

  // Initial Check & Load Locks
  useEffect(() => {
    if (userInfo) {
       checkConnections();
    }

    // Load Locks from LocalStorage
    const savedKeywordsLock = localStorage.getItem('post_keywords_locked') === 'true';
    const savedKeyAreaLock = localStorage.getItem('post_keyarea_locked') === 'true';
    
    setIsKeywordsLocked(savedKeywordsLock);
    setIsKeyAreaLocked(savedKeyAreaLock);

    if (savedKeywordsLock) {
        const savedK = localStorage.getItem('post_keywords_content');
        if (savedK) setKeywords(savedK);
    }
    if (savedKeyAreaLock) {
        const savedA = localStorage.getItem('post_keyarea_content');
        if (savedA) setKeyArea(savedA);
    }

    // Fetch if editing
    if (editId && userInfo) {
        fetchPostData(editId);
    }
  }, [userInfo, editId]);

  const fetchPostData = async (id: string) => {
      if (isDemoMode) return;
      try {
          const token = localStorage.getItem('meo_auth_token');
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/${id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const post = await res.json();
              setContent(post.content || '');
              
              if (post.media_url) {
                  setMediaPreview(post.media_url);
                  setMediaType(post.media_type === 'VIDEO' ? 'VIDEO' : 'PHOTO');
              }
              
              if (post.status === 'SCHEDULED' && post.scheduled_at) {
                  setIsScheduled(true);
                  // Format for datetime-local: YYYY-MM-DDThh:mm
                  const date = new Date(post.scheduled_at);
                  const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                  setScheduledDate(localIso);
              }
              
              if (post.target_platforms && Array.isArray(post.target_platforms)) {
                  const newPlatforms = {
                      google: post.target_platforms.includes('google'),
                      instagram: post.target_platforms.includes('instagram'),
                      twitter: post.target_platforms.includes('twitter'),
                      youtube: post.target_platforms.includes('youtube')
                  };
                  setPlatforms(newPlatforms);
              }
          }
      } catch(e) { console.error(e); }
  };
  
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

  const handleKeywordsLockChange = (locked: boolean) => {
    setIsKeywordsLocked(locked);
    localStorage.setItem('post_keywords_locked', String(locked));
    if (locked) {
        localStorage.setItem('post_keywords_content', keywords);
    }
  };

  const handleKeyAreaLockChange = (locked: boolean) => {
    setIsKeyAreaLocked(locked);
    localStorage.setItem('post_keyarea_locked', String(locked));
    if (locked) {
        localStorage.setItem('post_keyarea_content', keyArea);
    }
  };
  
  // Update storage when content changes IF locked
  const handleKeywordsChange = (val: string) => {
      setKeywords(val);
      if (isKeywordsLocked) {
          localStorage.setItem('post_keywords_content', val);
      }
  };

  const handleKeyAreaChange = (val: string) => {
      setKeyArea(val);
      if (isKeyAreaLocked) {
          localStorage.setItem('post_keyarea_content', val);
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
  const handleSelectLibraryMedia = (url: string, type: 'PHOTO' | 'VIDEO') => {
      setMediaPreview(url);
      setMediaType(type);
      setMediaFile(null); // Clear file input since we are using URL
      setIsMediaModalOpen(false);
  };


  const handleGenerateAI = async () => {
    if (!keywords && !customPrompt) {
        alert('キーワードまたはカスタムプロンプトを入力してください');
        return;
    }
    setIsGenerating(true);
    try {
        const token = localStorage.getItem('meo_auth_token');
        const openaiKey = localStorage.getItem('openai_api_key');
        
        // Prepare charCount logic
        let lengthOpt = 'MEDIUM';
        let charCountValue: number | null = null;
        
        if (charCount === '140' || charCount === '300' || charCount === '500') {
            lengthOpt = 'CUSTOM';
            charCountValue = parseInt(charCount);
        } else {
            lengthOpt = 'MEDIUM'; // Default for auto
        }

        const headers: any = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        if (openaiKey) {
            headers['X-OpenAI-Api-Key'] = openaiKey;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/post`, { // Updated endpoint
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                keywords,
                tone,
                keywords_region: keyArea, 
                length_option: lengthOpt,
                char_count: charCountValue, // Send specific integer
                custom_prompt: customPrompt, // Send custom prompt
                store_id: userInfo?.store_id
            })
        });
        if (res.ok) {
            const data = await res.json();
            setContent(data.content);
        } else {
            alert('AI生成に失敗しました。設定ページでAPIキーが保存されているか確認してください。');
        }
    } catch (e) {
        console.error(e);
        alert('エラーが発生しました');
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGenerateHashtags = async () => {
      if (!keywords && !content) {
          alert("キーワードまたは本文を入力してから実行してください");
          return;
      }
      setIsHashtagGenerating(true);
      try {
          const token = localStorage.getItem('meo_auth_token');
          const openaiKey = localStorage.getItem('openai_api_key');
          
          const headers: any = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          };
          if (openaiKey) {
              headers['X-OpenAI-Api-Key'] = openaiKey;
          }

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generate/hashtags`, {
              method: 'POST',
              headers: headers,
              body: JSON.stringify({
                  keywords: keywords,
                  content: content
              })
          });
          if (res.ok) {
              const data = await res.json();
              if (data.hashtags) {
                  // Append hashtags to content
                  setContent(prev => prev + (prev.endsWith("\n") ? "" : "\n\n") + data.hashtags);
              }
          } else {
             alert('ハッシュタグ生成に失敗しました。APIキーを確認してください。');
          }
      } catch (e) {
          console.error(e);
          alert('ハッシュタグ生成に失敗しました');
      } finally {
          setIsHashtagGenerating(false);
      }
  };

  const handlePost = async (isDraft: boolean = false) => {
    if (!content && !isDraft) {
        alert('投稿内容を入力してください');
        return;
    }
    if (!content && isDraft) {
        // Allow saving draft with just title/keywords if implemented, but here we need content for Post model
        alert('下書きを保存するには本文を入力してください');
        return;
    }
    
    // Validate selections only if not draft
    const selectedPlatforms = Object.entries(platforms).filter(([k, v]) => v).map(([k]) => k);
    if (!isDraft && selectedPlatforms.length === 0) {
        alert('投稿先のプラットフォームを少なくとも1つ選択してください');
        return;
    }
    
    // Check connections for selected platforms if not draft
    if (!isDraft) {
        const unconnected = selectedPlatforms.filter(p => !connections[p as keyof typeof connections]);
        if (unconnected.length > 0) {
            const confirmMsg = `以下のプラットフォームは未連携ですが、投稿を続行しますか？\n(連携されていない場合、投稿は失敗します)\n\n- ${unconnected.join('\n- ')}`;
            if (!confirm(confirmMsg)) {
                return;
            }
        }
        if (platforms.youtube && mediaType !== 'VIDEO') {
            alert('YouTube Shortsには動画ファイルが必要です');
            return;
        }
    }

    setIsPosting(true);
    
    try {
        const token = localStorage.getItem('meo_auth_token');
        
        // Upload Media if needed
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
        } else if (mediaPreview && !mediaPreview.startsWith('data:')) {
            // Existing URL (from library or edit)
            mediaUrl = mediaPreview;
        }
        
        const status = isDraft ? 'DRAFT' : (isScheduled ? 'SCHEDULED' : 'PUBLISHED');

        const payload = {
            store_id: userInfo?.store_id,
            content: content,
            media_url: mediaUrl,
            media_type: mediaType,
            status: status,
            scheduled_at: (status === 'SCHEDULED' || status === 'DRAFT') && scheduledDate ? new Date(scheduledDate).toISOString() : null,
            target_platforms: selectedPlatforms
        };

        const url = editId 
            ? `${process.env.NEXT_PUBLIC_API_URL}/posts/${editId}`
            : `${process.env.NEXT_PUBLIC_API_URL}/posts/`;
            
        const method = editId ? 'PATCH' : 'POST';

        const postRes = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (postRes.ok) {
            const data = await postRes.json();
            if (isDraft) {
                alert('下書きを保存しました');
                router.push('/dashboard/posts');
            } else if (data.status === 'FAILED') {
                alert('投稿に失敗しました。各SNSの連携状態を確認してください。');
            } else if (data.status === 'PARTIAL') {
                alert('一部のプラットフォームへの投稿に失敗しました。');
                router.push('/dashboard/posts');
            } else {
                alert(isScheduled ? '投稿を予約しました！' : '投稿が完了しました！');
                router.push('/dashboard/posts');
            }
        } else {
            const err = await postRes.text();
            alert(`処理に失敗しました: ${err}`);
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
          
           {/* 1. Posting Checklist (Renamed from Platform Selection) */}
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
            <div className="bg-slate-800/50 p-4 rounded-xl mb-4 border border-white/5 space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-slate-400">キーワード</label>
                            <button 
                                onClick={() => handleKeywordsLockChange(!isKeywordsLocked)}
                                className={`text-xs flex items-center gap-1 ${isKeywordsLocked ? 'text-aurora-cyan' : 'text-slate-500'}`}
                            >
                                {isKeywordsLocked ? '🔒 固定中' : '🔓 固定しない'}
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="例: ランチ, 新メニュー"
                            value={keywords}
                            onChange={(e) => handleKeywordsChange(e.target.value)}
                            className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan ${isKeywordsLocked ? 'border-aurora-cyan/30 bg-aurora-cyan/5' : 'border-white/10'}`}
                        />
                    </div>
                    <div className="w-40">
                         <label className="text-xs text-slate-400 mb-1 block">トーン</label>
                         <select 
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none"
                        >
                            <option value="friendly">親しみ</option>
                            <option value="formal">丁寧</option>
                            <option value="professional">専門的</option>
                            <option value="excited">情熱</option>
                        </select>
                    </div>
                </div>
                
                {/* Advanced AI Options */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                         <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-slate-400">地域・エリア</label>
                            <button 
                                onClick={() => handleKeyAreaLockChange(!isKeyAreaLocked)}
                                className={`text-xs flex items-center gap-1 ${isKeyAreaLocked ? 'text-aurora-cyan' : 'text-slate-500'}`}
                            >
                                {isKeyAreaLocked ? '🔒 固定中' : '🔓 固定しない'}
                            </button>
                        </div>
                        <input 
                            type="text" 
                            placeholder="例: 新宿, 大阪梅田" 
                            value={keyArea}
                            onChange={(e) => handleKeyAreaChange(e.target.value)}
                            className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan text-sm ${isKeyAreaLocked ? 'border-aurora-cyan/30 bg-aurora-cyan/5' : 'border-white/10'}`}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">文字数目安</label>
                        <select 
                            value={charCount}
                            onChange={(e) => setCharCount(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none text-sm"
                        >
                            <option value="auto">自動最適化</option>
                            <option value="140">140文字 (X向け)</option>
                            <option value="300">300文字 (標準)</option>
                            <option value="500">500文字 (長文)</option>
                        </select>
                    </div>
                </div>

                {/* Custom Prompt */}
                <div>
                     <label className="text-xs text-slate-400 mb-1 block">カスタムプロンプト (AIへの指示)</label>
                     <textarea 
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="例: 絵文字を多めに使って。ターゲットは20代女性。ハッシュタグを5個つけて。"
                        className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none text-sm h-16 resize-none"
                     />
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
            
            <div className="flex justify-between items-start mt-2">
                <button 
                  onClick={handleGenerateHashtags}
                  disabled={isHashtagGenerating}
                  className="text-xs text-aurora-cyan hover:text-white border border-aurora-cyan/30 hover:border-aurora-cyan/80 bg-aurora-cyan/5 px-3 py-1 rounded-full transition-all flex items-center gap-1"
                >
                  {isHashtagGenerating ? '生成中...' : 'Hashtag AI提案 #'}
                </button>
                <div className="text-right text-xs text-slate-400">
                    {content.length} 文字
                    {platforms.twitter && content.length > 140 && <span className="text-yellow-400 ml-2">⚠️ X(Twitter)用にAIが自動要約します</span>}
                </div>
            </div>
          </section>

          {/* 3. Media Upload */}
          <section className="glass-card p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="bg-aurora-cyan/20 text-aurora-cyan w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                メディア (写真/動画)
             </h3>
             
             <div className="flex justify-end mb-2">
                 <button 
                    onClick={() => {
                        setIsMediaModalOpen(true);
                    }}
                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                 >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    ライブラリから選択
                 </button>
             </div>

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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold">プレビュー</h3>
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button 
                            onClick={() => setPreviewTab('google')} 
                            className={`px-3 py-1 rounded text-xs transition-colors ${previewTab === 'google' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >G</button>
                        <button 
                            onClick={() => setPreviewTab('instagram')} 
                            className={`px-3 py-1 rounded text-xs transition-colors ${previewTab === 'instagram' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                        >IG</button>
                        <button 
                            onClick={() => setPreviewTab('twitter')} 
                            className={`px-3 py-1 rounded text-xs transition-colors ${previewTab === 'twitter' ? 'bg-black text-white border border-white/10' : 'text-slate-400 hover:text-white'}`}
                        >X</button>
                    </div>
                </div>
                
                <div className={`bg-white rounded-xl overflow-hidden shadow-lg text-black ${previewTab === 'twitter' ? 'font-sans' : ''}`}>
                    {/* Mock Preview Header */}
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div>
                           <div className="text-xs font-bold text-gray-800">{userInfo?.store?.name || '店舗名'}</div>
                           <div className="text-[10px] text-gray-500">
                               {previewTab === 'google' && '最新情報'}
                               {previewTab === 'instagram' && 'Instagram'}
                               {previewTab === 'twitter' && '@store_account'}
                           </div>
                        </div>
                    </div>
                    {/* Media */}
                    {(previewTab === 'instagram' || previewTab === 'google') && (
                        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                            {mediaPreview ? (
                                mediaType === 'VIDEO' ? <video src={mediaPreview} className="w-full h-full object-cover" /> : <img src={mediaPreview} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-300 text-sm">No Media</div>
                            )}
                        </div>
                    )}
                    {/* Content */}
                    <div className="p-3">
                        <p className="text-sm text-gray-800 line-clamp-6 whitespace-pre-wrap">
                            {content || 'ここに投稿内容が表示されます...'}
                        </p>
                        {previewTab === 'twitter' && mediaPreview && (
                             <div className="mt-2 rounded-xl overflow-hidden border border-gray-200 aspect-video">
                                {mediaType === 'VIDEO' ? <video src={mediaPreview} className="w-full h-full object-cover" /> : <img src={mediaPreview} className="w-full h-full object-cover" />}
                             </div>
                        )}
                         {previewTab === 'twitter' && content.length > 140 && (
                            <div className="mt-2 text-xs text-red-500 font-bold bg-red-50 p-2 rounded">
                                ※ 140文字を超えています。投稿時に自動でスレッド化または要約されます。
                            </div>
                        )}
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
                            step="1800" // 30 minutes
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            onBlur={(e) => {
                                // Enforce 30-minute blocks on blur
                                if (e.target.value) {
                                    const date = new Date(e.target.value);
                                    const minutes = date.getMinutes();
                                    const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
                                    if (minutes >= 45) date.setHours(date.getHours() + 1);
                                    date.setMinutes(roundedMinutes);
                                    
                                    // Format back to YYYY-MM-DDTHH:mm local
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const mins = String(date.getMinutes()).padStart(2, '0');
                                    setScheduledDate(`${year}-${month}-${day}T${hours}:${mins}`);
                                }
                            }}
                            className="w-full bg-slate-900 border border-white/20 rounded-lg px-4 py-2 text-white"
                        />
                        <p className="text-xs text-slate-400 mt-1">※ 30分単位で指定可能です</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                     <button 
                        onClick={() => handlePost(true)} // isDraft = true
                        disabled={isPosting}
                        className="w-full py-3 rounded-xl font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all border border-white/10"
                    >
                        下書き保存
                    </button>
                    <button 
                        onClick={() => handlePost(false)}
                        disabled={isPosting || (isScheduled && !scheduledDate)}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg shadow-aurora-cyan/20 transition-all ${
                            isPosting 
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                            : 'bg-aurora-cyan hover:bg-aurora-cyan/80 hover:scale-[1.02]'
                        }`}
                    >
                        {isPosting ? '送信中...' : (isScheduled ? '予約する' : '投稿する')}
                    </button>
                </div>
            </section>
        </div>
      </div>
      <MediaLibraryModal 
         isOpen={isMediaModalOpen}
         onClose={() => setIsMediaModalOpen(false)}
         onSelect={handleSelectLibraryMedia}
         storeId={userInfo?.store_id}
      />
    </div>
  );
}

export default function CreatePostPage() {
    return (
        <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading...</div>}>
            <CreatePostContent />
        </Suspense>
    );
}

interface PlatformCheckboxProps {
    id: string;
    label: string;
    icon: ReactNode;
    color: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled: boolean; // Keep prop but verify usage in parent
    connected: boolean;
}

function PlatformCheckbox({ id, label, icon, color, checked, onChange, disabled, connected }: PlatformCheckboxProps) {
    // We ignore 'disabled' prop effectively from the parent logic perspective if we want to allow selection
    // But let's handle the styling.
    
    return (
        <div 
            onClick={() => onChange(!checked)}
            className={`
                relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center select-none group
                ${checked 
                    ? `bg-slate-800 border-${color.replace('bg-', '')} ring-1 ring-${color.replace('bg-', '')}` 
                    : 'bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                }
            `}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-110 ${color} ${!connected ? 'opacity-80' : ''}`}>
                {icon}
            </div>
            <div className="text-sm font-bold text-white">{label}</div>
            
            {!connected && (
                <div className="flex flex-col gap-1 items-center">
                   <div className="text-[10px] text-slate-400 bg-slate-950/50 px-2 py-0.5 rounded-full">未連携</div>
                </div>
            )}
            
            {/* Explicit Checkbox UI */}
            <div className={`
                absolute top-2 right-2 w-6 h-6 rounded-md border flex items-center justify-center transition-all
                ${checked ? 'bg-green-500 border-green-500' : 'bg-slate-800 border-slate-600'}
            `}>
                {checked && <span className="text-white text-sm font-bold">✓</span>}
            </div>
        </div>
    );
}
