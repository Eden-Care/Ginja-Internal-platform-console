import { useQuery } from "@tanstack/react-query"

import { fetchPricingStructures, type PricingQuery } from "./api"
import { pricingKeys } from "./queries"

/** Pricing structures for the Configuration → Pricing & plans page. */
export function usePricingStructures(q: PricingQuery = {}) {
  return useQuery({
    queryKey: pricingKeys.list(q),
    queryFn: () => fetchPricingStructures(q),
  })
}
