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
  return (rows ?? []).map(toPricingStructure)
}
