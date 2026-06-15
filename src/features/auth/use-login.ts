import { useMutation } from "@tanstack/react-query"

import { loginRequest } from "./api"
import type { LoginRequest, Session } from "./types"

/** Login mutation. Callers handle success (apply session, navigate) and error
   (toast) at the call site so the page owns its UX. */
export function useLogin() {
  return useMutation<Session, Error, LoginRequest>({
    mutationFn: loginRequest,
  })
}
