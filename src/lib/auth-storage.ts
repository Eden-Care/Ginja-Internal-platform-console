/* Persistence for the logged-in Session. "Keep me signed in" → localStorage,
   otherwise sessionStorage (cleared when the tab closes). The axios client reads
   the token from here on every request, so storage is the single source of truth. */

import type { Session } from "@/features/auth/types"

const KEY = "ginja:auth"

export function readSession(): Session | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
  if (!raw) return null
  try {
    const session = JSON.parse(raw) as Session
    // Treat an expired token as no session (the 401 interceptor handles
    // server-side expiry/revocation, this is just the cheap up-front check).
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function writeSession(session: Session, remember: boolean): void {
  if (typeof window === "undefined") return
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  store.setItem(KEY, JSON.stringify(session))
  other.removeItem(KEY)
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
  sessionStorage.removeItem(KEY)
}

export function readToken(): string | null {
  return readSession()?.accessToken ?? null
}
