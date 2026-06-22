/* Query-key factory for the provisioning queue. */

import type { ProvisioningQuery } from "./api"

export const provisioningKeys = {
  all: ["provisioning"] as const,
  list: (q: ProvisioningQuery) => [...provisioningKeys.all, "list", q] as const,
}
