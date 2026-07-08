/* Thin service functions for the Tenant accounts (Payers) domain — list +
   the full onboarding write flow (§8). Returns mapped client types. */

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  apiUpload,
} from "@/lib/api/client"
import { toPaged, type Paged, type PagedDTO } from "@/lib/api/paged"

import {
  toDocumentDownload,
  toOnboardingDraft,
  toLifecycleRequest,
  toOnboardingProgress,
  toPayer,
  toPayerActivity,
  type CreatePayerRequest,
  type DocumentDownload,
  type DocumentDownloadDTO,
  type LifecycleRequest,
  type LifecycleRequestDTO,
  type OnboardingDraft,
  type OnboardingDraftDTO,
  type OnboardingProgress,
  type OnboardingProgressDTO,
  type Payer,
  type PayerActivity,
  type PayerActivityDTO,
  type PayerDTO,
  type SetEntitlementsRequest,
  type SetSubscriptionRequest,
  type SubdomainCheck,
  type SuspendReason,
  type TenantDetailsRequest,
  type TenantLookup,
  type UpdateTenantRequest,
} from "./types"

/** A document to upload (multipart). `file` carries the bytes. */
export type UploadDocumentInput = {
  file: File
  /** Required when creating; ignored when replacing via `fileId`. */
  category?: string
  description?: string
  expiryDate?: string
  /** Existing document's document-service file id — replaces that document's
     file in place instead of creating a new one. §8.5 "replace". */
  fileId?: string
}

const BASE = "/platform/payers"

/** Payer properties the list endpoint can sort by (API_REFERENCE §payers list). */
export type PayerSortField = "createdAt" | "payerId" | "status" | "payerType"
export type SortDir = "asc" | "desc"

/** Server-side query params for the payers list (each omitted when unset). */
export type ListPayersParams = {
  /** Lifecycle status: DRAFT | ACTIVE | SUSPENDED | RETIRED. */
  status?: string
  /** Payer type: INSURER | TPA | SELF_MANAGED_SCHEME. */
  payerType?: string
  /** Created-at window (ISO yyyy-MM-dd), inclusive. */
  fromDate?: string
  toDate?: string
  /** 0-based page index. */
  page?: number
  /** Page size (API default 20). */
  size?: number
  /** Sort field + direction (API default createdAt,desc). */
  sort?: { field: PayerSortField; dir: SortDir }
}

/** GET /platform/payers → a page of payers; filter/sort/paginate server-side. */
export async function fetchPayers(
  params: ListPayersParams = {}
): Promise<Paged<Payer>> {
  const query: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  }
  if (params.status) query.status = params.status
  if (params.payerType) query.payer_type = params.payerType
  if (params.fromDate) query.from_date = params.fromDate
  if (params.toDate) query.to_date = params.toDate
  if (params.sort) query.sort = `${params.sort.field},${params.sort.dir}`
  const dto = await apiGet<PagedDTO<PayerDTO>>(BASE, { params: query })
  return toPaged(dto, toPayer)
}

/** GET /platform/payers/{id} → one payer (mapped list shape). */
export async function fetchPayer(id: number): Promise<Payer> {
  return toPayer(await apiGet<PayerDTO>(`${BASE}/${id}`))
}

/** GET /platform/payers/{id} → the raw detail DTO (for resume rehydration). */
export async function fetchPayerDetail(id: number): Promise<PayerDTO> {
  return apiGet<PayerDTO>(`${BASE}/${id}`)
}

/* ----------------------------------------- onboarding steps / progress (§8.9) --- */

/** GET …/{payerId}/steps → step list + progress (drives the draft cards). */
export async function fetchOnboardingSteps(
  payerId: number
): Promise<OnboardingProgress> {
  return toOnboardingProgress(
    await apiGet<OnboardingProgressDTO>(`${BASE}/${payerId}/steps`)
  )
}

/** GET …/onboarding-drafts → every DRAFT payer's identity + onboarding progress
   in one call. Self-sufficient (carries name/code/country/type), so the drafts
   strip needs no separate payers-list fetch. Replaces the old N-per-draft /steps
   fan-out. */
export async function fetchOnboardingDrafts(): Promise<OnboardingDraft[]> {
  const rows = await apiGet<OnboardingDraftDTO[]>(`${BASE}/onboarding-drafts`)
  return (rows ?? []).map(toOnboardingDraft)
}

/** POST …/{payerId}/steps/{stepKey}/assign → assign a step to a member email. */
export async function assignStep(
  payerId: number,
  stepKey: string,
  assignee: string | null
): Promise<OnboardingProgress> {
  return toOnboardingProgress(
    await apiPost<OnboardingProgressDTO>(
      `${BASE}/${payerId}/steps/${stepKey}/assign`,
      { assignee }
    )
  )
}

