/* Query-key factory for the Insurers domain. */

import type { ListInsurersParams } from "./api"

export const insurerKeys = {
  all: ["insurers"] as const,
  directory: (params: ListInsurersParams) =>
    [...insurerKeys.all, "directory", params] as const,
  active: () => [...insurerKeys.all, "active"] as const,
  profile: (accountId: string) =>
    [...insurerKeys.all, "profile", accountId] as const,
  audit: (accountId: string) =>
    [...insurerKeys.all, "audit", accountId] as const,
}
