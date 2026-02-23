import { createContext } from 'react';
import type { UserDetailResponseDto } from '@/api/generated/model';

export interface AuthContextValue {
  user: UserDetailResponseDto | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (token: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
