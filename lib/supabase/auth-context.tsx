// ═══════════════════════════════════════════════════════════
// Auth Context — Client-side session state
//
// Provides user info to all client components via React context.
// Listens to Supabase auth state changes (login/logout/token refresh).
// ═══════════════════════════════════════════════════════════

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createBrowserSupabase } from './clients';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  displayName: string;
  role: 'ADMIN' | 'PARTICIPANT' | null;
  poolId: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  displayName: '',
  role: null,
  poolId: 'pool-propanas-octavos-2026',
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
  initialUser,
  initialRole,
  initialDisplayName,
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialRole?: 'ADMIN' | 'PARTICIPANT' | null;
  initialDisplayName?: string;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);
  const supabase = createBrowserSupabase();

  const displayName =
    initialDisplayName ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    '';

  const role = initialRole ?? null;
  const poolId = 'pool-propanas-octavos-2026';

  useEffect(() => {
    // If no initial user, fetch from browser session
    if (!initialUser) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      });
    }

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, displayName, role, poolId, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access auth state from any client component */
export function useAuth() {
  return useContext(AuthContext);
}
