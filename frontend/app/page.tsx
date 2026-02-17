'use client';

import { useState, useEffect } from 'react';



export default function Home() {
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // 1. Start progress animation
    const progressInterval = setInterval(() => {
        setLoadingProgress((prev: number) => {
            // Slower progress for Cold Start (approx 50s)
            if (prev >= 95) return prev; 
            return prev + 1; // 1% every 500ms = 50 seconds to 100%
        });
    }, 500);

    // 2. Ping Backend Health Check
    const checkSystem = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        let retries = 0;
        const maxRetries = 20; // 20 * 3s = 60s max wait

        const ping = async () => {
             try {
                console.log(`Pinging system health... Attempt ${retries + 1}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                // Use the lightweight /health endpoint if available, else root
                const res = await fetch(`${apiUrl}/health`, { 
                    mode: 'cors',
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    console.log("System Health verified!");
                    setIsSystemReady(true);
                    setLoadingProgress(100);
                    setTimeout(() => setIsWarmingUp(false), 800);
                    return true;
                } else {
                    console.warn(`System responded ${res.status}, but not OK yet.`);
                }
             } catch (e) {
                 console.log("System unreachable (likely sleeping).");
             }
             return false;
        };

        // Retry Loop
        while (retries < maxRetries) {
            const isReady = await ping();
            if (isReady) break;
            
            retries++;
            await new Promise(r => setTimeout(r, 3000)); // Wait 3s between pings
        }
        
        // If still not ready after all retries, show UI anyway to allow manual retry or demo
        if (retries >= maxRetries) {
            console.warn("System warm-up timed out. Showing UI anyway.");
            setIsSystemReady(true);
            setLoadingProgress(100);
            setIsWarmingUp(false);
        }
        
        clearInterval(progressInterval);
    };

    checkSystem();

    return () => clearInterval(progressInterval);
  }, []);

  // Google Config Error Handling
  const [showConfigError, setShowConfigError] = useState(false);

  useEffect(() => {
     // Check URL for error params (e.g. from backend redirect)
     // Use window.location because searchParams might be hydration-sensitive for SSG? 
     // simplified:
     if (typeof window !== 'undefined') {
         const params = new URLSearchParams(window.location.search);
         if (params.get('error') === 'google_config_missing') {
             setShowConfigError(true);
             // Clean URL
             const url = new URL(window.location.href);
             url.searchParams.delete('error');
             window.history.replaceState({}, '', url.toString());
         }
     }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-aurora-purple/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-aurora-cyan/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-white/10 bg-deep-navy/50 backdrop-blur-2xl pb-6 pt-8 lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30 text-black font-bold">
          MEO Mastermind AI
        </p>
      </div>

        <div className="relative z-10 flex flex-col items-center gap-8 mt-20">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-linear-to-r from-white via-cyan-200 to-purple-200 text-glow">
            ビジネスの成長を、<br/>加速させる。
          </h1>
          <p className="text-xl text-center text-slate-300 max-w-2xl">
            AIによる分析と自動最適化で、あなたの店舗をGoogleマップの検索上位へ。
          </p>
        </div>

      <div className="glass p-8 rounded-2xl w-full max-w-md mt-8 flex flex-col gap-6 items-center relative z-50 min-h-[300px] justify-center">
          
          {isWarmingUp ? (
              <div className="flex flex-col items-center gap-4 w-full">
                  <div className="text-aurora-cyan animate-pulse">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">システム起動中...</h2>
                  <p className="text-sm text-slate-400 text-center">
                      クラウドサーバーをスリープから復帰させています。<br/>
                      これには通常30秒〜1分ほどかかります。
                  </p>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2 overflow-hidden">
                      <div className="bg-aurora-cyan h-2.5 rounded-full transition-all duration-500" style={{ width: `${loadingProgress}%` }}></div>
                  </div>
              </div>
          ) : (
             <>
                <h2 className="text-2xl font-semibold mb-2">ようこそ</h2>
                <button 
                    onClick={() => {
                        const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001').replace(/\/$/, '');
                        console.log("Navigating to login:", `${apiUrl}/google/login`);
                        window.location.href = `${apiUrl}/google/login`;
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-3 decoration-none cursor-pointer relative z-50 hover:scale-105 active:scale-95 transition-transform"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.99 19.27 5 15.1 5 10c0-5.1 8.99-9.1 13.95-9.1 2.65 0 4.79.97 6.63 2.64l2.05-2.05C24.47 1.05 19.33 0 13.95 0 6.25 0 0 6.25 0 13.95S6.25 27.9 13.95 27.9c6.98 0 12.91-5.11 12.91-12.91 0-1.29-.15-2.34-.69-3.89z"/></svg>
                    Googleでログイン
                </button>
                
                <button
                    onClick={() => {
                        localStorage.setItem('is_demo_mode', 'true');
                        window.location.href = '/dashboard';
                    }}
                    className="w-full py-3 rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium transition-all relative z-50 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                    <span>🚀</span>
                    デモモードで試す
                </button>
                
                <div className="text-xs text-slate-500">
                    保護された接続経由で安全にログインします<br/>
                    <span className="opacity-30 text-[10px]">API: {process.env.NEXT_PUBLIC_API_URL || 'Local'}</span>
                </div>
             </>
          )}

        </div>
        
        {showConfigError && (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="glass-card max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
                    <button 
                        onClick={() => setShowConfigError(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                    
                    <div className="flex items-center gap-4 mb-6 text-amber-400">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-2xl font-bold">Google API設定が必要です</h2>
                    </div>
                    
                    <div className="space-y-4 text-slate-300">
                        <p>Google Business Profileと連携するには、バックエンドの環境変数にGoogle Cloud Consoleの認証情報を設定する必要があります。</p>
                        
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/10 text-sm font-mono">
                            <p className="text-slate-400 mb-2">.envファイルの設定例:</p>
                            <div className="text-emerald-400">
                                GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com<br/>
                                GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            <a 
                                href="https://console.cloud.google.com/" 
                                target="_blank" 
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg block border border-white/10 transition-colors"
                            >
                                <h3 className="font-bold text-white mb-1">1. プロジェクト作成</h3>
                                <p className="text-xs">Google Cloud ConsoleでAPIプロジェクトを作成します。</p>
                            </a>
                            <a 
                                href="https://console.cloud.google.com/apis/library/mybusinessbusinessinformation.googleapis.com" 
                                target="_blank" 
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-lg block border border-white/10 transition-colors"
                            >
                                <h3 className="font-bold text-white mb-1">2. API有効化</h3>
                                <p className="text-xs">My Business APIを有効化します。</p>
                            </a>
                        </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                        <button 
                            onClick={() => setShowConfigError(false)}
                            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            </div>
        )}
    </main>
  );
}
