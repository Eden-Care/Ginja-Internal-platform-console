import { keepPreviousData, useQuery } from "@tanstack/react-query"

import {
  fetchMember,
  fetchMemberActivity,
  fetchMemberMetrics,
  fetchMembers,
  type MemberQuery,
} from "./api"
import { memberKeys } from "./queries"

/** A page of members for the Users directory. Search (`q`) and status filter are
   applied SERVER-SIDE — both are forwarded as query params to GET /members.
   `keepPreviousData` keeps the current rows on screen while a new filter/search
   loads, so tab switches don't blank the table. The endpoint is admin-only, so
   callers on non-admin screens pass `enabled: false` to avoid a guaranteed 403
   (names then fall back to the raw id/email). */
export function useMembers(query: MemberQuery = {}, enabled = true) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => fetchMembers(query),
    placeholderData: keepPreviousData,
    enabled,
  })
}

/** Directory aggregates (grand total, per-status counts, MFA adoption) for the
   filter-tab counts. Invalidated alongside the list on any member mutation. */
export function useMemberMetrics(enabled = true) {
  return useQuery({
    queryKey: memberKeys.metrics(),
    queryFn: fetchMemberMetrics,
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
