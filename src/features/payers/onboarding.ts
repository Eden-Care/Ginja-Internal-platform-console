/* Onboarding orchestration. The wizard collects everything locally, then this
   runs the create → technical → secondary → entitlements → subscription →
   documents → submit sequence against the API (§8). It is resumable: on a
   step failure it throws an OnboardingError carrying the failed step + ids, so
   a retry can pick up from there without duplicating completed steps. */

import {
  addDocument,
  addSecondaryTenant,
  createPayer,
  patchTechnical,
  setEntitlements,
  setSubscription,
  submitPayer,
} from "./api"
import type { ContactRequest, TenantDetailsRequest } from "./types"

export type OnboardStep =
  | "create"
  | "technical"
  | "secondary"
  | "entitlements"
  | "subscription"
  | "documents"
  | "submit"

const ORDER: OnboardStep[] = [
  "create",
  "technical",
  "secondary",
  "entitlements",
  "subscription",
  "documents",
  "submit",
]

export type TenantInput = {
  legalEntityName: string
  tradingName?: string
  primaryContactName: string
  primaryContactEmail: string
  /** Full country name as entered in the form; mapped to ISO-2 here. */
  country: string
  region?: string
  subdomain?: string
  taxVatNumber?: string
  phone?: string
  address?: string
  website?: string
  extraContacts?: { name: string; email: string; role?: string }[]
}

export type OnboardInput = {
  /** Display type ("Insurer" | "TPA" | "Self-managed Scheme"). */
  payerType: string
  primary: TenantInput
  technical: {
    subdomain: string
    customDomain?: string
    isolation?: string
    region?: string
  }
  secondaries: TenantInput[]
  moduleCodes: string[]
  subscription: {
    pricingStructureId: number | null
    model: string
    frequency: string
  } | null
  documents: { category: string; fileName: string; expiryDate?: string }[]
}

export class OnboardingError extends Error {
  step: OnboardStep
  /** Ids of the payer created before the failure, so a retry can resume. */
  payerId?: number
  tenantId?: number
  constructor(
    step: OnboardStep,
    message: string,
    ids?: { payerId?: number; tenantId?: number }
  ) {
    super(message)
    this.name = "OnboardingError"
    this.step = step
    this.payerId = ids?.payerId || undefined
    this.tenantId = ids?.tenantId || undefined
  }
}

const COUNTRY_CODE: Record<string, string> = {
  Kenya: "KE",
  Tanzania: "TZ",
  Uganda: "UG",
  Rwanda: "RW",
  Ethiopia: "ET",
  Nigeria: "NG",
  "South Africa": "ZA",
}
const PAYER_TYPE: Record<string, string> = {
  Insurer: "INSURER",
  TPA: "TPA",
  "Self-managed Scheme": "SELF_MANAGED_SCHEME",
}

const countryCode = (name: string) => COUNTRY_CODE[name] ?? name
const payerTypeCode = (t: string) => PAYER_TYPE[t] ?? t

function buildTenant(t: TenantInput): TenantDetailsRequest {
  const extras: ContactRequest[] = (t.extraContacts ?? [])
    .filter((c) => c.name && c.email)
    .map((c) => ({ name: c.name, email: c.email, role_title: c.role ?? null }))
  return {
    legal_entity_name: t.legalEntityName,
    trading_name: t.tradingName || null,
    primary_contact_name: t.primaryContactName,
    primary_contact_email: t.primaryContactEmail,
    // The wizard's "Primary Tenant Admin" (contact 0) is the tenant admin.
    tenant_admin_name: t.primaryContactName,
    tenant_admin_email: t.primaryContactEmail,
    country: countryCode(t.country),
    data_residency_region: t.region || null,
    subdomain: t.subdomain || null,
    tax_vat_number: t.taxVatNumber || null,
    phone: t.phone || null,
    address: t.address || null,
    website: t.website || null,
    ...(extras.length ? { contacts: extras } : {}),
  }
}

export type RunOptions = {
  /** Resume from a prior partial run. */
  existingPayerId?: number
  existingTenantId?: number
  startFrom?: OnboardStep
  onStep?: (step: OnboardStep) => void
}

export type OnboardResult = {
  payerId: number
  payerCode: string
  primaryTenantId: number
}

/** Run the onboarding sequence. Throws OnboardingError(step) on the first failure. */
export async function runOnboarding(
  input: OnboardInput,
  opts: RunOptions = {}
): Promise<OnboardResult> {
  const startIdx = opts.startFrom ? ORDER.indexOf(opts.startFrom) : 0
  const runs = (s: OnboardStep) => ORDER.indexOf(s) >= startIdx
  const fail = (step: OnboardStep, e: unknown): never => {
    throw new OnboardingError(
      step,
      e instanceof Error ? e.message : `Failed at ${step}`,
      { payerId, tenantId }
    )
  }

  let payerId = opts.existingPayerId ?? 0
  let tenantId = opts.existingTenantId ?? 0
  let payerCode = ""

  if (runs("create")) {
    opts.onStep?.("create")
    try {
      const p = await createPayer({
        payer_type: payerTypeCode(input.payerType),
        primary_tenant: buildTenant(input.primary),
      })
      payerId = p.id
      tenantId = p.primaryTenantId ?? 0
      payerCode = p.code
    } catch (e) {
      return fail("create", e)
    }
  }
  if (!payerId || !tenantId) {
    throw new OnboardingError("create", "Missing payer/tenant id to continue.")
  }

  if (runs("technical")) {
    opts.onStep?.("technical")
    try {
      await patchTechnical(payerId, tenantId, {
        subdomain: input.technical.subdomain,
        custom_domain: input.technical.customDomain || null,
        isolation_tier:
          input.technical.isolation === "dedicated" ? "DEDICATED" : "SCHEMA",
        region_id: input.technical.region || input.primary.region || undefined,
        environment: "PRODUCTION",
      })
    } catch (e) {
      return fail("technical", e)
    }
  }

  if (runs("secondary")) {
    for (const s of input.secondaries) {
      opts.onStep?.("secondary")
      try {
        await addSecondaryTenant(payerId, buildTenant(s))
      } catch (e) {
        return fail("secondary", e)
      }
    }
  }

  if (runs("entitlements")) {
    opts.onStep?.("entitlements")
    try {
      await setEntitlements(payerId, {
        entitlements: input.moduleCodes.map((c) => ({ module_code: c })),
      })
    } catch (e) {
      return fail("entitlements", e)
    }
  }

  if (runs("subscription") && input.subscription?.pricingStructureId) {
    opts.onStep?.("subscription")
    try {
      await setSubscription(payerId, {
        pricing_structure_id: input.subscription.pricingStructureId,
        subscription_model: input.subscription.model,
        billing_frequency: input.subscription.frequency.toUpperCase(),
      })
    } catch (e) {
      return fail("subscription", e)
    }
  }

  if (runs("documents")) {
    for (const d of input.documents) {
      opts.onStep?.("documents")
      try {
        await addDocument(payerId, tenantId, {
          category: d.category,
          file_name: d.fileName,
          expiry_date: d.expiryDate || null,
        })
      } catch (e) {
        return fail("documents", e)
      }
    }
  }

  if (runs("submit")) {
    opts.onStep?.("submit")
    try {
      await submitPayer(payerId)
    } catch (e) {
      return fail("submit", e)
    }
  }

  return { payerId, payerCode, primaryTenantId: tenantId }
}
