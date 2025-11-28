import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "darna-auth";

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return { user: null, token: null };
      return JSON.parse(stored);
    } catch {
      return { user: null, token: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      login(payload) {
        setAuthState({
          user: payload.user ?? null,
          token: payload.token ?? null,
        });
      },
      logout() {
        setAuthState({ user: null, token: null });
      },
      updateUser(nextUser) {
        setAuthState((prev) => ({
          ...prev,
          user: nextUser ? { ...prev.user, ...nextUser } : prev.user,
        }));
      },
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

