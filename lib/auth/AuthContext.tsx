"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiGet, apiPost, refreshCsrfToken, invalidateCsrfToken } from "../api/client";
import { EVENTS, emitEvent } from "../events";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "CUSTOMER" | "ADMIN";
  enabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: Record<string, string>) => Promise<User>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<User>("/api/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial load
    refreshUser();

    // Listen for session expiry from API client
    const handleSessionExpired = () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("odessi_demo_user");
      }
      setUser(null);
      emitEvent(EVENTS.AUTH_LOGOUT);
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, [refreshUser]);

  const login = async (credentials: Record<string, string>): Promise<User> => {
    const data = await apiPost<User>("/api/auth/login", credentials);
    setUser(data);
    if (typeof window !== "undefined") {
      localStorage.removeItem("odessi_demo_user");
    }
    // Refresh CSRF token for the new authenticated session
    refreshCsrfToken().catch(() => {});
    emitEvent(EVENTS.AUTH_SUCCESS, data);
    emitEvent(EVENTS.CART_MERGED, null);
    return data;
  };

  const register = async (data: Record<string, string>) => {
    await apiPost("/api/auth/register", data);
  };

  const logout = async () => {
    try {
      await apiPost("/api/auth/logout");
    } catch {
      // Ignore network errors on logout
    } finally {
      invalidateCsrfToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("odessi_demo_user");
      }
      setUser(null);
      emitEvent(EVENTS.AUTH_LOGOUT);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    if (typeof window === "undefined") {
      return {
        user: null,
        isLoading: false,
        login: async () => {},
        register: async () => {},
        logout: async () => {},
        refreshUser: async () => {},
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
