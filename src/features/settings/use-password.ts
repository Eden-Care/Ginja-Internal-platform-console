import { useMutation, useQuery } from "@tanstack/react-query"

import {
  fetchPasswordDetail,
  fetchPasswordStatuses,
  forcePasswordReset,
} from "./api"
import { settingsKeys } from "./queries"

/** Per-member password health for the Password status tab
   (GET /platform/settings/password-status). */
export function usePasswordStatuses() {
  return useQuery({
    queryKey: settingsKeys.passwordStatuses(),
    queryFn: fetchPasswordStatuses,
  })
}

/** One member's password detail (GET /platform/settings/password-status/{id}).
   Fetched when a member's detail drawer opens. */
export function usePasswordDetail(memberId: number | null) {
  return useQuery({
    queryKey: settingsKeys.passwordDetail(memberId ?? -1),
    queryFn: () => fetchPasswordDetail(memberId as number),
    enabled: memberId != null,
  })
}

/** Send a member a password-reset link
   (POST /platform/settings/password-status/{memberId}/force-reset). */
export function useForcePasswordReset() {
  return useMutation({
    mutationFn: (memberId: number) => forcePasswordReset(memberId),
  })
}
