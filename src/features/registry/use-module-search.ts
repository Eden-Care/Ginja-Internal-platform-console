import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { searchModuleRegistry } from "./api"
import { registryKeys } from "./queries"

/** Server-side module search; disabled until there's a query. Keeps the prior
   results visible while a new query loads to avoid an empty-table flash. */
export function useModuleSearch(q: string) {
  const term = q.trim()
  return useQuery({
    queryKey: registryKeys.search(term),
    queryFn: () => searchModuleRegistry(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  })
}
