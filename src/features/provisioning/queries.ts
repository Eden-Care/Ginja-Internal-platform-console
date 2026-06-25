/* Query-key factory for the provisioning queue + technical review. */

import type { ProvisioningQuery } from "./api"

export const provisioningKeys = {
  all: ["provisioning"] as const,
  lists: () => [...provisioningKeys.all, "list"] as const,
  list: (q: ProvisioningQuery) => [...provisioningKeys.lists(), q] as const,
  mine: () => [...provisioningKeys.all, "mine"] as const,
  detail: (tenantId: number) =>
    [...provisioningKeys.all, "detail", tenantId] as const,
  remarks: (tenantId: number) =>
    [...provisioningKeys.all, "remarks", tenantId] as const,
}
