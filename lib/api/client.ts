/**
 * ODESSI.TFI — API Client
 *
 * Central HTTP client for the Spring Boot backend.
 * All API calls go through this module — never fetch() directly in components.
 *
 * ## CSRF Strategy (cross-origin: Vercel → Render)
 *
 * Vercel and Render are on different origins. The browser's Same-Origin Policy
 * prevents JavaScript on Vercel from reading cookies (including XSRF-TOKEN) set
 * by Render via `document.cookie`. Therefore `getCookie()` always returns null in
 * production for cross-origin deployments.
 *
 * Instead we use a server-side CSRF token endpoint (GET /api/csrf) which returns
 * the current token as JSON. The token is cached in memory and attached as the
 * `X-XSRF-TOKEN` header on every state-changing request. Spring Security validates
 * this header against the XSRF-TOKEN cookie it wrote.
 *
 * CSRF protection is NOT weakened. Admin endpoints still require:
 *   1. A valid JWT (access_token cookie) for authentication.
 *   2. A valid X-XSRF-TOKEN header for CSRF protection.
 */

const DEFAULT_API_URL =
  process.env.NODE_ENV === "production"
    ? "https://odessi-backend.onrender.com"
    : "http://localhost:8080";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, "");

// ─── Session State Tracking ──────────────────────────────────────────────────
const HAS_SESSION_KEY = "odessi_has_session";

export function hasStoredSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(HAS_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function setStoredSession(hasSession: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (hasSession) {
      localStorage.setItem(HAS_SESSION_KEY, "true");
    } else {
      localStorage.removeItem(HAS_SESSION_KEY);
    }
  } catch {}
}

// ─── In-Flight Deduplication & Public GET Cache ──────────────────────────────
const inFlightGets = new Map<string, Promise<any>>();
const publicGetCache = new Map<string, { data: any; expiresAt: number }>();
const DEFAULT_CACHE_TTL_MS = 30_000; // 30 seconds

function isPublicCacheablePath(path: string): boolean {
  return (
    (path.startsWith("/api/homepage/content") ||
      path.startsWith("/api/collections") ||
      path.startsWith("/api/categories") ||
      path.startsWith("/api/products") ||
      path.startsWith("/api/reviews")) &&
    !path.startsWith("/api/admin")
  );
}

/** Invalidate cached public GET responses (e.g. after admin updates). */
export function invalidateClientCache(prefix?: string): void {
  if (!prefix) {
    publicGetCache.clear();
  } else {
    for (const key of Array.from(publicGetCache.keys())) {
      if (key.startsWith(prefix)) {
        publicGetCache.delete(key);
      }
    }
  }
}

// ─── CSRF Token Manager ─────────────────────────────────────────────────────

interface CsrfTokenResponse {
  token: string;
  headerName: string;
  parameterName: string;
}

/** In-memory CSRF token cache. Never sent to client or written to storage. */
let csrfCache: string | null = null;

/**
 * In-flight promise to deduplicate concurrent CSRF token fetches.
 * If multiple requests fire simultaneously before the first fetch resolves,
 * they all await the same promise instead of making N parallel requests.
 */
let csrfFetchInFlight: Promise<string> | null = null;
let refreshFetchInFlight: Promise<boolean> | null = null;

/**
 * Fetch a fresh CSRF token from GET /api/csrf and cache it in memory.
 *
 * Must be called with `credentials: "include"` so the XSRF-TOKEN cookie
 * is set by the backend before the token is read from the JSON body.
 */
