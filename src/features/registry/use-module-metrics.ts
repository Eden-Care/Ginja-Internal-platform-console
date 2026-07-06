import { useQuery } from "@tanstack/react-query"

import { fetchModuleMetrics } from "./api"
import { registryKeys } from "./queries"

/** Module-registry dashboard KPI metrics. Console-only for now — fetched so the
   response is logged; not yet bound to the UI. */
export function useModuleMetrics() {
  return useQuery({
    queryKey: registryKeys.metrics(),
    queryFn: fetchModuleMetrics,
  })
}
