import { useQuery } from "@tanstack/react-query"

import { fetchModuleCatalogue } from "./api"
import { registryKeys } from "./queries"

/** The module catalogue for the onboarding entitlement step. Same data as the
    Module registry, but keeps each module's functional `code` (RegistryModule
    folds it into `id`) — the code is what PUT /entitlements expects. */
export function useModuleCatalogue() {
  return useQuery({
    queryKey: registryKeys.catalogue(),
    queryFn: fetchModuleCatalogue,
  })
}
