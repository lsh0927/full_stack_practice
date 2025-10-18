'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccessToken = React.useCallback(async (): Promise<string | null> => {
    const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : refreshToken;

    if (!storedRefreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token);
          // Refresh Token도 업데이트될 수 있음
          if (data.refresh_token) {
            setRefreshToken(data.refresh_token);
            localStorage.setItem('refreshToken', data.refresh_token);
          }
        }
        return data.access_token;
      } else {
        // Refresh Token도 만료됨 - 로그아웃 처리
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }, [refreshToken]);

  const fetchUserProfile = React.useCallback(async (authToken: string, retry = true) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401 && retry) {
        // Access Token이 만료됨 - Refresh Token으로 갱신 시도
        const newToken = await refreshAccessToken();
        if (newToken) {
          // 새 토큰으로 재시도
          await fetchUserProfile(newToken, false);
        } else {
          // Refresh 실패 - 로그아웃 처리
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
          }
          setToken(null);
          setRefreshToken(null);
        }
      } else {
        // 토큰이 유효하지 않으면 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        setToken(null);
        setRefreshToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      setToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshAccessToken]);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '로그인에 실패했습니다.');
    }

    const data = await response.json();
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '회원가입에 실패했습니다.');
    }

    const data = await response.json();
    setToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
    }
  };

  const logout = async () => {
    // 서버에 로그아웃 요청 (Refresh Token 삭제)
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Failed to logout on server:', error);
      }
    }

    setUser(null);
    setToken(null);
    setRefreshToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  // 앱 시작 시 localStorage에서 토큰 복원 (SSR 대응)
  useEffect(() => {
    // 클라이언트에서만 실행 (localStorage는 브라우저에서만 사용 가능)
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (storedToken) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      // 토큰으로 사용자 정보 가져오기
      fetchUserProfile(storedToken);
    } else {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
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
