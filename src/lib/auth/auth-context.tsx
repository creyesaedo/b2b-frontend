'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ApiError } from '../api/client';
import * as api from '../api/endpoints';
import type { AuthUser, UserPreferences } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Persists a preferences patch and updates the in-memory user. */
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  hasPermission: (key: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state for the app. Resolves the current user via the BFF's `/auth/me`
 * (the cookie is httpOnly, so we can't read it directly). A 401 simply means
 * "not logged in" — not an error.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await api.getMe());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        // Network/5xx: treat as logged out for UI purposes.
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setUser(await api.login(email, password));
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      setUser(await api.register(email, password, name));
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    setUser(await api.updatePreferences(patch));
  }, []);

  const hasPermission = useCallback(
    (key: string) => user?.permissions.includes(key) ?? false,
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refresh,
        updatePreferences,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
