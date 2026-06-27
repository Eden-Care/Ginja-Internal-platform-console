import * as React from "react"

import { useAuth } from "@/contexts/auth-context"
import {
  CONSOLE_ROLES,
  cHasPerm,
  cReadonly,
  roleKeyFromApiRoles,
  type ConsoleRole,
  type ConsoleRoleKey,
} from "@/lib/console-data"

export type AccessUser = {
  fullName: string
  email: string
  role: string
}

type AccessContextValue = {
  /** The acting console role, derived from the logged-in user's JWT roles. */
  role: ConsoleRole
  roleKey: ConsoleRoleKey
  user: AccessUser
  isLoading: boolean
  /** True if the current role may view a module (by permId, e.g. "approvals"). */
  hasPermission: (permId: string) => boolean
  /** True if the current role may view-but-not-edit a module (by permId). */
  isReadonly: (permId: string) => boolean
}

const AccessContext = React.createContext<AccessContextValue | undefined>(
  undefined
)

/** Best-effort display name from an email local-part ("amara.okeke" → "Amara Okeke"). */
function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email
  return (
    local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join(" ") || email
  )
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()

  const roleKey = roleKeyFromApiRoles(session?.roles)
  const role = CONSOLE_ROLES[roleKey]

  const value = React.useMemo<AccessContextValue>(
    () => ({
      role,
      roleKey,
      user: {
        fullName: session ? displayNameFromEmail(session.email) : "",
        email: session?.email ?? "",
        role: role.label,
      },
      isLoading: false,
      hasPermission: (permId: string) => cHasPerm(role, permId),
      isReadonly: (permId: string) => cReadonly(role, permId),
    }),
    [role, roleKey, session]
  )

  return (
    <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
  )
}

export function useAccess(): AccessContextValue {
  const ctx = React.useContext(AccessContext)
  if (!ctx) throw new Error("useAccess must be used within AccessProvider")
  return ctx
}
