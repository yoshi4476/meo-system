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
};

const DashboardContext = createContext<DashboardContextType>({
  userInfo: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
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
        // If 401, maybe clear token? For now just log
        console.error('Failed to fetch user:', response.status);
        if (response.status === 401) {
            // localStorage.removeItem('meo_auth_token'); // Optional: Auto-logout
        }
      }
    } catch (err) {
      console.error('User fetch error:', err);
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <DashboardContext.Provider value={{ userInfo, isLoading, error, refreshUser: fetchUser }}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
