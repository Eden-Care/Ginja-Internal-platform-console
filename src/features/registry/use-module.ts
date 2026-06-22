import { useQuery } from "@tanstack/react-query"

import { fetchModule } from "./api"
import { registryKeys } from "./queries"

/** One module's full detail, fetched on demand (e.g. when a row is opened). */
export function useModule(moduleId: string | null) {
  return useQuery({
    queryKey: registryKeys.detail(moduleId ?? ""),
    queryFn: () => fetchModule(moduleId as string),
    enabled: !!moduleId,
  })
}
