import { useQuery } from "@tanstack/react-query"

import { fetchProvisioning, type ProvisioningQuery } from "./api"
import { provisioningKeys } from "./queries"

/** The tenant provisioning queue for the Platform settings → Provisioning tab. */
export function useProvisioning(q: ProvisioningQuery = {}) {
  return useQuery({
    queryKey: provisioningKeys.list(q),
    queryFn: () => fetchProvisioning(q),
  })
}
