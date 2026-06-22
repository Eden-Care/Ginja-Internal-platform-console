import { useQuery } from "@tanstack/react-query"

import { fetchMember, fetchMembers, type MemberQuery } from "./api"
import { memberKeys } from "./queries"

/** A page of members for the Users directory. Search + status filter are applied
   client-side over the loaded page (kept simple for an internal console). */
export function useMembers(query: MemberQuery = {}) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => fetchMembers(query),
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
