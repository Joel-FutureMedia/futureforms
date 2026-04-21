import type { AuthState } from "@/lib/api";

const KEY = "futuremedia.auth";

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuth(a: AuthState) {
  localStorage.setItem(KEY, JSON.stringify(a));
  window.dispatchEvent(new Event("auth:change"));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:change"));
}

export function isAdmin(a: AuthState | null) {
  return a?.role === "ROLE_SUPER_ADMIN";
}
