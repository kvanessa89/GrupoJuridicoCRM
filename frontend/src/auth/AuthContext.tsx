import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { TOKEN_STORAGE_KEY } from '../api/httpClient';
import * as authApi from './authApi';
import type { AuthUser } from './types';

const USER_STORAGE_KEY = 'gjcrm.user';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  function clearSession() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }

  useEffect(() => {
    window.addEventListener('gjcrm:unauthorized', clearSession);
    return () => window.removeEventListener('gjcrm:unauthorized', clearSession);
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    const authUser: AuthUser = {
      id: res.userId,
      name: res.name,
      email: res.email,
      role: res.role,
      color: res.color,
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return authUser;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout: clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
