import { useQuery } from "@tanstack/react-query"

import {
  fetchMember,
  fetchMemberActivity,
  fetchMembers,
  type MemberQuery,
} from "./api"
import { memberKeys } from "./queries"

/** A page of members for the Users directory. Search + status filter are applied
   client-side over the loaded page (kept simple for an internal console). The
   endpoint is admin-only, so callers on non-admin screens pass `enabled: false`
   to avoid a guaranteed 403 (names then fall back to the raw id/email). */
export function useMembers(query: MemberQuery = {}, enabled = true) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => fetchMembers(query),
    enabled,
  })
}

/** One member's full detail — fetched when a user row is opened. Enabled only
   while a member is selected. */
export function useMember(id: number | null) {
  return useQuery({
    queryKey: memberKeys.detail(id ?? -1),
    queryFn: () => fetchMember(id as number),
    enabled: id != null,
  })
}

/** A member's activity timeline — fetched when the Activity tab is opened. */
export function useMemberActivity(id: number | null, enabled = true) {
  return useQuery({
    queryKey: memberKeys.activity(id ?? -1),
    queryFn: () => fetchMemberActivity(id as number),
    enabled: id != null && enabled,
  })
}
