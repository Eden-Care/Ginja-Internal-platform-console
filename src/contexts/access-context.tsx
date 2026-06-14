import * as React from "react"
import {
  CONSOLE_ROLES,
  cHasPerm,
  cReadonly,
  type ConsoleRole,
  type ConsoleRoleKey,
} from "@/lib/console-data"

export type AccessUser = {
  fullName: string
  email: string
  role: string
}

type AccessContextValue = {
  /** The role currently being acted as (demo: switchable from the header). */
  role: ConsoleRole
  roleKey: ConsoleRoleKey
  setRoleKey: (key: ConsoleRoleKey) => void
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

const STORAGE_KEY = "ginja:roleKey"

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [roleKey, setRoleKeyState] = React.useState<ConsoleRoleKey>(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
    return saved && saved in CONSOLE_ROLES
      ? (saved as ConsoleRoleKey)
      : "platform_admin"
  })
  const setRoleKey = React.useCallback((key: ConsoleRoleKey) => {
    setRoleKeyState(key)
    localStorage.setItem(STORAGE_KEY, key)
  }, [])
  const role = CONSOLE_ROLES[roleKey]

  const value = React.useMemo<AccessContextValue>(
    () => ({
      role,
      roleKey,
      setRoleKey,
      user: { fullName: role.name, email: role.email, role: role.label },
      isLoading: false,
      hasPermission: (permId: string) => cHasPerm(role, permId),
      isReadonly: (permId: string) => cReadonly(role, permId),
    }),
    [role, roleKey, setRoleKey]
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
