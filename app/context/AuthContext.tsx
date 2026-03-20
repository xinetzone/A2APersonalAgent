'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface User {
  id: string;
  name?: string;
  avatarUrl?: string;
  email?: string;
  route?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  configError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const refreshCountRef = useRef(0);
  const isProcessingLoginRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (isProcessingLoginRef.current) return;
    isProcessingLoginRef.current = true;
    refreshCountRef.current += 1;
    const currentRefresh = refreshCountRef.current;

    try {
      const token = localStorage.getItem('secondme_token');

      if (!token) {
        if (currentRefresh === refreshCountRef.current) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch('/api/secondme/user/info', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (currentRefresh !== refreshCountRef.current) return;

        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setUser(result.data);
          } else {
            setUser(null);
          }
        } else {
          if (response.status === 401) {
            localStorage.removeItem('secondme_token');
            localStorage.removeItem('secondme_refresh_token');
          }
          setUser(null);
        }
      } catch (abortError) {
        if (currentRefresh !== refreshCountRef.current) return;
        clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (currentRefresh === refreshCountRef.current) {
        setUser(null);
      }
    } finally {
      if (currentRefresh === refreshCountRef.current) {
        setIsLoading(false);
        isProcessingLoginRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      checkAuth();
    } else if (params.get('error') === 'server_not_configured') {
      window.history.replaceState({}, '', window.location.pathname);
      setConfigError('server_not_configured');
    }
  }, [checkAuth]);

  const login = useCallback(() => {
    window.location.href = '/api/auth/login';
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('secondme_token');
    localStorage.removeItem('secondme_refresh_token');
    setUser(null);
    window.location.href = '/';
  }, []);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    await checkAuth();
  }, [checkAuth]);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    configError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}