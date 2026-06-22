/* Pricing structures — the commercial proposals a payer subscription points at.
   Onboarding's billing step picks an ACTIVE one. See API_GUIDE.md §7. */

export type PricingStructureDTO = {
  id: number
  pricing_id: string
  name: string
  description: string | null
  model: string
  status: string
  currency: string | null
  implementation_fee?: number | null
  platform_fee_annual?: number | null
  savings_capture_pct?: number | null
}

export type PricingStructure = {
  id: number
  code: string
  name: string
  description: string
  /** Structure methodology, e.g. PCT_GWP / TRANSACTION_BASED. */
  model: string
  status: string
  currency: string
}

export function toPricingStructure(d: PricingStructureDTO): PricingStructure {
  return {
    id: d.id,
    code: d.pricing_id,
    name: d.name,
    description: d.description ?? "",
    model: d.model,
    status: d.status,
    currency: d.currency ?? "USD",
  }
}
