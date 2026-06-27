/* Onboarding orchestration. The wizard collects everything locally, then this
   runs the create → secondary → entitlements → subscription → documents → submit
   sequence against the API (§8). It is resumable: on a step failure it throws an
   OnboardingError carrying the failed step + ids, so a retry can pick up from
   there without duplicating completed steps. */

import {
  BASE_FORM,
  BILLING_FREQ,
  type Contact,
  type OnboardingForm,
  type Secondary,
  type TenantType,
  type WizStepKey,
} from "@/lib/console-data"

import {
  addDocument,
  addSecondaryTenant,
  createPayer,
  deleteTenant,
  fetchPayerDetail,
  setEntitlements,
  setSubscription,
  submitPayer,
  updateTenant,
} from "./api"
import { countryName } from "./draft-vm"
import type {
  ContactRequest,
  PayerDTO,
  SetEntitlementsRequest,
  SetSubscriptionRequest,
  TenantDetailsRequest,
  TenantDTO,
} from "./types"

// NOTE: there is no `technical` step in onboarding — the subdomain is set at
// create time (primary_tenant.subdomain) and technical/infra setup lives on the
// separate Tenant Provisioning page (/tenant-provisioning), post-approval.
export type OnboardStep =
  | "create"
  | "secondary"
  | "entitlements"
  | "subscription"
  | "documents"
  | "submit"

const ORDER: OnboardStep[] = [
  "create",
  "secondary",
  "entitlements",
  "subscription",
  "documents",
  "submit",
]

