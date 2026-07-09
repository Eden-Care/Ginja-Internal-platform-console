/* Pricing structures — versioned commercial proposals a payer subscription
   points at (onboarding's billing step picks an ACTIVE one). API_GUIDE.md §7
   and the "Pricing Structures" folder of Ginja-Console.postman_collection.json.

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
  /** Backend display name for the component — shown as the tab text in the
     Volume discount schedules section. */
  label?: string | null
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
  currency: string | null
  implementation_fee?: number | null
  platform_fee_annual?: number | null
  savings_capture_pct?: number | null
  /** Precomputed card headline, e.g. "$0.50 / member" or "4.00% of GWP".
     Returned by the slim tenant list; absent on the full structures list. */
  display_price?: string | null
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
  /** Backend display name for the component (tab text). "" when absent. */
  label: string
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
  /** Structure methodology, e.g. PCT_GWP / TRANSACTION_BASED. */
  model: PricingModel
  status: PricingStatus
  currency: string
  implementationFee: number
  platformFeeAnnual: number
  savingsCapturePct: number
  /** Backend-precomputed headline (slim tenant list only); "" on the full list. */
  displayPrice: string
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
    label: d.label ?? "",
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
    currency: d.currency ?? "USD",
    implementationFee: d.implementation_fee ?? 0,
    platformFeeAnnual: d.platform_fee_annual ?? 0,
    savingsCapturePct: d.savings_capture_pct ?? 0,
    displayPrice: d.display_price ?? "",
    components,
    tierCount: components.reduce((n, c) => n + c.tiers.length, 0),
  }
}

/** Human-readable model label. */
export const PRICING_MODEL_LABEL: Record<string, string> = {
  TRANSACTION_BASED: "Transaction-based",
  PCT_GWP: "% of Gross Premium",
}

/** Short model label for the billing card subtitle (e.g. "Transaction"). */
export const PRICING_MODEL_SHORT: Record<string, string> = {
  TRANSACTION_BASED: "Transaction",
  PCT_GWP: "% of GWP",
}

/** Unit suffix for a card headline, by component_type first then unit. */
const COMPONENT_SUFFIX: Record<string, string> = {
  CLAIMS_OUTPATIENT: "/ outpatient claim",
  CLAIMS_INPATIENT: "/ inpatient claim",
  CORE_PLATFORM_PMPM: "/ member",
}
const UNIT_SUFFIX: Record<string, string> = {
  PER_MEMBER_MONTH: "/ member",
  PER_MEMBER: "/ member",
  PER_CLAIM: "/ claim",
}

/** Format a money amount compactly: $0.85, $11.15, $500K, $1.2M. */
function fmtAmount(v: number, currency: string): string {
  const sym = currency === "USD" ? "$" : `${currency} `
  if (v >= 1_000_000) {
    const m = v / 1_000_000
    return `${sym}${m % 1 ? m.toFixed(1) : m.toFixed(0)}M`
  }
  if (v >= 1_000) return `${sym}${Math.round(v / 1_000)}K`
  return `${sym}${v.toFixed(2)}`
}

/** Derive the API `subscription_model` (PMPM | PER_CLAIM | PCT_GWP) from a
   structure's lowest-order component, falling back to its model. Lets the card
   double as the model picker — no separate enum selector needed. */
export function subscriptionModelFor(s: PricingStructure): string {
  // `model` is reliable on both the full and slim (tenant) lists — lead with it.
  if (s.model === "PCT_GWP") return "PCT_GWP"
  // TRANSACTION_BASED: refine to PER_CLAIM vs PMPM via the lowest-order component
  // when present (full list); the slim list carries none, so default to PMPM.
  const comp = [...s.components].sort((a, b) => a.sortOrder - b.sortOrder)[0]
  if (comp && (comp.unit === "PER_CLAIM" || comp.componentType.includes("CLAIM")))
    return "PER_CLAIM"
  if (s.model === "TRANSACTION_BASED") return "PMPM"
  if (s.platformFeeAnnual > 0) return "FLAT"
  return "PMPM"
}

/** A headline price for the billing card, split into a bold amount + muted
   suffix. Prefers the backend's precomputed `displayPrice` (slim tenant list,
   e.g. "$0.50 / member" → {"$0.50", "/ member"}); otherwise derives from the
   lowest-order component's base rate or the flat annual fee. `null` when none. */
export function pricingHeadline(
  s: PricingStructure
): { amount: string; suffix: string } | null {
  if (s.displayPrice.trim()) {
    const [amount, ...rest] = s.displayPrice.trim().split(/\s+/)
    return { amount, suffix: rest.join(" ") }
  }
  const comp = [...s.components].sort((a, b) => a.sortOrder - b.sortOrder)[0]
  const base = comp
    ? [...comp.tiers].sort((a, b) => a.tierNumber - b.tierNumber)[0]
    : undefined
  if (comp && base) {
    if (comp.unit === "PERCENT" || comp.componentType.includes("GWP")) {
      return { amount: `${base.rate.toFixed(2)}%`, suffix: "of GWP" }
    }
    const suffix =
      COMPONENT_SUFFIX[comp.componentType] ?? UNIT_SUFFIX[comp.unit] ?? ""
    return { amount: fmtAmount(base.rate, s.currency), suffix }
  }
  // Slim (tenant) list has no components — fall back to the headline fee it does
  // carry: the annual platform fee, else the one-off setup fee.
  if (s.platformFeeAnnual > 0) {
    return { amount: fmtAmount(s.platformFeeAnnual, s.currency), suffix: "/ year" }
  }
  if (s.implementationFee > 0) {
    return { amount: fmtAmount(s.implementationFee, s.currency), suffix: "setup" }
  }
  return null
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