/* ----------------------------------------------- onboarding pre-checks --- */

/** GET …/subdomain-check?value= → sanitise + availability + suggestions. */
export async function checkSubdomain(value: string): Promise<SubdomainCheck> {
  return apiGet<SubdomainCheck>(`${BASE}/subdomain-check`, {
    params: { value },
  })
}

/** GET …/tenant-lookup → duplicate detection by legal name and/or tax number. */
export async function lookupTenant(query: {
  legalEntityName?: string
  taxVatNumber?: string
}): Promise<TenantLookup> {
  const params: Record<string, string> = {}
  if (query.legalEntityName) params.legal_entity_name = query.legalEntityName
  if (query.taxVatNumber) params.tax_vat_number = query.taxVatNumber
  const r = await apiGet<{
    found: boolean
    matched_by: string[]
    tenant: {
      legal_entity_name: string
      tenant_code: string
      country: string | null
      payer_status: string | null
    } | null
  }>(`${BASE}/tenant-lookup`, { params })
  return {
    found: r?.found ?? false,
    matchedBy: r?.matched_by ?? [],
    tenant: r?.tenant
      ? {
          legalEntityName: r.tenant.legal_entity_name,
          tenantCode: r.tenant.tenant_code,
          country: r.tenant.country,
          payerStatus: r.tenant.payer_status,
        }
      : null,
  }
}

/* -------------------------------------------------- onboarding writes --- */

/** POST /platform/payers → create payer + primary tenant (DRAFT). */
export async function createPayer(body: CreatePayerRequest): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(BASE, body))
}

/** POST …/{payerId}/tenants → add a secondary tenant. */
export async function addSecondaryTenant(
  payerId: number,
  body: TenantDetailsRequest
): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(`${BASE}/${payerId}/tenants`, body))
}

/** PATCH …/{payerId}/tenants/{tenantId} → partial-update a tenant (DRAFT only).
   Edits the primary or any secondary tenant's profile fields; omitted keys are
   left unchanged. Returns the refreshed payer aggregate. */
export async function updateTenant(
  payerId: number,
  tenantId: number,
  body: UpdateTenantRequest
): Promise<Payer> {
  return toPayer(
    await apiPatch<PayerDTO>(`${BASE}/${payerId}/tenants/${tenantId}`, body)
  )
}

/** DELETE …/{payerId}/tenants/{tenantId} → remove a secondary tenant (DRAFT
   only; the primary is protected server-side). */
export async function deleteTenant(
  payerId: number,
  tenantId: number
): Promise<void> {
  await apiDelete(`${BASE}/${payerId}/tenants/${tenantId}`)
}

/** PUT …/{payerId}/entitlements → replace the entitlement set. */
export async function setEntitlements(
  payerId: number,
  body: SetEntitlementsRequest
): Promise<Payer> {
  return toPayer(await apiPut<PayerDTO>(`${BASE}/${payerId}/entitlements`, body))
}

/** PUT …/{payerId}/subscription → set the subscription (ACTIVE structure). */
export async function setSubscription(
  payerId: number,
  body: SetSubscriptionRequest
): Promise<Payer> {
  return toPayer(await apiPut<PayerDTO>(`${BASE}/${payerId}/subscription`, body))
}

/** POST …/{payerId}/tenants/{tenantId}/documents → upload a document
   (multipart/form-data; the `file` part carries the bytes). Create mode
   (no `fileId`) requires `category`; replace mode (`fileId` set) swaps the
   bytes behind that document in place and ignores `category`. §8.5. */
export async function addDocument(
  payerId: number,
  tenantId: number,
  doc: UploadDocumentInput
): Promise<Payer> {
  const fd = new FormData()
  if (doc.fileId) {
    fd.append("file_id", doc.fileId)
  } else if (doc.category) {
    fd.append("category", doc.category)
  }
  if (doc.description) fd.append("description", doc.description)
  if (doc.expiryDate) fd.append("expiry_date", doc.expiryDate)
  fd.append("file", doc.file, doc.file.name)
  return toPayer(
    await apiUpload<PayerDTO>(
      `${BASE}/${payerId}/tenants/${tenantId}/documents`,
      fd
    )
  )
}

/** GET …/{payerId}/tenants/{tenantId}/documents/{documentId} → metadata + a
   freshly-issued pre-signed download URL. §8.5.1. */
