/* Tenant accounts (Payers) domain. DTOs mirror the API's snake_case
   `PayerResponse` exactly; the client `Payer` is the camelCase shape the list
   renders. See API_GUIDE.md §8–9. */

import type { TenantStatus, TenantType } from "@/lib/console-data"

/* API enum → the display strings the existing UI components expect. */
const STATUS_MAP: Record<string, TenantStatus> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  RETIRED: "Retired",
  ARCHIVED: "Retired",
  PENDING_ACTIVATION: "Pending Activation",
  PENDING_REVIEW: "Pending Review",
}

const TYPE_MAP: Record<string, TenantType> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}

const MODEL_LABEL: Record<string, string> = {
  PMPM: "PMPM",
  PER_CLAIM: "Per claim",
  PCT_GWP: "% of GWP",
}

export type TenantDTO = {
  id: number
  tenant_code: string
  primary: boolean
  status: string
  subdomain: string | null
  schema_name: string | null
  data_residency_region: string | null
  legal_entity_name: string
  trading_name: string | null
  country: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  tenant_admin_name: string | null
  tenant_admin_email: string | null
  documents?: unknown[] | null
}

/** The subscription snapshot's exact shape isn't pinned in the docs — read it
   defensively (any of these may be present, or it may be null). */
export type SubscriptionDTO = {
  pricing_structure_id?: number | null
  pricing_structure_name?: string | null
  structure_name?: string | null
  subscription_model?: string | null
  billing_frequency?: string | null
} | null

export type PayerDTO = {
  id: number
  payer_id: string
  status: string
  payer_type: string
  primary_tenant_id: number | null
  submitted_by: string | null
  submitted_at: string | null
  activated_at: string | null
  created_at: string
  tenants?: TenantDTO[] | null
  entitlements?: unknown[] | null
  subscription?: SubscriptionDTO
}

export type Payer = {
  id: number
  /** Human-readable payer code, e.g. "PAY000001". */
  code: string
  /** Primary tenant's legal entity name. */
  name: string
  type: TenantType
  status: TenantStatus
  /** Raw API status (e.g. "ACTIVE") — for lifecycle action gating. */
  rawStatus: string
  country: string
  /** Primary tenant's data-residency region. */
  region: string
  subdomain: string
  /** Total tenants under the payer (primary + secondaries). */
  subTenants: number
  /** A short label for the Subscription column ("—" when none). */
  subscriptionLabel: string
  /** ISO timestamp used for the Updated column. */
  updatedAt: string | null
  primaryTenantId: number | null
}

function subscriptionLabel(s: SubscriptionDTO): string {
  if (!s) return "—"
  const name = s.pricing_structure_name ?? s.structure_name
  if (name) return name
  const model = s.subscription_model ? MODEL_LABEL[s.subscription_model] ?? s.subscription_model : null
  return model ?? "—"
}

/* ----------------------------------------- onboarding request DTOs (§8) --- */

export type ContactRequest = {
  name: string
  email: string
  role_title?: string | null
  receives_invite?: boolean
}

/** TenantDetailsRequest — primary & secondary tenants share this shape (§8.1/8.2). */
export type TenantDetailsRequest = {
  legal_entity_name: string
  trading_name?: string | null
  primary_contact_name: string
  primary_contact_email: string
  country: string
  data_residency_region?: string | null
  subdomain?: string | null
  tenant_admin_name: string
  tenant_admin_email: string
  tax_vat_number?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  contacts?: ContactRequest[]
}

export type CreatePayerRequest = {
  payer_type: string
  primary_tenant: TenantDetailsRequest
}

export type TechnicalRequest = {
  subdomain: string
  custom_domain?: string | null
  isolation_tier?: string
  deployment_cluster?: string
  region_id?: string
  owner_team?: string
  priority?: string
  environment?: string
}

export type EntitlementRequest = { module_code: string; submodule_codes?: string[] }
export type SetEntitlementsRequest = { entitlements: EntitlementRequest[] }

export type SetSubscriptionRequest = {
  pricing_structure_id: number
  subscription_model: string
  billing_frequency: string
}

export type AddDocumentRequest = {
  category: string
  file_name: string
  description?: string | null
  expiry_date?: string | null
}

/** Subset of TenantLookupResponse the wizard needs (§8.0). */
export type TenantLookup = {
  found: boolean
  matchedBy: string[]
  tenant: {
    legalEntityName: string
    tenantCode: string
    country: string | null
    payerStatus: string | null
  } | null
}

export type SubdomainCheck = {
  input: string
  sanitised: string
  reserved: boolean
  valid: boolean
  available: boolean
  suggestions: string[]
}

export function toPayer(d: PayerDTO): Payer {
  const tenants = d.tenants ?? []
  const primary =
    tenants.find((t) => t.primary) ??
    tenants.find((t) => t.id === d.primary_tenant_id) ??
    tenants[0]
  return {
    id: d.id,
    code: d.payer_id,
    name: primary?.legal_entity_name ?? "—",
    type: TYPE_MAP[d.payer_type] ?? (d.payer_type as TenantType),
    status: STATUS_MAP[d.status] ?? "Draft",
    rawStatus: d.status,
    country: primary?.country ?? "—",
    region: primary?.data_residency_region ?? "—",
    subdomain: primary?.subdomain ?? "—",
    subTenants: tenants.length,
    subscriptionLabel: subscriptionLabel(d.subscription ?? null),
    updatedAt: d.activated_at ?? d.submitted_at ?? d.created_at ?? null,
    primaryTenantId: d.primary_tenant_id,
  }
}
