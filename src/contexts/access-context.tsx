import * as React from "react"

export type AccessUser = {
  fullName: string
  email: string
  role: string
}

type AccessContextValue = {
  user: AccessUser
  setUser: React.Dispatch<React.SetStateAction<AccessUser>>
  isLoading: boolean
  hasPermission: (...keys: string[]) => boolean
}

const DEFAULT_USER: AccessUser = {
  fullName: "Amara Okeke",
  email: "amara.okeke@ginja.ai",
  role: "Platform Admin",
}

const AccessContext = React.createContext<AccessContextValue | undefined>(
  undefined
)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AccessUser>(DEFAULT_USER)

  const hasPermission = React.useCallback(() => true, [])

  const value = React.useMemo(
    () => ({ user, setUser, isLoading: false, hasPermission }),
    [user, hasPermission]
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
