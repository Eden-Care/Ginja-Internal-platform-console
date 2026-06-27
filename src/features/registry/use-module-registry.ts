import { useInfiniteQuery } from "@tanstack/react-query"

import type { Paged } from "@/lib/api/paged"
import type { RegistryModule } from "@/lib/console-data"

import { fetchModuleRegistry } from "./api"
import { registryKeys } from "./queries"

const PAGE_SIZE = 20

/** The platform module catalogue (Configuration → Module registry), infinitely
   scrolled — appends 20 modules per page as the user reaches the bottom. */
export function useModuleRegistry() {
  return useInfiniteQuery({
    queryKey: registryKeys.infinite(),
    queryFn: ({ pageParam }) => fetchModuleRegistry(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last: Paged<RegistryModule>) =>
      last.page < last.totalPages - 1 ? last.page + 1 : undefined,
  })
}
