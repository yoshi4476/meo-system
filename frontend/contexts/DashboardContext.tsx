'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_google_connected: boolean;
  store_id?: string;
  store?: {
    id: string;
    name: string;
    google_location_id: string;
  };
};

type DashboardContextType = {
  userInfo: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  syncData: () => Promise<void>;
};

const DashboardContext = createContext<DashboardContextType>({
  userInfo: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
  isDemoMode: false,
  toggleDemoMode: () => {},
  syncData: async () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check for saved demo preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('is_demo_mode');
    if (saved === 'true') {
        setIsDemoMode(true);
    }
  }, []);

  const fetchUser = useCallback(async () => {
    // If in Demo Mode, return mock user immediately
    if (localStorage.getItem('is_demo_mode') === 'true') {
        setUserInfo({
            id: 'demo-user-id',
            name: 'デモ ユーザー',
            email: 'demo@example.com',
            role: 'SUPER_ADMIN',
            is_google_connected: true,
            store_id: 'demo-store-id',
            store: {
                id: 'demo-store-id',
                name: 'MEO Cafe 渋谷店 (Demo)',
                google_location_id: 'locations/demo'
            }
        });
        setIsLoading(false);
        return;
    }

    try {
      setIsLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('meo_auth_token') : null;
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
        setError(null);
      } else {
        console.error('Failed to fetch user:', response.status);
        if (response.status === 401) {
             localStorage.removeItem('meo_auth_token'); 
             window.location.href = '/';
             return;
        }
      }
    } catch (err) {
      console.error('User fetch error:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [isDemoMode]); // Re-run if mode changes

  const syncData = async () => {
      if (isDemoMode) {
          await new Promise(r => setTimeout(r, 2000));
          alert("デモモード: 同期が完了しました（シミュレーション）");
          return;
      }

      if (!userInfo?.store_id) {
          alert("エラー: 店舗IDが見つかりません。店舗を選択してください。");
          return;
      }

      const token = localStorage.getItem('meo_auth_token');
      if (!token) {
          alert("認証トークンが見つかりません。再度ログインしてください。");
          window.location.href = '/';
          return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
          alert("API URLが設定されていません。管理者に連絡してください。");
          console.error("NEXT_PUBLIC_API_URL is not defined");
          return;
      }

      try {
          const requestUrl = `${apiUrl}/sync/${userInfo.store_id}`;
          console.log("Syncing to:", requestUrl);
          
          alert("同期を開始しました...完了まで数秒かかります。");
          
          const res = await fetch(requestUrl, {
              method: 'POST',
              headers: { 
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          
          if (res.ok) {
              const result = await res.json();
              // Check for internal errors in the result object
              const errors = Object.entries(result).filter(([k, v]: [string, any]) => v?.status === 'error');
              
              if (errors.length > 0) {
                  const errorMsg = errors.map(([k, v]: [string, any]) => `${k}: ${v.message}`).join('\n');
                  alert(`一部の同期に失敗しました:\n${errorMsg}`);
              } else {
                  // Construct success message with counts
                  const counts = Object.entries(result).map(([k, v]: [string, any]) => {
                      if (v && typeof v.count === 'number') return `${k}: ${v.count}件`;
                      if (k === 'synced_at') return null;
                      return `${k}: OK`;
                  }).filter(Boolean).join('\n');
                  
                  alert(`Google同期が正常に完了しました！\n\n${counts}\n\nページを更新します。`);
                  window.location.reload(); 
              }
          } else {
              const errorText = await res.text();
              console.error("Sync Failed:", res.status, res.statusText, errorText);
              if (res.status === 401) {
                  alert("セッションが切れました。再度ログインしてください。");
                  window.location.href = '/';
                  return;
              }
              alert(`同期エラー (${res.status}):\n${errorText || res.statusText}\n\nAPI URL: ${apiUrl}`);
          }
      } catch (e: any) {
          console.error("Sync network error:", e);
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
          alert(`通信エラー:\n${e.message}\n\n接続先: ${apiUrl}\n\nバックエンドが起動しているか確認してください。`);
      }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const toggleDemoMode = () => {
    setIsDemoMode(prev => {
      const next = !prev;
      localStorage.setItem('is_demo_mode', String(next));
      if (next) {
         // Entering demo mode
         fetchUser(); // Will pick up mock data
      } else {
         // Exiting demo mode
         setUserInfo(null); // Clear mock data
         window.location.href = '/'; // Redirect to login to be safe or just refresh
      }
      return next;
    });
  };

  return (
    <DashboardContext.Provider value={{ userInfo, isLoading, error, refreshUser: fetchUser, isDemoMode, toggleDemoMode, syncData }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
