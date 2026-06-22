import { useQuery } from "@tanstack/react-query"

import { fetchPayers } from "./api"
import { payerKeys } from "./queries"

/** All tenant accounts for the directory. Search / status filter / sort / paging
   are applied client-side over the loaded array (kept simple for an internal
   console; the endpoint returns the full list, not a page). */
export function usePayers() {
  return useQuery({
    queryKey: payerKeys.lists(),
    queryFn: fetchPayers,
  })
}
