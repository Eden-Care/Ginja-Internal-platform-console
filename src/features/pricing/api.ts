/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"

import {
  toPricingStructure,
  type PricingStructure,
  type PricingStructureDTO,
} from "./types"

/** GET /platform/pricing-structures (optional `?status=ACTIVE`). Full catalogue
   incl. components/tiers — for the Pricing admin screen. */
export async function fetchPricingStructures(
  status?: string
): Promise<PricingStructure[]> {
  const rows = await apiGet<PricingStructureDTO[]>(
    "/platform/pricing-structures",
    status ? { params: { status } } : undefined
  )
  console.log("[GET /platform/pricing-structures]", rows)
  return (rows ?? []).map(toPricingStructure)
}

/** GET /platform/pricing-structures/tenant → slim ACTIVE list for the onboarding
   billing-step picker (§8.4). Omits components/tiers, so cards key off `model`
   and the fee fields (no per-unit rate). Maps to the same PricingStructure shape
   (components default to []). */
export async function fetchTenantPricingOptions(): Promise<PricingStructure[]> {
  const rows = await apiGet<PricingStructureDTO[]>(
    "/platform/pricing-structures/tenant"
  )
  console.log("[GET /platform/pricing-structures/tenant]", rows)
  return (rows ?? []).map(toPricingStructure)
}
