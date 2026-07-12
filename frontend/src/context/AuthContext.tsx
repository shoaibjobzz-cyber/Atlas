import { useEffect, useMemo, useState } from "react";
import { fetchCurrentSession, signIn as apiSignIn, signOut as apiSignOut } from "../services/authApi";
import type { AuthUser } from "../types/auth";

import { AuthContext, type AuthContextValue } from "./authContextCore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshSession() {
    setLoading(true);
    try {
      const session = await fetchCurrentSession();
      setUser(session.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  async function signIn(username: string, password: string) {
    setLoading(true);
    try {
      await apiSignIn({ username, password });
      const session = await fetchCurrentSession();
      setUser(session.user);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      await apiSignOut();
    } finally {
      setUser(null);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signOut,
      refreshSession,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
