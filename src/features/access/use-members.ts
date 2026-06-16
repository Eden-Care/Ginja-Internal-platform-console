import { useQuery } from "@tanstack/react-query"

import { fetchMembers, type MemberQuery } from "./api"
import { memberKeys } from "./queries"

/** A page of members for the Users directory. Search + status filter are applied
   client-side over the loaded page (kept simple for an internal console). */
export function useMembers(query: MemberQuery = {}) {
  return useQuery({
    queryKey: memberKeys.list(query),
    queryFn: () => fetchMembers(query),
  })
}
