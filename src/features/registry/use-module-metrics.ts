import { useQuery } from "@tanstack/react-query"

import { fetchModuleMetrics } from "./api"
import { registryKeys } from "./queries"

/** Module-registry dashboard KPI metrics — bound to the four top tiles
   (Total modules / Published / In beta / Sub-modules) on the registry page. */
export function useModuleMetrics() {
  return useQuery({
    queryKey: registryKeys.metrics(),
    queryFn: fetchModuleMetrics,
  })
}
