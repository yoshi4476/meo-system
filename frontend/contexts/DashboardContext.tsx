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
             // localStorage.removeItem('meo_auth_token'); 
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

      try {
          const token = localStorage.getItem('meo_auth_token');
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
          
          alert("同期を開始しました...完了まで数秒かかります。");
          
          const res = await fetch(`${apiUrl}/sync/${userInfo.store_id}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
              const result = await res.json();
              // Check for internal errors in the result object
              const errors = Object.entries(result).filter(([k, v]: [string, any]) => v?.status === 'error');
              
              if (errors.length > 0) {
                  const errorMsg = errors.map(([k, v]: [string, any]) => `${k}: ${v.message}`).join('\n');
                  alert(`一部の同期に失敗しました:\n${errorMsg}`);
              } else {
                  alert("Google同期が正常に完了しました！ページを更新します。");
                  window.location.reload(); 
              }
          } else {
              alert(`同期リクエストに失敗しました (Status: ${res.status})`);
          }
      } catch (e) {
          console.error(e);
          alert(`通信エラーが発生しました: ${e}`);
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
