/* Query-key factory for the Service Providers domain. */

import type { ListParams } from "./api"

export const spKeys = {
  all: ["service-providers"] as const,
  directory: (params: ListParams) =>
    [...spKeys.all, "directory", params] as const,
  profile: (code: string) => [...spKeys.all, "profile", code] as const,
  audit: (code: string) => [...spKeys.all, "audit", code] as const,
  documents: (code: string) => [...spKeys.all, "documents", code] as const,
  reviewQueue: () => [...spKeys.all, "review-queue"] as const,
  review: (code: string) => [...spKeys.all, "review", code] as const,
}
