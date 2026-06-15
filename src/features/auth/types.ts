/* Auth request/response shapes for POST /platform/organization/auth/login. */

export type LoginRequest = {
  email: string
  password: string
}

/** The `result` payload returned by the login endpoint (snake_case, as the API sends it). */
export type LoginResult = {
  access_token: string
  token_type: string
  session_id: string
  expires_at: string
  member_id: number
  email: string
  roles: string[]
  accessible_modules: string[]
  accessible_permissions: string[]
}

/** The camelCase session we keep client-side (persisted + held in AuthContext). */
export type Session = {
  accessToken: string
  tokenType: string
  sessionId: string
  expiresAt: string
  memberId: number
  email: string
  roles: string[]
  modules: string[]
  permissions: string[]
}

/** Map the API's snake_case login payload onto our client Session. */
export function toSession(r: LoginResult): Session {
  return {
    accessToken: r.access_token,
    tokenType: r.token_type,
    sessionId: r.session_id,
    expiresAt: r.expires_at,
    memberId: r.member_id,
    email: r.email,
    roles: r.roles ?? [],
    modules: r.accessible_modules ?? [],
    permissions: r.accessible_permissions ?? [],
  }
}
