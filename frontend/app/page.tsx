'use client';

import { useState, useEffect } from 'react';



export default function Home() {
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // 1. Start progress animation immediately to show activity
    const progressInterval = setInterval(() => {
        setLoadingProgress((prev: number) => {
            if (prev >= 90) return prev; // Hold at 90% until ready
            return prev + 10;
        });
    }, 500);

    // 2. Ping Backend
    const checkSystem = async () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
        try {
            console.log("Pinging system...", apiUrl);
            // Simple fetch to root or lightweight endpoint
            // Set timeout to avoiding hanging forever if network is down
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const res = await fetch(`${apiUrl}/`, { 
                mode: 'cors',
                signal: controller.signal 
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                console.log("System Ready!");
                setIsSystemReady(true);
                setLoadingProgress(100);
                setTimeout(() => setIsWarmingUp(false), 500); // Small delay for smooth transition
            } else {
                console.warn("System responded but not OK", res.status);
                // Even if not 200, it replied, so it's "awake". But maybe error.
                // For now, treat as ready to allow login attempt (which might fail but shows UI)
                setIsSystemReady(true);
                setLoadingProgress(100);
                setIsWarmingUp(false);
            }
        } catch (e) {
            console.error("System connection failed (likely sleeping)", e);
            // Retry logic could go here, but for now let's just show options
            // or keep loading? 
            // Better to show login button anyway after a timeout so user isn't stuck
            setIsSystemReady(true);
            setLoadingProgress(100);
            setIsWarmingUp(false);
        } finally {
            clearInterval(progressInterval);
        }
    };

    checkSystem();

    return () => clearInterval(progressInterval);
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
    </main>
  );
}
