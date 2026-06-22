/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"

import {
  toPricingStructure,
  type PricingStructure,
  type PricingStructureDTO,
} from "./types"

/** GET /platform/pricing-structures (optional `?status=ACTIVE`). */
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
