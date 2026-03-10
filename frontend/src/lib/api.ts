import { useAuth } from "@clerk/clerk-react";

const ENV_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, "");
const LLM_API_KEY_STORAGE_KEY = "kuantra_google_api_key";

type TokenProvider = (() => Promise<string | null> | string | null) | null;

let authTokenProvider: TokenProvider = null;

function inferApiBaseUrl(): string {
  if (ENV_API_BASE_URL) return ENV_API_BASE_URL;

  if (typeof window !== "undefined") {
    const isDev = Boolean((import.meta as any).env?.DEV);
    const host = window.location.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (isDev && isLocalHost) {
      return "http://127.0.0.1:8000";
    }

    // Production default: same-origin API (works for reverse-proxy Docker/Nginx deploys).
    return "";
  }

  return "";
}

export const API_BASE_URL = inferApiBaseUrl();

export class ApiError extends Error {
  status: number;
  detail?: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function setAuthTokenProvider(provider: TokenProvider) {
  authTokenProvider = provider;
}

export async function getAuthToken(): Promise<string | null> {
  if (!authTokenProvider) {
    const legacyToken =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return legacyToken || null;
  }

  const token = await authTokenProvider();
  return token || null;
}

export function getStoredLLMApiKey(): string | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(LLM_API_KEY_STORAGE_KEY);
  return value?.trim() ? value.trim() : null;
}

export function setStoredLLMApiKey(apiKey: string | null): void {
  if (typeof window === "undefined") return;
  if (!apiKey || !apiKey.trim()) {
    localStorage.removeItem(LLM_API_KEY_STORAGE_KEY);
    return;
  }
  localStorage.setItem(LLM_API_KEY_STORAGE_KEY, apiKey.trim());
}

export function useAuthFetch() {
  const { getToken } = useAuth();

  return async function authFetch<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, auth: true, token: token || undefined });
  };
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean; token?: string },
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers || {});
  if (!(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth) {
    const token = init.token ?? (await getAuthToken());
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const llmApiKey = getStoredLLMApiKey();
  if (llmApiKey) {
    headers.set("X-Google-Api-Key", llmApiKey);
  }

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const data = await parseJsonSafe(res);
    const msg =
      (data && (data.detail || data.message)) || res.statusText || "Request failed";
    throw new ApiError(String(msg), res.status, data);
  }
  return (await parseJsonSafe(res)) as T;
}
