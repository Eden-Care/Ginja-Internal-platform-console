import { useQuery } from "@tanstack/react-query"

import { fetchModuleRegistry } from "./api"
import { registryKeys } from "./queries"

/** The platform module catalogue for the Configuration → Module registry page. */
export function useModuleRegistry() {
  return useQuery({
    queryKey: registryKeys.lists(),
    queryFn: fetchModuleRegistry,
  })
}
