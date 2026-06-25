import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { fetchPayers, type ListPayersParams } from "./api"
import { payerKeys } from "./queries"

/** A page of tenant accounts. Filtering, sorting and pagination are all applied
   server-side via `params`; the endpoint returns a paged envelope. The free-text
   search the UI used to do client-side has no API equivalent (no search param).
   `keepPreviousData` keeps the current page on screen while the next loads. */
export function usePayers(params: ListPayersParams = {}) {
  return useQuery({
    queryKey: payerKeys.list(params),
    queryFn: () => fetchPayers(params),
    placeholderData: keepPreviousData,
  })
}
