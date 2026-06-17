/* Query-key factory for pricing structures. */

import type { PricingQuery } from "./api"

export const pricingKeys = {
  all: ["pricing-structures"] as const,
  list: (q: PricingQuery) => [...pricingKeys.all, "list", q] as const,
}
