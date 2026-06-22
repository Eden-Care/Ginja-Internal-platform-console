/* Query-key factory for pricing structures. */

export const pricingKeys = {
  all: ["pricing-structures"] as const,
  list: (status?: string) =>
    [...pricingKeys.all, "list", status ?? "all"] as const,
}
