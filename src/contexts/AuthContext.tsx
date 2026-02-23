import { useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetUserMeApiV1UsersMeGet } from '@/api/generated/user/user';
import { getToken, setToken, removeToken, checkIsAdmin as checkAdminToken, isAuthenticated as checkAuth } from '@/utils/auth';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context';

export type { AuthContextValue };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(checkAuth);
  const queryClient = useQueryClient();

  const { data: user, isLoading, error: userError } = useGetUserMeApiV1UsersMeGet({
    query: { enabled: authenticated },
  });

  const token = getToken();
  const isAdmin = token ? checkAdminToken(token) : false;

  const login = useCallback((newToken: string) => {
    setToken(newToken);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setAuthenticated(false);
    queryClient.clear();
  }, [queryClient]);

  // axios interceptor의 auth:expired 이벤트 수신
  useEffect(() => {
    const handleExpired = () => {
      setAuthenticated(false);
      queryClient.clear();
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [queryClient]);

  // /users/me 쿼리 에러 로깅
  useEffect(() => {
    if (userError) {
      console.error('[Auth] Failed to fetch user profile:', userError);
    }
  }, [userError]);

  const value: AuthContextValue = {
    user: authenticated ? (user ?? null) : null,
    isAuthenticated: authenticated,
    isAdmin,
    isLoading: authenticated && isLoading,
    error: authenticated && userError ? (userError instanceof Error ? userError : new Error('프로필 정보를 가져올 수 없습니다')) : null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
