/* Query-key factory for the Tenant accounts (Payers) domain. */

import type { ListPayersParams } from "./api"

export const payerKeys = {
  all: ["payers"] as const,
  lists: () => [...payerKeys.all, "list"] as const,
  /** A specific filtered/sorted/paged list (each param combo caches separately). */
  list: (params: ListPayersParams) => [...payerKeys.lists(), params] as const,
  detail: (id: number) => [...payerKeys.all, "detail", id] as const,
  /** A payer's audit-trail timeline (Activity tab). */
  activity: (id: number) => [...payerKeys.all, "activity", id] as const,
  /** A payer's maker-checker lifecycle change-request history. */
  lifecycleRequests: (id: number) =>
    [...payerKeys.all, "lifecycle-requests", id] as const,
  steps: (id: number) => [...payerKeys.all, "steps", id] as const,
  /** Batch onboarding progress for all DRAFT payers (the drafts strip). */
  onboardingDrafts: () => [...payerKeys.all, "onboarding-drafts"] as const,
}
