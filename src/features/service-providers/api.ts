/* Service Providers — API service layer over `/platform/service-providers`.
 * Functions return mapped client types (never raw DTOs) and log raw responses
 * for diagnostics, mirroring `src/features/insurers/api.ts`. The path param is
 * the draft_code (SPO-…) throughout the lifecycle. */

import { apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api/client"
import {
  CLASSIFICATION_TO_ENUM,
  DOC_TYPE_TO_ENUM,
  INTEGRATION_TO_ENUM,
  OWNERSHIP_TO_ENUM,
  PROVIDER_TYPE_TO_ENUM,
  SECTION_TO_ENUM,
  SERVICE_TO_ENUM,
  TIER_TO_ENUM,
  toAuditEntry,
  toDocument,
  toReview,
  toReviewQueue,
  toServiceProvider,
  type DirectoryDTO,
  type ServiceProvider,
  type ServiceProviderDTO,
  type SpAuditDTO,
  type SpAuditEntry,
  type SpDirectory,
  type SpDocument,
  type SpDocumentDTO,
  type SpReview,
  type SpReviewDTO,
  type SpReviewQueue,
  type SpReviewQueueDTO,
} from "./types"

const BASE = "/platform/service-providers"

export type ListParams = {
  q?: string
  type?: string
  status?: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "INACTIVE"
  page?: number
  size?: number
}

/** GET the directory — summary tiles + a page of providers (mapped). */
export async function fetchServiceProvidersDirectory(
  params: ListParams = {}
): Promise<SpDirectory> {
  const dto = await apiGet<DirectoryDTO>(BASE, {
    params: { page: 0, size: 200, ...params },
  })
  console.log(`[GET ${BASE}] directory`, dto)
  return {
    summary: {
      total: dto.summary.total,
      active: dto.summary.active,
      pendingReview: dto.summary.pending_review,
      inactive: dto.summary.inactive,
    },
    providers: dto.providers.content.map(toServiceProvider),
    totalElements: dto.providers.total_elements,
  }
}

/** GET one provider profile. */
export async function fetchServiceProvider(code: string): Promise<ServiceProvider> {
  const dto = await apiGet<ServiceProviderDTO>(`${BASE}/${code}`)
  return toServiceProvider(dto)
}

/** GET the audit trail (mapped, newest first as returned). */
export async function fetchProviderAudit(code: string): Promise<SpAuditEntry[]> {
  const dto = await apiGet<SpAuditDTO[]>(`${BASE}/${code}/audit`)
  return (dto ?? []).map(toAuditEntry)
}

/** GET the document slots (uploaded status + signed URLs). */
export async function fetchProviderDocuments(code: string): Promise<SpDocument[]> {
  const dto = await apiGet<SpDocumentDTO[]>(`${BASE}/${code}/documents`)
  return (dto ?? []).map(toDocument)
}

/* ------------------------------- writes ------------------------------- */

/** The wizard form (display strings) — mapped to enum bodies here. */
export type SpFormInput = {
  name: string
  type: string
  cls: string
  tier: string
  ownership: string
  country?: string
  county?: string
  town?: string
  address?: string
  contact?: string
  role?: string
  email?: string
  phone?: string
  hims?: string
  claimsMonth?: string
  integration?: string
  services?: string[]
  reg?: string
  kra?: string
  shif?: string
}

const trimOrNull = (v?: string) => (v && v.trim() ? v.trim() : null)

/** POST create a draft from the Provider-profile section → the draft (mapped). */
export async function createProvider(input: SpFormInput): Promise<ServiceProvider> {
  const body = {
    name: input.name.trim(),
    provider_type: PROVIDER_TYPE_TO_ENUM[input.type] ?? input.type,
    classification: CLASSIFICATION_TO_ENUM[input.cls] ?? input.cls,
    tier: TIER_TO_ENUM[input.tier] ?? input.tier,
    ownership: OWNERSHIP_TO_ENUM[input.ownership] ?? input.ownership,
  }
  const dto = await apiPost<ServiceProviderDTO>(BASE, body)
  console.log(`[POST ${BASE}] create`, dto)
  return toServiceProvider(dto)
}

/** PATCH save wizard sections onto an existing draft → the draft (mapped). */
export async function updateProvider(
  code: string,
  input: SpFormInput
): Promise<ServiceProvider> {
  const body = {
    name: input.name.trim(),
    provider_type: PROVIDER_TYPE_TO_ENUM[input.type] ?? input.type,
    classification: CLASSIFICATION_TO_ENUM[input.cls] ?? input.cls,
    tier: TIER_TO_ENUM[input.tier] ?? input.tier,
    ownership: OWNERSHIP_TO_ENUM[input.ownership] ?? input.ownership,
    country: trimOrNull(input.country),
    county_region: trimOrNull(input.county),
    town_city: trimOrNull(input.town),
    physical_address: trimOrNull(input.address),
    contact_name: trimOrNull(input.contact),
    contact_role: trimOrNull(input.role),
    contact_email: trimOrNull(input.email),
    contact_phone: trimOrNull(input.phone),
    hims_name: trimOrNull(input.hims),
    claims_per_month: input.claimsMonth ? Number(input.claimsMonth) : null,
    integration_status: input.integration
      ? (INTEGRATION_TO_ENUM[input.integration] ?? input.integration)
      : null,
    services_offered: (input.services ?? []).map((s) => SERVICE_TO_ENUM[s] ?? s),
    facility_registration_no: trimOrNull(input.reg),
    kra_pin: trimOrNull(input.kra),
    shif_sha_accreditation: trimOrNull(input.shif),
  }
  const dto = await apiPatch<ServiceProviderDTO>(`${BASE}/${code}`, body)
  console.log(`[PATCH ${BASE}/${code}] update`, dto)
  return toServiceProvider(dto)
}

/** POST submit a completed draft for approval → the provider (Pending review). */
export async function submitProvider(code: string): Promise<ServiceProvider> {
  const dto = await apiPost<ServiceProviderDTO>(`${BASE}/${code}/submit`)
  console.log(`[POST ${BASE}/${code}/submit]`, dto)
  return toServiceProvider(dto)
}

/** POST deactivate (reason required) → the updated provider. */
export async function deactivateProvider(
  code: string,
  reason: string
): Promise<ServiceProvider> {
  const dto = await apiPost<ServiceProviderDTO>(`${BASE}/${code}/deactivate`, {
    reason,
  })
  return toServiceProvider(dto)
}

/** POST reactivate → the updated provider. */
export async function reactivateProvider(code: string): Promise<ServiceProvider> {
  const dto = await apiPost<ServiceProviderDTO>(`${BASE}/${code}/reactivate`)
  return toServiceProvider(dto)
}

/** POST approve & activate a pending provider (API gates on review readiness). */
export async function approveProvider(code: string): Promise<ServiceProvider> {
  const dto = await apiPost<ServiceProviderDTO>(`${BASE}/${code}/approve`)
  return toServiceProvider(dto)
}

/** POST send a pending provider back to the specialist with a note. */
export async function sendBackProvider(
  code: string,
  note: string
): Promise<void> {
  await apiPost(`${BASE}/${code}/send-back`, { note })
}

/** POST upload a document into a wizard slot (multipart). */
export async function uploadProviderDocument(
  code: string,
  docSlotKey: string,
  file: File
): Promise<SpDocument> {
  const docEnum = DOC_TYPE_TO_ENUM[docSlotKey] ?? docSlotKey
  const form = new FormData()
  form.append("file", file)
  const dto = await apiUpload<SpDocumentDTO>(
    `${BASE}/${code}/documents/${docEnum}`,
    form
  )
  return toDocument(dto)
}

/* ------------------------------- review ------------------------------- */

export async function fetchReviewQueue(): Promise<SpReviewQueue> {
  const dto = await apiGet<SpReviewQueueDTO>(`${BASE}/review-queue`)
  console.log(`[GET ${BASE}/review-queue]`, dto)
  return toReviewQueue(dto)
}

export async function fetchProviderReview(code: string): Promise<SpReview> {
  const dto = await apiGet<SpReviewDTO>(`${BASE}/${code}/review`)
  return toReview(dto)
}

/** POST add a review remark on a section. The caller refetches the review. */
export async function addRemark(
  code: string,
  input: { sectionKey: string; severity: "action" | "note"; body: string }
): Promise<void> {
  await apiPost(`${BASE}/${code}/remarks`, {
    section: SECTION_TO_ENUM[input.sectionKey] ?? input.sectionKey.toUpperCase(),
    type: input.severity === "action" ? "ACTION_REQUIRED" : "NOTE",
    body: input.body,
  })
}

/** POST resolve a remark. The caller refetches the review. */
export async function resolveRemark(
  code: string,
  remarkId: string
): Promise<void> {
  await apiPost(`${BASE}/${code}/remarks/${remarkId}/resolve`)
}

/** POST mark a review section reviewed ("Clear"). The caller refetches. */
export async function markSectionReviewed(
  code: string,
  sectionKey: string
): Promise<void> {
  const section = SECTION_TO_ENUM[sectionKey] ?? sectionKey.toUpperCase()
  await apiPost(`${BASE}/${code}/review/sections/${section}/reviewed`)
}