async function fetchCsrfToken(): Promise<string> {
  if (csrfFetchInFlight) return csrfFetchInFlight;

  csrfFetchInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/csrf`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`CSRF endpoint returned ${response.status}`);
      }
      const data: CsrfTokenResponse = await response.json();
      csrfCache = data.token;
      return csrfCache;
    } finally {
      csrfFetchInFlight = null;
    }
  })();

  return csrfFetchInFlight;
}

/**
 * Get the cached CSRF token, fetching it if not yet cached.
 * Always prefers the in-memory cache — one network round-trip per browser session.
 */
async function getCsrfToken(): Promise<string> {
  if (csrfCache) return csrfCache;
  return fetchCsrfToken();
}

/**
 * Invalidate the cached CSRF token.
 *
 * Call this after login or logout so the next state-changing request
 * re-fetches a fresh token bound to the new authentication context.
 */
export function invalidateCsrfToken(): void {
  csrfCache = null;
}

/** Refresh the CSRF token: invalidates the cache and fetches a fresh token immediately. */
export async function refreshCsrfToken(): Promise<string> {
  invalidateCsrfToken();
  return fetchCsrfToken();
}

// ─── Error Types ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string,
    message: string,
    public readonly path?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  status: number;
  error: string;
  message: string;
  path?: string;
}

// ─── Response Handler ────────────────────────────────────────────────────────

async function handleResponse<T>(
  response: Response,
  originalRequest?: () => Promise<T>,
  requestPath?: string
): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;

    const text = await response.text();
    if (!text || !text.trim()) {
      return undefined as T;
    }

    try {
      const json = JSON.parse(text);
      if (json && typeof json === "object" && "data" in json && "success" in json) {
        return json.data as T;
      }
      return json as T;
    } catch {
      return text as unknown as T;
    }
  }

  // ── 401 Intercept & JWT Refresh (Deduplicated) ─────────────────────────
  // Guest guard: if /api/auth/me returned 401 and this browser has no saved session,
  // do not trigger a futile refresh attempt.
  const isGuestAuthMe = requestPath === "/api/auth/me" && !hasStoredSession();

  if (response.status === 401 && originalRequest && !isGuestAuthMe) {
    if (!refreshFetchInFlight) {
      refreshFetchInFlight = (async () => {
        try {
          // Backend ignores CSRF on /api/auth/refresh, no getCsrfToken needed
          const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshResponse.ok) {
            setStoredSession(true);
            // Invalidate CSRF cache — a new session may issue a new token
            invalidateCsrfToken();
            return true;
          } else if (refreshResponse.status === 401) {
            setStoredSession(false);
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("auth-session-expired"));
            }
          }
          return false;
        } catch (e) {
          console.error("Refresh token request failed", e);
          return false;
        } finally {
          refreshFetchInFlight = null;
        }
      })();
    }

    const refreshSuccess = await refreshFetchInFlight;
    if (refreshSuccess) {
      return originalRequest();
    }
  }

  // ── 403 Intercept — CSRF token may have expired ──────────────────────────
  // If the backend rejects with 403 and we haven't already retried, invalidate
  // the CSRF cache and retry once. A second 403 is a genuine access-denied.
  // Note: We only retry 403s when originalRequest is provided (non-auth calls).
  // Auth endpoints get a plain 403 which means wrong credentials, not CSRF.

  let errorBody: ErrorBody;
  try {
    const text = await response.text();
    errorBody = text
      ? JSON.parse(text)
      : {
          status: response.status,
          error: "UNKNOWN_ERROR",
          message: response.statusText || "An unknown error occurred",
        };
  } catch {
    errorBody = {
      status: response.status,
      error: "UNKNOWN_ERROR",
      message: response.statusText || "An unknown error occurred",
    };
  }

  throw new ApiError(errorBody.status, errorBody.error, errorBody.message, errorBody.path);
}

// ─── Core Fetch ──────────────────────────────────────────────────────────────

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  skipCache?: boolean;
}

async function executeFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
  _isCsrfRetry = false,
  _isAuthRetry = false
): Promise<T> {
  // Check memory cache for idempotent public GET requests
  if (method === "GET" && !options?.skipCache && isPublicCacheablePath(path)) {
    const cached = publicGetCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as T;
    }
  }

  // In-flight deduplication for concurrent identical GET requests
  if (method === "GET" && !_isAuthRetry && !_isCsrfRetry && !options?.signal) {
    const existing = inFlightGets.get(path);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const fetchPromise = (async () => {
    const isPublicAuthRequest = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/refresh",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
    ].some((p) => path.startsWith(p));
    const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    const headers = new Headers({
      "Content-Type": "application/json",
      ...options?.headers,
    });

    if (isStateChanging) {
      // Use server-side CSRF endpoint — never relies on document.cookie cross-origin
      const xsrfToken = await getCsrfToken();
      headers.set("X-XSRF-TOKEN", xsrfToken);
    }

    // Default timeout management
    const timeoutMs = options?.timeoutMs ?? (isStateChanging ? 15000 : 10000);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const effectiveSignal = options?.signal || controller.signal;

    const isServer = typeof window === "undefined";
    const isServerPublicGet = isServer && method === "GET" && isPublicCacheablePath(path);

    let response: Response;
    try {
      const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: effectiveSignal,
        credentials: "include",
        cache: isServerPublicGet ? "default" : "no-store",
      };

      if (isServerPublicGet) {
        fetchInit.next = { revalidate: 60 };
      }

      response = await fetch(`${API_BASE_URL}${path}`, fetchInit as RequestInit);
    } catch (err: unknown) {
      clearTimeout(timer);
      const error = err as { name?: string; message?: string };
      if (error?.name === "AbortError") {
        throw new ApiError(
          408,
          "REQUEST_TIMEOUT",
          `Request to ${path} timed out after ${timeoutMs}ms`,
          path
        );
      }
      throw new ApiError(
        0,
        "NETWORK_ERROR",
        `Failed to connect to backend server (${API_BASE_URL}). ${error?.message || "Failed to fetch"}`,
        path
      );
    } finally {
      clearTimeout(timer);
    }

    // ── CSRF 403 retry (once) — handles token rotation between tabs/deployments
    if (response.status === 403 && isStateChanging && !isPublicAuthRequest && !_isCsrfRetry) {
      invalidateCsrfToken();
      return executeFetch<T>(method, path, body, options, true, _isAuthRetry);
    }

    // Don't retry public auth endpoints themselves on 401
    if (isPublicAuthRequest) {
      return handleResponse<T>(response, undefined, path);
    }

    const result = await handleResponse<T>(
      response,
      !_isAuthRetry ? () => executeFetch<T>(method, path, body, options, _isCsrfRetry, true) : undefined,
      path
    );

    // Save in public GET cache if applicable
    if (method === "GET" && isPublicCacheablePath(path) && result !== undefined) {
      publicGetCache.set(path, {
        data: result,
        expiresAt: Date.now() + DEFAULT_CACHE_TTL_MS,
      });
    }

    return result;
  })();

  if (method === "GET" && !_isAuthRetry && !_isCsrfRetry && !options?.signal) {
    inFlightGets.set(path, fetchPromise);
    fetchPromise.finally(() => {
      inFlightGets.delete(path);
    });
  }

  return fetchPromise;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return executeFetch<T>("GET", path, undefined, options);
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return executeFetch<T>("POST", path, body, options);
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return executeFetch<T>("PATCH", path, body, options);
}

export async function apiPut<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return executeFetch<T>("PUT", path, body, options);
}

export async function apiDelete<T = void>(path: string, options?: RequestOptions): Promise<T> {
  return executeFetch<T>("DELETE", path, undefined, options);
}

export interface SessionStatus {
  active: boolean;
  role: "CUSTOMER" | "ADMIN";
  idleTimeoutSeconds: number;
  remainingSeconds: number;
  warningThresholdSeconds: number;
}

export async function extendSessionApi(): Promise<SessionStatus> {
  return apiPost<SessionStatus>("/api/auth/extend");
}

export async function getSessionStatusApi(): Promise<SessionStatus> {
  return apiGet<SessionStatus>("/api/auth/session-status");
}

// ─── Multipart Upload ─────────────────────────────────────────────────────────

/**
 * POST a multipart FormData payload.
 *
 * Unlike `apiPost`, this uses the raw `fetch` API with no `Content-Type` header
 * so the browser can set the correct `multipart/form-data; boundary=...` header.
 *
 * The CSRF token is fetched from the server-side endpoint (not document.cookie)
 * and attached as `X-XSRF-TOKEN`. On a 403, the token cache is invalidated and
 * the request is retried once.
 */
export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
  _isCsrfRetry = false,
  _isAuthRetry = false
): Promise<T> {
  const xsrfToken = await getCsrfToken();

  const headers = new Headers({
    "X-XSRF-TOKEN": xsrfToken,
    // Note: Do NOT set Content-Type — browser must set it with boundary
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Failed to connect to backend server (${API_BASE_URL}). ${error?.message || "Failed to fetch"}`,
      path
    );
  }

  // Retry once on 403 (possible CSRF token rotation)
  if (response.status === 403 && !_isCsrfRetry) {
    invalidateCsrfToken();
    return apiPostFormData<T>(path, formData, true, _isAuthRetry);
  }

  const result = await handleResponse<T>(
    response,
    !_isAuthRetry ? () => apiPostFormData<T>(path, formData, _isCsrfRetry, true) : undefined,
    path
  );
  invalidateClientCache();
  return result;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
