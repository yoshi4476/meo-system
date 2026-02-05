'use client';
import { useState, useEffect } from 'react';
import { useDashboard } from '../../../contexts/DashboardContext';

export default function SettingsPage() {
  const { userInfo, refreshUser, isDemoMode } = useDashboard();
  
  const [notifications, setNotifications] = useState({
    reviews: true,
    reports: true,
    recommendations: true,
    competitors: false
  });

  const [apiKeys, setApiKeys] = useState<{google: string, openai: string}>({
    google: '',
    openai: ''
  });

  // Derived state from global userInfo
  const connectionStatus = {
    google: (isDemoMode || userInfo?.is_google_connected) ? 'connected' : 'disconnected',
    openai: (isDemoMode || apiKeys.openai) ? 'connected' : 'disconnected'
  };

  // 店舗選択用
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const isSuperAdmin = userInfo?.role === 'SUPER_ADMIN';

  // 店舗一覧取得 (userInfoが変わったら再取得)
  useEffect(() => {
    if (userInfo?.is_google_connected) {
      fetchGoogleLocations();
    }
  }, [userInfo?.is_google_connected]);

  // 選択済み店舗の反映
  useEffect(() => {
    if (userInfo?.store?.google_location_id) {
       setSelectedLocationId(userInfo.store.google_location_id);
    }
  }, [userInfo?.store]);

  // Google店舗一覧を取得
  const fetchGoogleLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const token = localStorage.getItem('meo_auth_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      
      const response = await fetch(`${apiUrl}/google/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(data.locations || []);
      } else {
        const errorText = await response.text();
        console.error('Locations Fetch error:', response.status, errorText);
        // @ts-ignore
        window._lastDebugError = `Locations Error ${response.status}: ${errorText}`;
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
      // @ts-ignore
      window._lastDebugError = `Locations Exception: ${error.message}`;
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleSaveLocation = async () => {
    if (selectedLocationId) {
      // Find the full location object
      const location = locations.find(loc => loc.name === selectedLocationId);
      if (!location) return;

      try {
        const token = localStorage.getItem('meo_auth_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        
        const response = await fetch(`${apiUrl}/google/locations/select`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            locationId: location.name,
            displayName: location.title, // 'title' from Google API
            storeCode: location.storeCode
          })
        });

        if (response.ok) {
           localStorage.setItem('selected_location_id', selectedLocationId);
           alert('店舗情報をシステムに登録しました！');
           // Reload user info to get the updated store_id
           await refreshUser();
        } else {
           const err = await response.text();
           alert(`保存に失敗しました: ${err}`);
        }
      } catch (error) {
        console.error('Save failed:', error);
        alert('保存中にエラーが発生しました');
      }
    }
  };


  useEffect(() => {
    // コンポーネントマウント時にローカルストレージからAPIキーを読み込む
    const loadSettings = () => {
      if (isDemoMode) {
          setApiKeys({
              google: 'demo-google-key-xxxxx',
              openai: 'demo-openai-key-xxxxx'
          });
          return;
      }

      const savedGoogleKey = localStorage.getItem('google_api_key');
      const savedOpenaiKey = localStorage.getItem('openai_api_key');
      // ... existing logic
      if (savedGoogleKey) setApiKeys(prev => ({ ...prev, google: savedGoogleKey }));
      if (savedOpenaiKey) setApiKeys(prev => ({ ...prev, openai: savedOpenaiKey }));
    };

    loadSettings();
  }, [isDemoMode]);

  const handleSaveApiKeys = () => {
    localStorage.setItem('google_api_key', apiKeys.google);
    localStorage.setItem('openai_api_key', apiKeys.openai);
    alert('APIキーを保存しました');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">接続済み</span>;
      case 'error':
        return <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">エラー</span>;
      default:
        return <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 border border-slate-600">未接続</span>;
    }
  };



  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">設定</h1>
        <p className="text-slate-400 mt-1">アカウント設定、通知、API連携の管理</p>
      </div>

      {/* DEBUG SECTION */}
      {/* DEBUG SECTION - Hidden for Delivery */}
      {/* 
      <section className="glass-card p-4 border border-yellow-500/30 bg-yellow-900/10">
        <h3 className="text-yellow-400 font-bold mb-2">🔧 デバッグ情報</h3>
        <pre className="text-xs text-slate-300 overflow-auto max-h-40 bg-black/50 p-2 rounded">
          {JSON.stringify({
            connectionStatus,
            userInfo,
            token: typeof window !== 'undefined' ? localStorage.getItem('meo_auth_token')?.substring(0, 10) + '...' : '(server)',
            apiUrl: process.env.NEXT_PUBLIC_API_URL,
            // @ts-ignore
            lastError: typeof window !== 'undefined' ? window._lastDebugError : null,
            loginUrl: `${process.env.NEXT_PUBLIC_API_URL || ''}/google/login?state=${userInfo?.id || 'default'}`
          }, null, 2)}
        </pre>
        <div className="flex gap-2 mt-2">
            <button 
               onClick={refreshUser}
               className="text-xs bg-slate-700 px-2 py-1 rounded hover:bg-slate-600"
            >
               最新情報を再取得
            </button>
            <button
               onClick={async () => {
                   if (!userInfo?.id) {
                       alert('Debug: userInfo.id is missing');
                       return;
                   }
                   const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/google/login?state=${userInfo.id}`;
                   console.log("Testing Login URL:", url);
                   try {
                       const res = await fetch(url, { method: 'HEAD' }); // Check if reachable
                       alert(`Link Check: ${res.status} ${res.statusText} \nURL: ${url}`);
                   } catch(e) {
                       alert(`Link Check Error: ${e}`);
                   }
               }}
               className="text-xs bg-blue-900/50 px-2 py-1 rounded hover:bg-blue-800/50"
            >
               リンク診断
            </button>
        </div>
      </section>
      */}

      {/* 管理者専用: API管理セクション */}
      {isSuperAdmin && (
        <section className="glass-card p-6 border-2 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">🔐</span> システム管理（最高管理者専用）
          </h2>
          <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">MEO Mastermind AI API</h3>
                <p className="text-xs text-slate-400 mt-1">バックエンドAPIドキュメント、システム設定、ユーザー管理</p>
              </div>
              <a 
                href={`${process.env.NEXT_PUBLIC_API_URL || ''}/docs`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-sm font-medium transition-colors"
              >
                API管理画面を開く →
              </a>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400">エンドポイント</div>
                <div className="text-lg font-bold text-white">15件</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400">ステータス</div>
                <div className="text-lg font-bold text-green-400">稼働中</div>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400">バージョン</div>
                <div className="text-lg font-bold text-white">1.0.0</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* アカウント情報 */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">👤</span> アカウント情報
        </h2>
        <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;

            if (!currentPassword) {
                alert('変更を保存するには現在のパスワードが必要です');
                return;
            }

            try {
                const token = localStorage.getItem('meo_auth_token');
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/users/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        email,
                        current_password: currentPassword,
                        password: newPassword || undefined
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Failed to update profile');
                }

                alert('プロフィールを更新しました');
                refreshUser();
                (form.elements.namedItem('currentPassword') as HTMLInputElement).value = '';
                (form.elements.namedItem('newPassword') as HTMLInputElement).value = '';
            } catch (error: any) {
                alert(`エラー: ${error.message}`);
            }
        }}>
            <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
                <label className="block text-sm text-slate-400 mb-2">ユーザー名 (ID)</label>
                <input 
                type="text" 
                // @ts-ignore
                value={userInfo?.id || ''} 
                readOnly
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white/50 focus:outline-none cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">※ユーザーIDは変更できません</p>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-2">権限 (Role)</label>
                <input 
                type="text" 
                // @ts-ignore
                value={userInfo?.role || '設定なし'} 
                readOnly
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-aurora-cyan/80 font-mono focus:outline-none cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">※権限の変更は管理者に問い合わせてください</p>
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-2">メールアドレス</label>
                <input 
                type="email" 
                name="email"
                defaultValue={userInfo?.email || ''} 
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                />
            </div>
            </div>
            
            <div className="border-t border-white/5 pt-6 mt-6">
                <h3 className="text-md font-bold text-slate-300 mb-4">セキュリティ設定</h3>
                <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm text-slate-400 mb-2">新しいパスワード (変更する場合のみ)</label>
                        <input 
                        type="password" 
                        name="newPassword"
                        placeholder="変更しない場合は空欄"
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-aurora-cyan mb-2 font-bold">現在のパスワード (必須)</label>
                        <input 
                        type="password" 
                        name="currentPassword"
                        placeholder="設定を変更するには入力してください"
                        required
                        className="w-full bg-slate-900/50 border border-aurora-cyan/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button 
                type="submit"
                className="bg-aurora-cyan/20 text-aurora-cyan border border-aurora-cyan/50 px-6 py-2 rounded-lg hover:bg-aurora-cyan/30 transition-colors font-bold"
                >
                変更を保存
                </button>
            </div>
        </form>
      </section>



      {/* API連携設定 */}
      <section className="glass-card p-6 border border-aurora-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🔌</span> API連携設定
        </h2>
        
        <div className="space-y-6">
          {/* Google Business Profile API */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-2">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Google Business Profile</h3>
                  <p className="text-xs text-slate-400">店舗情報、クチコミ、投稿の同期に必要な設定です</p>
                </div>
              </div>
              {getStatusBadge(connectionStatus.google)}
            </div>
            
            {connectionStatus.google === 'connected' ? (
              <div className="space-y-4">
                 <div className="flex gap-2 items-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <span className="text-green-400 text-xl">✓</span>
                    <p className="text-sm text-green-400 font-bold">Googleアカウントと連携済み</p>
                 </div>
                 
                 {/* 店舗選択セクション */}
                 <div className="mt-4 pt-4 border-t border-white/10">
                   <h4 className="text-white font-bold mb-3">同期する店舗を選択</h4>
                   
                   {isLoadingLocations ? (
                     <div className="text-slate-400 text-sm animate-pulse">店舗情報を取得中...</div>
                   ) : locations.length > 0 ? (
                     <div className="space-y-3">
                       <select 
                         value={selectedLocationId}
                         onChange={(e) => setSelectedLocationId(e.target.value)}
                         className="w-full bg-slate-900 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-cyan"
                       >
                         <option value="">▼ 店舗を選択してください</option>
                         {locations.map((loc: any) => (
                           <option key={loc.name} value={loc.name}>
                             {loc.title} ({loc.storeCode || 'コードなし'})
                           </option>
                         ))}
                       </select>
                       
                       <button 
                         onClick={handleSaveLocation}
                         disabled={!selectedLocationId}
                         className={`w-full py-2 rounded-lg font-bold transition-colors ${selectedLocationId ? 'bg-aurora-cyan hover:bg-aurora-cyan/80 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                       >
                         この店舗を設定する
                       </button>
                     </div>
                   ) : (
                     <div className="text-yellow-400 text-sm">
                       ⚠️ 管理可能な店舗が見つかりませんでした。Googleビジネスプロフィールの権限を確認してください。
                     </div>
                   )}
                 </div>

                 <div className="text-right mt-2">
                   <button 
                    onClick={() => {
                      if(confirm('本当に連携を解除しますか？')) {
                        localStorage.removeItem('meo_auth_token'); // For demo purposes mainly
                        alert('連携解除はバックエンド管理画面から行ってください');
                      }
                    }}
                    className="text-xs text-slate-400 underline hover:text-white"
                   >
                    連携を解除
                   </button>
                 </div>
              </div>
            ) : (
              <button 
                onClick={async () => {
                  let uid = userInfo?.id;
                  
                  if (!uid) {
                    console.log("UserInfo missing, attempting refresh...");
                    // Try to fetch ID directly
                    try {
                        const token = localStorage.getItem('meo_auth_token');
                        if (!token) {
                             alert('セッションが切断されています。ログインし直してください。');
                             window.location.href = '/';
                             return;
                        }

                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
                        const meRes = await fetch(`${apiUrl}/users/me`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        
                        if (meRes.ok) {
                            const me = await meRes.json();
                            uid = me.id;
                            // Update global context too if possible
                        } else if (meRes.status === 401) {
                            alert('認証の有効期限が切れました。再度ログインしてください。');
                            window.location.href = '/';
                            return;
                        } else {
                             console.error("Fetch user failed:", meRes.status);
                        }
                    } catch(e) {
                         console.error("Failed to fetch user info for login redirect", e);
                    }
                  }

                  if (uid) {
                      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                      if (!apiUrl) {
                          alert('システムエラー: APIの接続先(NEXT_PUBLIC_API_URL)が設定されていません。\n開発者にお問い合わせください。');
                          console.error("NEXT_PUBLIC_API_URL is missing");
                          return;
                      }
                      
                      const loginUrl = `${apiUrl}/google/login?state=${uid}`;
                      console.log("Initiating Google Login Redirect:", loginUrl);
                      
                      // ユーザーにフィードバック
                      const btn = document.activeElement as HTMLElement;
                      if(btn) btn.innerText = "連携ページへ移動中...";
                      
                      window.location.href = loginUrl;
                  } else {
                      alert('ユーザー情報を取得できませんでした。\nネットワーク接続を確認するか、一度ログアウトして再ログインしてください。');
                  }
                }}
                className="w-full py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Googleでログインして連携
              </button>
            )}
          </div>

          {/* OpenAI API Key */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white whitespace-nowrap">OpenAI API (GPT-4o)</h3>
                  <p className="text-xs text-slate-400 whitespace-nowrap">最新のAIモデルによる自動生成機能</p>
                </div>
              </div>
              {getStatusBadge(connectionStatus.openai)}
            </div>
            
            <div className="flex gap-2">
              <input 
                type="password" 
                placeholder="sk-...で始まるAPI Keyを入力してください" 
                value={apiKeys.openai}
                onChange={(e) => setApiKeys(prev => ({...prev, openai: e.target.value}))}
                className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-aurora-cyan"
              />
              <button 
                onClick={handleSaveApiKeys}
                className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white text-sm font-medium whitespace-nowrap"
              >
                保存
              </button>
              <button 
                onClick={async () => {
                  const key = apiKeys.openai || localStorage.getItem('openai_api_key');
                  if (!key) {
                    alert('❌ APIキーが入力されていません');
                    return;
                  }
                  try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/debug`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('meo_auth_token')}`,
                        'X-OpenAI-Api-Key': key
                      }
                    });
                    const data = await res.json();
                    if (data.openai_connection === 'success') {
                      alert(`✅ 接続成功！\n\nテスト応答: ${data.test_response}`);
                    } else if (data.openai_connection === 'failed') {
                      alert(`❌ 接続失敗\n\nエラー: ${data.openai_error}`);
                    } else {
                      alert(`⚠️ キーが届いていません\n\n詳細: ${JSON.stringify(data)}`);
                    }
                  } catch (e: any) {
                    alert(`❌ テストエラー: ${e.message}`);
                  }
                }}
                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium whitespace-nowrap"
              >
                🔌 テスト
              </button>
            </div>
            {!apiKeys.openai && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <span>⚠️</span> APIキーが設定されていない場合、環境変数またはモックモードで動作します。
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 通知設定 */}
      <section className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-2xl">🔔</span> 通知設定
        </h2>
        <div className="space-y-4">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <div className="font-medium text-white">
                  {key === 'reviews' && '新しいクチコミ'}
                  {key === 'reports' && '週次レポート'}
                  {key === 'recommendations' && 'AI推奨アクション'}
                  {key === 'competitors' && '競合のアラート'}
                </div>
                <div className="text-xs text-slate-400">
                  {key === 'reviews' && '新しいクチコミが投稿された時に通知します'}
                  {key === 'reports' && '毎週月曜日にパフォーマンスレポートを送信します'}
                  {key === 'recommendations' && '改善のチャンスが見つかった時に通知します'}
                  {key === 'competitors' && '競合店舗に大きな動きがあった時に通知します'}
                </div>
              </div>
              <div 
                onClick={() => setNotifications(prev => ({...prev, [key]: !value}))}
                className={`w-12 h-7 rounded-full ${value ? 'bg-aurora-cyan' : 'bg-slate-600'} relative cursor-pointer transition-colors`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${value ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* チームメンバー */}
      <section className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👥</span> チームメンバー
          </h2>
          <button 
            onClick={() => {
              const email = prompt('招待するメールアドレスを入力してください:');
              if (email) {
                // TODO: Implement invitation logic
                alert(`${email} に招待メールを送信しました (モック)`);
              }
            }}
            className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            + 招待
          </button>
        </div>
        <div className="space-y-3">
            {/* Real Data Integration */}
            <TeamList />
        </div>
      </section>
    </div>
  );
}

function TeamList() {
    const { userInfo, isDemoMode } = useDashboard();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const isSuperAdmin = userInfo?.role === 'SUPER_ADMIN';

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('meo_auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
            
            // If Super Admin, use the admin endpoint to see ALL users properly (or just stick to /users/ with improved scope)
            // The /users/ endpoint now handles scoping, so it should be fine.
            const res = await fetch(`${apiUrl}/users/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error("Failed to load team", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDemoMode) {
            setUsers([
                { id: '1', email: 'owner@example.com', role: 'COMPANY_ADMIN', is_active: true },
                { id: '2', email: 'staff@example.com', role: 'STORE_USER', is_active: true },
                { id: '3', email: 'manager@example.com', role: 'STORE_USER', is_active: true }
            ]);
            setLoading(false);
            return;
        }

        if (userInfo) {
             fetchUsers();
        }
    }, [userInfo, isDemoMode]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`ユーザーの権限を ${newRole} に変更しますか？`)) return;

        try {
            const token = localStorage.getItem('meo_auth_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
            const res = await fetch(`${apiUrl}/admin/users/${userId}/role?role=${newRole}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                alert('権限を変更しました');
                fetchUsers(); // Reload list
            } else {
                const err = await res.text();
                alert(`変更に失敗しました: ${err}`);
            }
        } catch (e) {
            alert(`エラーが発生しました: ${e}`);
        }
    };

    if (loading) return <div className="text-slate-500 text-sm">読み込み中...</div>;

    if (users.length === 0) return <div className="text-slate-500 text-sm">メンバーのみ表示されます</div>;

    return (
        <div className="space-y-2">
            {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">
                        {u.email.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white max-w-[150px] sm:max-w-xs truncate" title={u.email}>{u.email}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                            {isSuperAdmin && u.id !== userInfo?.id ? (
                                <select 
                                    value={u.role}
                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded text-xs px-1 py-0.5 text-aurora-cyan focus:outline-none"
                                >
                                    <option value="STORE_USER">STORE_USER</option>
                                    <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                            ) : (
                                <span>{u.role}</span>
                            )}
                        </div>
                    </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            ))}
        </div>
    );
}
