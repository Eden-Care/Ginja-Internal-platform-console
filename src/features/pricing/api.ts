/* Thin service over the API client. Returns mapped client types, never the raw
   DTO, so callers stay free of snake_case. */

import { apiGet } from "@/lib/api/client"

import {
  toPricingStructure,
  type PricingStructure,
  type PricingStructureDTO,
} from "./types"

export type PricingQuery = { status?: string }

/** GET /platform/pricing-structures → all pricing structures (optional ?status filter). */
export async function fetchPricingStructures(
  q: PricingQuery = {}
): Promise<PricingStructure[]> {
  const params: Record<string, string> = {}
  if (q.status) params.status = q.status

  const rows = await apiGet<PricingStructureDTO[]>(
    "/platform/pricing-structures",
    { params }
  )
  console.log("[GET /platform/pricing-structures]", rows)
  return rows.map(toPricingStructure)
}
