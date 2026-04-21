import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import type { AuthState } from "@/lib/api";

export function useAuth() {
  const [auth, setAuthState] = useState<AuthState | null>(() => getAuth());
  useEffect(() => {
    const handler = () => setAuthState(getAuth());
    window.addEventListener("auth:change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth:change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return auth;
}
