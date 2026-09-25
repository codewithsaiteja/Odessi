"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiGet,
  apiPost,
  refreshCsrfToken,
  invalidateCsrfToken,
  extendSessionApi,
} from "../api/client";
import { EVENTS, emitEvent } from "../events";
import { SessionExpirationWarning } from "@/components/auth/SessionExpirationWarning";

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
  extendSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authoritative Inactivity Thresholds
const CUSTOMER_IDLE_TIMEOUT_SECONDS = 30 * 60; // 30 minutes
const ADMIN_IDLE_TIMEOUT_SECONDS = 15 * 60;    // 15 minutes
const WARNING_THRESHOLD_SECONDS = 120;         // 2 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [remainingWarningSeconds, setRemainingWarningSeconds] = useState(WARNING_THRESHOLD_SECONDS);

  const lastActiveTimeRef = useRef<number>(0);
  const lastBackendTouchRef = useRef<number>(0);
  const isLoggingOutRef = useRef<boolean>(false);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Initialize active timestamp on mount
  useEffect(() => {
    lastActiveTimeRef.current = Date.now();
    lastBackendTouchRef.current = Date.now();
  }, []);

  // Initialize multi-tab synchronization channel
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const channel = new BroadcastChannel("odessi_auth_sync");
        broadcastChannelRef.current = channel;

        channel.onmessage = (event: MessageEvent) => {
          const { type, payload } = event.data || {};
          if (type === "LOGOUT") {
            setUser(null);
            setShowWarning(false);
            emitEvent(EVENTS.AUTH_LOGOUT);
            if (typeof window !== "undefined") {
              localStorage.removeItem("odessi_demo_user");
            }
          } else if (type === "SESSION_EXTENDED") {
            lastActiveTimeRef.current = payload?.timestamp || Date.now();
            setShowWarning(false);
          } else if (type === "LOGIN" && payload) {
            setUser(payload);
            lastActiveTimeRef.current = Date.now();
            setShowWarning(false);
            emitEvent(EVENTS.AUTH_SUCCESS, payload);
          }
        };

        return () => {
          channel.close();
          broadcastChannelRef.current = null;
        };
      } catch (err) {
        console.warn("[AuthContext] BroadcastChannel unavailable:", err);
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiGet<User>("/api/auth/me");
      setUser(data);
      lastActiveTimeRef.current = Date.now();
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

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
      setShowWarning(false);
      emitEvent(EVENTS.AUTH_LOGOUT);

      // Notify other tabs
      try {
        broadcastChannelRef.current?.postMessage({ type: "LOGOUT" });
      } catch {}

      isLoggingOutRef.current = false;
    }
  }, []);

  const handleInactivityLogout = useCallback(async () => {
    await logout();
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isPrivateRoute = currentPath.startsWith("/admin") || currentPath.startsWith("/account") || currentPath.startsWith("/orders");
      if (isPrivateRoute) {
        router.push(`/login?reason=inactivity&redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  }, [logout, router]);

  const extendSession = useCallback(async (): Promise<boolean> => {
    try {
      const status = await extendSessionApi();
      if (status && status.active) {
        lastActiveTimeRef.current = Date.now();
        lastBackendTouchRef.current = Date.now();
        setShowWarning(false);

        // Notify other tabs
        try {
          broadcastChannelRef.current?.postMessage({
            type: "SESSION_EXTENDED",
            payload: { timestamp: lastActiveTimeRef.current },
          });
        } catch {}

        return true;
      }
      return false;
    } catch (err) {
      console.warn("[AuthContext] Session extension rejected by backend:", err);
      // Backend confirmed session is dead/expired -> logout immediately
      await handleInactivityLogout();
      return false;
    }
  }, [handleInactivityLogout]);

  // Initial load & session-expired listener
  useEffect(() => {
    refreshUser();

    const handleSessionExpired = () => {
      handleInactivityLogout();
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth-session-expired", handleSessionExpired);
    };
  }, [refreshUser, handleInactivityLogout]);

  // Throttled User Activity Tracking
  useEffect(() => {
    if (!user) return;

    let throttleTimer: NodeJS.Timeout | null = null;

    const onUserInteraction = () => {
      const now = Date.now();
      lastActiveTimeRef.current = now;

      // Throttle backend touch to at most once every 90 seconds during active usage
      if (now - lastBackendTouchRef.current > 90 * 1000) {
        lastBackendTouchRef.current = now;
        extendSessionApi().catch(() => {});
      }
    };

    const throttledHandler = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          throttleTimer = null;
          onUserInteraction();
        }, 1000);
      }
    };

    window.addEventListener("mousedown", throttledHandler, { passive: true });
    window.addEventListener("keydown", throttledHandler, { passive: true });
    window.addEventListener("touchstart", throttledHandler, { passive: true });
    window.addEventListener("scroll", throttledHandler, { passive: true });

    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      window.removeEventListener("mousedown", throttledHandler);
      window.removeEventListener("keydown", throttledHandler);
      window.removeEventListener("touchstart", throttledHandler);
      window.removeEventListener("scroll", throttledHandler);
    };
  }, [user]);

  // Idle Timer Evaluation Loop
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActiveTimeRef.current) / 1000);
      const idleTimeout = user.role === "ADMIN" ? ADMIN_IDLE_TIMEOUT_SECONDS : CUSTOMER_IDLE_TIMEOUT_SECONDS;
      const remaining = idleTimeout - elapsedSeconds;

      if (remaining <= 0) {
        setShowWarning(false);
        handleInactivityLogout();
      } else if (remaining <= WARNING_THRESHOLD_SECONDS) {
        setShowWarning(true);
        setRemainingWarningSeconds(remaining);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [user, showWarning, handleInactivityLogout]);

  const login = async (credentials: Record<string, string>): Promise<User> => {
    const data = await apiPost<User>("/api/auth/login", credentials);
    setUser(data);
    lastActiveTimeRef.current = Date.now();
    lastBackendTouchRef.current = Date.now();
    setShowWarning(false);

    if (typeof window !== "undefined") {
      localStorage.removeItem("odessi_demo_user");
    }

    // Refresh CSRF token for the new authenticated session
    refreshCsrfToken().catch(() => {});
    emitEvent(EVENTS.AUTH_SUCCESS, data);
    emitEvent(EVENTS.CART_MERGED, null);

    // Notify other tabs
    try {
      broadcastChannelRef.current?.postMessage({ type: "LOGIN", payload: data });
    } catch {}

    return data;
  };

  const register = async (data: Record<string, string>) => {
    await apiPost("/api/auth/register", data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        extendSession,
      }}
    >
      {children}
      <SessionExpirationWarning
        isOpen={showWarning}
        remainingSeconds={remainingWarningSeconds}
        onExtend={async () => {
          await extendSession();
        }}
        onLogout={logout}
      />
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
        login: async () => ({} as User),
        register: async () => {},
        logout: async () => {},
        refreshUser: async () => {},
        extendSession: async () => false,
      };
    }
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
