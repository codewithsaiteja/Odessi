/**
 * ODESSI.TFI — API Client
 *
 * Central HTTP client for the Spring Boot backend.
 * All API calls go through this module — never fetch() directly in components.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return decodeURIComponent(match[2]);
  return null;
}

async function handleResponse<T>(response: Response, originalRequest?: () => Promise<T>): Promise<T> {
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

  // 401 Intercept & Refresh
  if (response.status === 401 && originalRequest) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") || "",
        },
      });

      if (refreshResponse.ok) {
        return originalRequest();
      } else {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth-session-expired"));
        }
      }
    } catch (e) {
      console.error("Refresh token request failed", e);
    }
  }

  let errorBody: ErrorBody;
  try {
    const text = await response.text();
    errorBody = text ? JSON.parse(text) : {
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

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function executeFetch<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const isAuthRequest = path.startsWith("/api/auth/");
  
  const headers = new Headers({
    "Content-Type": "application/json",
    ...options?.headers,
  });

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const xsrfToken = getCookie("XSRF-TOKEN");
    if (xsrfToken) {
      headers.set("X-XSRF-TOKEN", xsrfToken);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: options?.signal,
      credentials: "include",
      cache: "no-store",
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Failed to connect to backend server (${API_BASE_URL}). ${err?.message || "Failed to fetch"}`,
      path
    );
  }

  // Don't retry auth endpoints themselves on 401
  if (isAuthRequest) {
    return handleResponse<T>(response);
  }

  return handleResponse<T>(response, () => executeFetch<T>(method, path, body, options));
}

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

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken) {
    headers.set("X-XSRF-TOKEN", xsrfToken);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });
  } catch (err: any) {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Failed to connect to backend server (${API_BASE_URL}). ${err?.message || "Failed to fetch"}`,
      path
    );
  }

  return handleResponse<T>(response);
}

export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const entries = Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}