export async function fetchDocumentDownload(
  payerId: number,
  tenantId: number,
  documentId: string
): Promise<DocumentDownload> {
  return toDocumentDownload(
    await apiGet<DocumentDownloadDTO>(
      `${BASE}/${payerId}/tenants/${tenantId}/documents/${documentId}`
    )
  )
}

/** Replace the file behind an already-uploaded document (e.g. the wrong file
   was attached): looks up its file_id, then re-uploads the new bytes against
   it in place — same document_id/category, status resets to PENDING_REVIEW.
   §8.5 "replace". */
export async function replaceDocument(
  payerId: number,
  tenantId: number,
  documentId: string,
  file: File
): Promise<Payer> {
  const { fileId } = await fetchDocumentDownload(payerId, tenantId, documentId)
  return addDocument(payerId, tenantId, { file, fileId })
}

/** POST …/{payerId}/submit → validate + submit for approval. */
export async function submitPayer(payerId: number): Promise<Payer> {
  return toPayer(await apiPost<PayerDTO>(`${BASE}/${payerId}/submit`))
}

/** POST …/{payerId}/tenants/{tenantId}/activate → activate a tenant. Admin-only;
   the payer must already be ACTIVE (brings up a secondary tenant). */
export async function activateTenant(
  payerId: number,
  tenantId: number
): Promise<Payer> {
  return toPayer(
    await apiPost<PayerDTO>(`${BASE}/${payerId}/tenants/${tenantId}/activate`)
  )
}

/* ----------------------------------- payer lifecycle (maker-checker) --- */

/* The maker RAISES a change request; the payer stays in its current state until a
   checker approves it (POST …/lifecycle-requests/{id}/approve). All three raise
   endpoints return a LifecycleRequest (status PENDING), not the payer. */

/** POST …/{payerId}/suspend → raise a SUSPEND request. `reason` enum required;
   `note` optional free text for the audit trail. */
export async function suspendPayer(
  payerId: number,
  reason: SuspendReason,
  note?: string
): Promise<LifecycleRequest> {
  return toLifecycleRequest(
    await apiPost<LifecycleRequestDTO>(`${BASE}/${payerId}/suspend`, {
      reason,
      ...(note ? { note } : {}),
    })
  )
}

/** POST …/{payerId}/reactivate → raise a REACTIVATE request. `note` optional. */
export async function reactivatePayer(
  payerId: number,
  note?: string
): Promise<LifecycleRequest> {
  return toLifecycleRequest(
    await apiPost<LifecycleRequestDTO>(
      `${BASE}/${payerId}/reactivate`,
      note ? { note } : {}
    )
  )
}

/** POST …/{payerId}/retire → raise a RETIRE request. `reason` mandatory free
   text; `note` optional. */
export async function retirePayer(
  payerId: number,
  reason: string,
  note?: string
): Promise<LifecycleRequest> {
  return toLifecycleRequest(
    await apiPost<LifecycleRequestDTO>(`${BASE}/${payerId}/retire`, {
      reason,
      ...(note ? { note } : {}),
    })
  )
}

/** GET …/{payerId}/lifecycle-requests → the change-request history (newest
   first), including the currently PENDING one if any. */
export async function fetchLifecycleRequests(
  payerId: number
): Promise<LifecycleRequest[]> {
  const rows = await apiGet<LifecycleRequestDTO[]>(
    `${BASE}/${payerId}/lifecycle-requests`
  )
  return (rows ?? []).map(toLifecycleRequest)
}

/** POST …/{payerId}/lifecycle-requests/{requestId}/approve|reject → the checker's
   decision. Approve executes the transition; reject leaves the payer unchanged.
   `comment` is recorded (mandatory for reject). */
export async function decideLifecycleRequest(
  payerId: number,
  requestId: string,
  decision: "approve" | "reject",
  comment?: string
): Promise<LifecycleRequest> {
  return toLifecycleRequest(
    await apiPost<LifecycleRequestDTO>(
      `${BASE}/${payerId}/lifecycle-requests/${requestId}/${decision}`,
      { comment }
    )
  )
}

/** GET …/{payerId}/activity → the payer's audit trail (newest first, paged).
   Drives the record's Activity tab. Admin or approver. */
export async function fetchPayerActivity(
  payerId: number,
  page = 0,
  size = 20
): Promise<PayerActivity[]> {
  const res = await apiGet<{ content?: PayerActivityDTO[] } | PayerActivityDTO[]>(
    `${BASE}/${payerId}/activity`,
    { params: { page, size, sort: "createdAt,desc" } }
  )
  const rows = Array.isArray(res) ? res : (res?.content ?? [])
  return rows.map(toPayerActivity)
}
