import { useMutation, useQuery } from "@tanstack/react-query"

import { fetchMfaDetail, remindMfa } from "./api"
import { settingsKeys } from "./queries"

/** One member's MFA enrolment detail (GET /platform/settings/mfa-status/{id}).
   Fetched when a member's detail drawer opens. */
export function useMfaDetail(memberId: number | null) {
  return useQuery({
    queryKey: settingsKeys.mfaDetail(memberId ?? -1),
    queryFn: () => fetchMfaDetail(memberId as number),
    enabled: memberId != null,
  })
}

/** Send an MFA-enrolment reminder to a member
   (POST /platform/settings/mfa-status/{memberId}/remind). */
export function useRemindMfa() {
  return useMutation({
    mutationFn: (memberId: number) => remindMfa(memberId),
  })
}
