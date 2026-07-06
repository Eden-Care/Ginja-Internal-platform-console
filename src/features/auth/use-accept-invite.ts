import { useMutation } from "@tanstack/react-query"

import { acceptInviteRequest } from "./api"
import type { AcceptInviteRequest } from "./types"

/** Accept-invite mutation (public). Callers handle success (toast, navigate to
   /login) and error (toast) at the call site so the page owns its UX. */
export function useAcceptInvite() {
  return useMutation<void, Error, AcceptInviteRequest>({
    mutationFn: acceptInviteRequest,
  })
}
