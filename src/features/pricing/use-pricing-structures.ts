import { useQuery } from "@tanstack/react-query"

import { fetchPricingStructures } from "./api"
import { pricingKeys } from "./queries"

/** Pricing structures, optionally filtered by status (e.g. "ACTIVE" for the
   onboarding subscription step). Used by the Pricing & plans page (no filter)
   and the onboarding billing step ("ACTIVE"). */
export function usePricingStructures(status?: string) {
  return useQuery({
    queryKey: pricingKeys.list(status),
    queryFn: () => fetchPricingStructures(status),
  })
}
