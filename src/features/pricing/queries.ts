/* Query-key factory for pricing structures. */

export const pricingKeys = {
  all: ["pricing-structures"] as const,
  list: (status?: string) =>
    [...pricingKeys.all, "list", status ?? "all"] as const,
  /** Slim ACTIVE list for the onboarding billing-step picker. */
  tenant: () => [...pricingKeys.all, "tenant"] as const,
}
