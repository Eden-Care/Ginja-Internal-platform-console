import { apiPost } from "@/lib/api/client"
import {
  toSession,
  type AcceptInviteRequest,
  type LoginRequest,
  type LoginResult,
  type Session,
} from "./types"

/** POST /platform/organization/auth/login → a client Session. */
export async function loginRequest(creds: LoginRequest): Promise<Session> {
  const result = await apiPost<LoginResult>(
    "/platform/organization/auth/login",
    creds
  )
  return toSession(result)
}

/** POST /platform/organization/auth/accept-invite — validates the invite token,
   sets the member's password and activates them. Public (no auth); the API's
   `result` is null, so this resolves to void. The member then signs in via
   `loginRequest`. */
export async function acceptInviteRequest(
  body: AcceptInviteRequest
): Promise<void> {
  await apiPost("/platform/organization/auth/accept-invite", body)
}

/** POST /platform/organization/auth/logout — revokes the current session.
   Best-effort: the client clears its session regardless of the outcome. The
   token is passed explicitly because storage is cleared before this resolves. */
export async function logoutRequest(token?: string): Promise<void> {
  try {
    await apiPost(
      "/platform/organization/auth/logout",
      undefined,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    )
  } catch {
    /* ignore — session is dropped client-side anyway */
  }
}
