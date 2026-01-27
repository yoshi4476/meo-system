'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
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

  const [connectionStatus, setConnectionStatus] = useState({
    google: 'disconnected', // disconnected, connected, error
    openai: 'disconnected'
  });

  // ユーザー情報（本番ではAPIから取得）
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    role: 'STORE_USER' // SUPER_ADMIN, COMPANY_ADMIN, STORE_USER
  });

  const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';

  useEffect(() => {
    // コンポーネントマウント時にローカルストレージからAPIキーを読み込む
    const loadSettings = () => {
      const savedGoogleKey = localStorage.getItem('google_api_key');
      const savedOpenaiKey = localStorage.getItem('openai_api_key');
      const savedUserInfo = localStorage.getItem('user_info');

      if (savedGoogleKey) {
        setApiKeys(prev => ({ ...prev, google: savedGoogleKey }));
        setConnectionStatus(prev => ({ ...prev, google: 'connected' }));
      }
      if (savedOpenaiKey) {
        setApiKeys(prev => ({ ...prev, openai: savedOpenaiKey }));
        setConnectionStatus(prev => ({ ...prev, openai: 'connected' }));
      }
      if (savedUserInfo) {
        try {
          setUserInfo(JSON.parse(savedUserInfo));
        } catch (e) {
          console.error('Failed to parse user info', e);
        }
      } else {
        // デフォルト値
        setUserInfo({
          name: 'ユーザー',
          email: 'user@example.com',
          role: 'SUPER_ADMIN'
        });
      }
    };

    loadSettings();
  }, []);

  const handleSaveApiKey = (type: 'google' | 'openai') => {
    if (type === 'google') {
      if (apiKeys.google) {
        localStorage.setItem('google_api_key', apiKeys.google);
        setConnectionStatus(prev => ({ ...prev, google: 'connected' }));
        alert('Google Business Profile APIキーを保存しました');
      } else {
        localStorage.removeItem('google_api_key');
        setConnectionStatus(prev => ({ ...prev, google: 'disconnected' }));
      }
    } else {
      if (apiKeys.openai) {
        localStorage.setItem('openai_api_key', apiKeys.openai);
        setConnectionStatus(prev => ({ ...prev, openai: 'connected' }));
        alert('OpenAI APIキーを保存しました');
      } else {
        localStorage.removeItem('openai_api_key');
        setConnectionStatus(prev => ({ ...prev, openai: 'disconnected' }));
      }
    }
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
                <div className="text-lg font-bold text-white">15+</div>
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
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">ユーザー名</label>
            <input 
              type="text" 
              value={userInfo.name || ''} 
              onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="ユーザー名を入力"
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">メールアドレス</label>
            <input 
              type="email" 
              value={userInfo.email || ''} 
              onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="メールアドレスを入力"
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">権限ロール</label>
            <select 
              value={userInfo.role}
              onChange={(e) => setUserInfo(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-aurora-cyan"
            >
              <option value="SUPER_ADMIN">最高管理者 (Super Admin)</option>
              <option value="COMPANY_ADMIN">企業管理者 (Company Admin)</option>
              <option value="STORE_USER">店舗ユーザー (Store User)</option>
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={() => {
                localStorage.setItem('user_info', JSON.stringify(userInfo));
                alert('アカウント情報を保存しました');
              }}
              className="px-4 py-2 rounded-lg bg-aurora-cyan hover:bg-aurora-cyan/80 text-white font-medium transition-colors"
            >
              変更を保存
            </button>
          </div>
        </div>
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
                  <p className="text-xs text-slate-400">店舗情報、クチコミ、投稿の同期に必要です</p>
                </div>
              </div>
              {getStatusBadge(connectionStatus.google)}
            </div>
            
            {connectionStatus.google === 'connected' ? (
              <div className="flex gap-2 items-center">
                 <p className="text-sm text-green-400">✓ Googleアカウントと連携済み</p>
                 <button 
                  onClick={() => {
                    localStorage.removeItem('google_api_key'); // Clear legacy if exists
                    setConnectionStatus(prev => ({ ...prev, google: 'disconnected' }));
                  }}
                  className="text-xs text-slate-400 underline hover:text-white ml-4"
                 >
                  連携を解除
                 </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                    // バックエンドのGoogle OAuth URLを開く
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                    window.location.href = `${apiUrl}/google/login?state=user`;
                    // ステータスを更新（実際にはコールバックで行う）
                    setTimeout(() => {
                      setConnectionStatus(prev => ({ ...prev, google: 'connected' }));
                    }, 3000);
                }}
                className="w-full py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Googleでログインして連携
              </button>
            )}
          </div>

          {/* OpenAI API */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">OpenAI API (GPT-4o)</h3>
                  <p className="text-xs text-slate-400">記事生成、返信作成、分析などのAI機能に必要です</p>
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
                onClick={() => handleSaveApiKey('openai')}
                className="px-4 py-2 rounded-lg bg-aurora-purple hover:bg-aurora-purple/80 text-white text-sm font-medium whitespace-nowrap"
              >
                保存
              </button>
            </div>
            {!apiKeys.openai && (
              <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                <span>⚠️</span> APIキーが設定されていないため、AI機能（投稿生成、クチコミ返信など）はモックモードで動作します。
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
                alert(`${email} に招待メールを送信しました`);
              }
            }}
            className="text-sm px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            + 招待
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">SM</div>
              <div>
                <div className="text-sm font-bold text-white">渋谷店 マネージャー</div>
                <div className="text-xs text-slate-400">管理者</div>
              </div>
            </div>
            <span className="text-xs text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">AS</div>
              <div>
                <div className="text-sm font-bold text-white">アルバイト スタッフ</div>
                <div className="text-xs text-slate-400">編集者</div>
              </div>
            </div>
            <span className="text-xs text-slate-400">Last seen 2d ago</span>
          </div>
        </div>
      </section>
    </div>
  );
}
