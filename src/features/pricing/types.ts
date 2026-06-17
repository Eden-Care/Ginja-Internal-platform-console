/* Pricing structures — versioned commercial proposals (API_GUIDE.md §7 and the
   "Pricing Structures" folder of Ginja-Console.postman_collection.json).

   DTOs are snake_case exactly as the API returns them; client types are
   camelCase with a toX() mapper at the boundary so snake_case never leaks into
   components. */

/** Pricing model. TRANSACTION_BASED | PCT_GWP (open string for forward-compat). */
export type PricingModel = "TRANSACTION_BASED" | "PCT_GWP" | (string & {})

/** Lifecycle. DRAFT → ACTIVE → ARCHIVED. */
export type PricingStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | (string & {})

export type PricingTierDTO = {
  tier_id?: string
  tier_number: number
  volume_threshold_min: number
  rate: number
  discount_pct: number
}

export type PricingComponentDTO = {
  component_id?: string
  component_type: string
  unit: string
  sort_order: number
  tiers?: PricingTierDTO[] | null
}

export type PricingStructureDTO = {
  id: number
  pricing_id: string
  name: string
  description: string | null
  model: PricingModel
  status: PricingStatus
  currency: string
  implementation_fee: number
  platform_fee_annual: number
  savings_capture_pct: number
  components?: PricingComponentDTO[] | null
}

export type PricingTier = {
  tierNumber: number
  volumeThresholdMin: number
  rate: number
  discountPct: number
}

export type PricingComponent = {
  componentType: string
  unit: string
  sortOrder: number
  tiers: PricingTier[]
}

/** The camelCase pricing structure the UI renders. */
export type PricingStructure = {
  id: number
  /** Human-readable code, e.g. "PRC000001". */
  code: string
  name: string
  description: string
  model: PricingModel
  status: PricingStatus
  currency: string
  implementationFee: number
  platformFeeAnnual: number
  savingsCapturePct: number
  components: PricingComponent[]
  /** Total tiers across all components — drives the "tiered" badge. */
  tierCount: number
}

export function toPricingTier(d: PricingTierDTO): PricingTier {
  return {
    tierNumber: d.tier_number,
    volumeThresholdMin: d.volume_threshold_min,
    rate: d.rate,
    discountPct: d.discount_pct,
  }
}

export function toPricingComponent(d: PricingComponentDTO): PricingComponent {
  return {
    componentType: d.component_type,
    unit: d.unit,
    sortOrder: d.sort_order,
    tiers: (d.tiers ?? []).map(toPricingTier),
  }
}

export function toPricingStructure(d: PricingStructureDTO): PricingStructure {
  const components = (d.components ?? []).map(toPricingComponent)
  return {
    id: d.id,
    code: d.pricing_id,
    name: d.name,
    description: d.description ?? "",
    model: d.model,
    status: d.status,
    currency: d.currency,
    implementationFee: d.implementation_fee ?? 0,
    platformFeeAnnual: d.platform_fee_annual ?? 0,
    savingsCapturePct: d.savings_capture_pct ?? 0,
    components,
    tierCount: components.reduce((n, c) => n + c.tiers.length, 0),
  }
}

/** Human-readable model label. */
export const PRICING_MODEL_LABEL: Record<string, string> = {
  TRANSACTION_BASED: "Transaction-based",
  PCT_GWP: "% of Gross Premium",
}

/** Badge tone per lifecycle status. */
export const PRICING_STATUS_TONE: Record<
  string,
  "success" | "warning" | "neutral"
> = {
  ACTIVE: "success",
  DRAFT: "warning",
  ARCHIVED: "neutral",
}
