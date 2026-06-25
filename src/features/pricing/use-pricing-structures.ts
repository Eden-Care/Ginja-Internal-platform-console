import { useQuery } from "@tanstack/react-query"

import { fetchPricingStructures, fetchTenantPricingOptions } from "./api"
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

/** Slim ACTIVE pricing options for the onboarding billing-step picker (no tiers). */
export function useTenantPricingOptions() {
  return useQuery({
    queryKey: pricingKeys.tenant(),
    queryFn: fetchTenantPricingOptions,
  })
}
