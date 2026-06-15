import * as React from "react"
import { useNavigate } from "react-router-dom"

import { logoutRequest } from "@/features/auth/api"
import type { Session } from "@/features/auth/types"
import { setUnauthorizedHandler } from "@/lib/api/client"
import { queryClient } from "@/lib/api/query-client"
import { clearSession, readSession, readToken, writeSession } from "@/lib/auth-storage"

type AuthContextValue = {
  /** The live session, or null when signed out. */
  session: Session | null
  isAuthenticated: boolean
  /** Persist + activate a session after a successful login. */
  applySession: (session: Session, remember: boolean) => void
  /** Revoke the session and return to /login. */
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [session, setSession] = React.useState<Session | null>(() =>
    readSession()
  )

  const applySession = React.useCallback(
    (next: Session, remember: boolean) => {
      writeSession(next, remember)
      setSession(next)
    },
    []
  )

  const clearAndRedirect = React.useCallback(() => {
    clearSession()
    setSession(null)
    queryClient.clear()
    navigate("/login", { replace: true })
  }, [navigate])

  const logout = React.useCallback(() => {
    const token = readToken()
    clearSession()
    setSession(null)
    queryClient.clear()
    void logoutRequest(token ?? undefined)
    navigate("/login", { replace: true })
  }, [navigate])

  // Any API call that 401s drops the session and bounces to /login.
  React.useEffect(() => {
    setUnauthorizedHandler(clearAndRedirect)
    return () => setUnauthorizedHandler(null)
  }, [clearAndRedirect])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      applySession,
      logout,
    }),
    [session, applySession, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