export type TenantInput = {
  /** Server tenant id when this row is already saved (drives PATCH vs POST on a
     secondary). Absent for the primary at create and for new secondaries. */
  tenantId?: number
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

export type EntitlementInput = {
  moduleCode: string
  /** Selected sub-module codes; empty for a whole-module unit. */
  submoduleCodes: string[]
}

export type OnboardInput = {
  /** Display type ("Insurer" | "TPA" | "Self-managed Scheme"). */
  payerType: string
  /** Primary tenant — includes the subdomain (set at create; no technical step). */
  primary: TenantInput
  secondaries: TenantInput[]
  /** Module entitlements. `submoduleCodes` is empty for a whole-module unit (no
     sub-modules); otherwise it lists the selected sub-module codes. */
  entitlements: EntitlementInput[]
  subscription: {
    pricingStructureId: number | null
    model: string
    frequency: string
    /** Optional commercial terms. Strings as collected by the form. */
    freeTrialDays?: string
    contractStart?: string
    contractEnd?: string
  } | null
  /** Documents to upload. `file` carries the bytes; entries without a file are
     already on the server (resume) and are skipped. */
  documents: {
    category: string
    fileName: string
    expiryDate?: string
    description?: string
    file?: File
  }[]
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

/** Map the wizard's entitlement intent to the API's SetEntitlementsRequest.
   `submodule_codes` is only sent for modules with a selected sub-module set. */
const toEntitlementsRequest = (
  entitlements: EntitlementInput[]
): SetEntitlementsRequest => ({
  entitlements: entitlements.map((e) => ({
    module_code: e.moduleCode,
    ...(e.submoduleCodes.length ? { submodule_codes: e.submoduleCodes } : {}),
  })),
})

/** Map the wizard's subscription intent to the API's SetSubscriptionRequest.
   The optional commercial terms (free trial, contract window) are only sent
   when set. Caller guarantees a non-null pricing structure id (§8.4). */
const toSubscriptionRequest = (
  sub: NonNullable<OnboardInput["subscription"]>
): SetSubscriptionRequest => {
  const days = sub.freeTrialDays?.trim() ? Number(sub.freeTrialDays) : NaN
  return {
    pricing_structure_id: sub.pricingStructureId as number,
    subscription_model: sub.model,
    billing_frequency: sub.frequency.toUpperCase(),
    ...(Number.isFinite(days) && days > 0 ? { free_trial_days: days } : {}),
    ...(sub.contractStart ? { contract_start: sub.contractStart } : {}),
    ...(sub.contractEnd ? { contract_end: sub.contractEnd } : {}),
  }
}

/** API payer_type → the wizard's display type. */
const PAYER_TYPE_LABEL: Record<string, TenantType> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}
/** API billing_frequency (e.g. MONTHLY) → the form's label (e.g. Monthly). */
const freqLabel = (f?: string | null) =>
  BILLING_FREQ.find((x) => x.toUpperCase() === f) ?? BASE_FORM.freq

/** Map a server tenant row → the wizard's Secondary shape (carrying its
   tenantId so the row is recognised as server-backed on edit/remove). */
function tenantToSecondary(t: TenantDTO): Secondary {
  return {
    tenantId: t.id,
    name: t.legal_entity_name ?? "",
    country: t.country ? countryName(t.country) : "",
    region: t.data_residency_region ?? "",
    subdomain: t.subdomain ?? "",
  }
}

/** Rehydrate the wizard form from a DRAFT payer for resume.

   Since the 2026-06-24 backend update GET payer detail echoes
   tax_vat_number / phone / address / website, and secondary tenants come back in
   `tenants[]`, so the primary profile and the secondaries all rehydrate and stay
   editable (PATCH on save). `bank` is still never returned. */
export function payerDetailToForm(d: PayerDTO): {
  form: OnboardingForm
  payerId: number
  tenantId: number
  /** Document categories already saved server-side (don't re-POST on resume). */
  savedDocCategories: string[]
} {
  const tenants = d.tenants ?? []
  const t = tenants.find((x) => x.primary) ?? tenants[0]
  const contact: Contact = {
    name: t?.primary_contact_name ?? "",
    email: t?.primary_contact_email ?? "",
    role: "",
    phone: t?.phone ?? "",
  }
  const secondaries = tenants.filter((x) => !x.primary).map(tenantToSecondary)
  // module_code → enabled sub-module codes. A whole-module entitlement comes back
  // as a single row with submodule_code = null → an empty array (step-modules then
  // treats that as "all sub-modules" once the catalogue loads).
  const modules: Record<string, string[]> = {}
  for (const e of d.entitlements ?? []) {
    if (!e.enabled) continue
    const arr = (modules[e.module_code] ??= [])
    if (e.submodule_code) arr.push(e.submodule_code)
  }
  const documents = (t?.documents ?? []).map((doc) => ({
    category: doc.category,
    fileName: doc.file_name,
    expiryDate: doc.expiry_date ?? undefined,
    documentId: doc.document_id,
    uploaded: true, // already on the server — downloadable, not re-uploaded
  }))
  const sub = d.subscription

  const form: OnboardingForm = {
    ...BASE_FORM,
    legal: t?.legal_entity_name ?? "",
    trading: t?.trading_name ?? "",
    contact: contact.name,
    email: contact.email,
    country: t?.country ? countryName(t.country) : "",
    region: t?.data_residency_region ?? "",
    type: PAYER_TYPE_LABEL[d.payer_type] ?? "Insurer",
    subdomain: t?.subdomain ?? "",
    tax: t?.tax_vat_number ?? "",
    address: t?.address ?? "",
    website: t?.website ?? "",
    contacts: [contact],
    secondaries,
    modules,
    pricingStructureId: sub?.pricing_structure_id ?? null,
    model: sub?.subscription_model ?? "",
    freq: freqLabel(sub?.billing_frequency),
    freeTrialDays: sub?.free_trial_days != null ? String(sub.free_trial_days) : "",
    contractStart: sub?.contract_start ?? "",
    contractEnd: sub?.contract_end ?? "",
    documents,
  }

  return {
    form,
    payerId: d.id,
    tenantId: d.primary_tenant_id ?? t?.id ?? 0,
    savedDocCategories: documents.map((doc) => doc.category),
  }
}

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
  /** Document categories already saved server-side — skipped to avoid
     duplicate rows when resuming a draft (POST documents is additive). */
  skipDocumentCategories?: string[]
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
      await setEntitlements(payerId, toEntitlementsRequest(input.entitlements))
    } catch (e) {
      return fail("entitlements", e)
    }
  }

  if (runs("subscription") && input.subscription?.pricingStructureId) {
    opts.onStep?.("subscription")
    try {
      await setSubscription(payerId, toSubscriptionRequest(input.subscription))
    } catch (e) {
      return fail("subscription", e)
    }
  }

  if (runs("documents")) {
    const skipDocs = new Set(opts.skipDocumentCategories ?? [])
    for (const d of input.documents) {
      if (!d.file) continue // already on the server (resume) — nothing to upload
      if (skipDocs.has(d.category)) continue // already saved server-side
      opts.onStep?.("documents")
      try {
        await addDocument(payerId, tenantId, {
          file: d.file,
          category: d.category,
          expiryDate: d.expiryDate,
          description: d.description,
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

/* ----------------------------------------------- save-as-you-go (per step) --- */

/** Server-side draft state the wizard threads between per-step saves. */
export type DraftState = {
  payerId: number | null
  tenantId: number | null
  /** Payer code (e.g. PAY000012) once created. */
  payerCode: string
  /** Document categories already POSTed (documents are additive). */
  savedDocCategories: string[]
}

export const EMPTY_DRAFT_STATE: DraftState = {
  payerId: null,
  tenantId: null,
  payerCode: "",
  savedDocCategories: [],
}

/**
 * Reconcile the wizard's secondary tenants against the server (DRAFT only):
 * PATCH each row that already carries a tenantId, POST each new row, then re-read
 * the payer so the returned list carries authoritative tenant ids. Removals are
 * handled separately (the page DELETEs server-backed rows on remove). Returns the
 * rebuilt Secondary[] for the caller to write back into the form — that write-back
 * is what keeps a re-save idempotent (PATCH, not a duplicate POST). Requires an
 * existing payer. Throws on API failure.
 */
export async function reconcileSecondaries(
  payerId: number,
  secondaries: TenantInput[]
): Promise<Secondary[]> {
  for (const s of secondaries) {
    if (s.tenantId) await updateTenant(payerId, s.tenantId, buildTenant(s))
    else await addSecondaryTenant(payerId, buildTenant(s))
  }
  const d = await fetchPayerDetail(payerId)
  return (d.tenants ?? []).filter((t) => !t.primary).map(tenantToSecondary)
}

/** Remove one server-backed secondary tenant from a DRAFT payer. The page calls
   this eagerly when a saved secondary row is removed (the primary is protected
   server-side, so this is only ever a secondary). Throws on API failure. */
export async function deleteSecondary(
  payerId: number,
  tenantId: number
): Promise<void> {
  await deleteTenant(payerId, tenantId)
}

/**
 * Persist ONE wizard step to the server (save-as-you-go), returning the updated
 * draft state. The payer is created on the first `primary` save; on later saves
 * `primary` PATCHes the primary tenant (the 2026-06-24 update endpoint). Steps:
 *   - primary    → create once, then PATCH the primary tenant on later saves
 *   - secondary  → reconciled by the page (reconcileSecondaries), which writes the
 *                  new tenant ids back into the form, so it's a no-op here
 *   - modules    → PUT entitlements (idempotent replace)
 *   - billing    → PUT entitlements (subscription needs ≥1) then PUT subscription
 *   - documents  → POST each document whose category isn't already saved
 * Throws on API failure.
 */
export async function persistStep(
  step: WizStepKey,
  input: OnboardInput,
  state: DraftState
): Promise<DraftState> {
  let { payerId, tenantId, payerCode } = state
  let { savedDocCategories } = state

  switch (step) {
    case "primary": {
      if (payerId) {
        // Already created — PATCH the primary tenant with the latest fields.
        if (tenantId)
          await updateTenant(payerId, tenantId, buildTenant(input.primary))
        break
      }
      const p = await createPayer({
        payer_type: payerTypeCode(input.payerType),
        primary_tenant: buildTenant(input.primary),
      })
      payerId = p.id
      tenantId = p.primaryTenantId ?? 0
      payerCode = p.code
      break
    }
    case "secondary":
      // Handled by the page via reconcileSecondaries (it must write the returned
      // tenant ids back into the form), so there's nothing to do here.
      break
    case "modules": {
      if (!payerId || !input.entitlements.length) break
      await setEntitlements(payerId, toEntitlementsRequest(input.entitlements))
      break
    }
    case "billing": {
      // Subscription requires ≥1 entitlement — skip (defer to submit) if none yet.
      if (
        !payerId ||
        !input.subscription?.pricingStructureId ||
        !input.entitlements.length
      )
        break
      await setEntitlements(payerId, toEntitlementsRequest(input.entitlements))
      await setSubscription(payerId, toSubscriptionRequest(input.subscription))
      break
    }
    case "documents": {
      if (!payerId || !tenantId) break
      const skip = new Set(savedDocCategories)
      for (const d of input.documents) {
        if (!d.file) continue // already on the server (resume)
        if (skip.has(d.category)) continue
        await addDocument(payerId, tenantId, {
          file: d.file,
          category: d.category,
          expiryDate: d.expiryDate,
          description: d.description,
        })
        savedDocCategories = [...savedDocCategories, d.category]
      }
      break
    }
    case "review":
      break
  }

  return { payerId, tenantId, payerCode, savedDocCategories }
}
