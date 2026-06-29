/* Approvals domain — the maker-checker gate over submitted payers.

   The queue (GET /platform/approvals) returns lean row DTOs; the review
   (GET /platform/approvals/{payerId}) returns review meta + the full payer
   aggregate. Decisions return a PayerResponse. See API_REFERENCE.md "Approvals". */

import { toPayer, type Payer, type PayerDTO } from "@/features/payers/types"

export type { Payer } from "@/features/payers/types"

/** ApprovalActionRequest — `comment` is optional for approve, mandatory for
   reject / request-info (enforced server-side). */
export type ApprovalActionRequest = { comment?: string }

/** A decision the approver can take — on the whole payer or one review section. */
export type ApprovalDecision = "approve" | "reject" | "request-info"

/** Per-section review state returned in the review payload's `sections[]`.
   PENDING = undecided; the rest mirror the three decisions. */
export type ReviewSectionStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INFO_REQUESTED"

/** The four decidable review sections (no key for secondary tenants — see
   review.tsx, where secondary detail is folded into primary_tenant_details). */
export type ReviewSectionKey =
  | "primary_tenant_details"
  | "module_entitlements"
  | "subscription_billing"
  | "kyb_documents"

/** Per-row queue status (the directory tabs). */
export type ApprovalStatus = "PENDING" | "APPROVED"

/* --------------------------------------------------------- queue rows --- */

/** What a queue row represents: an onboarding submission, or a maker-checker
   lifecycle change (suspend / reactivate / retire). */
export type ApprovalKind = "ONBOARDING" | "LIFECYCLE"
export type LifecycleAction = "SUSPEND" | "REACTIVATE" | "RETIRE"

export type ApprovalQueueItemDTO = {
  id: number
  request_id: string
  kind?: ApprovalKind | string | null
  /** Set on LIFECYCLE rows — the LCR… id the decision endpoints target. */
  lifecycle_request_id?: string | null
  /** Set on LIFECYCLE rows — SUSPEND | REACTIVATE | RETIRE. */
  action?: LifecycleAction | string | null
  type: string
  tenant: string
  payer_type: string | null
  submitted_by: string | null
  submitted_at: string | null
  priority: string | null
  status: ApprovalStatus | string
  tenants: number | null
  documents: number | null
}

export type ApprovalQueueItem = {
  /** Numeric payer id (path param for review + decisions). */
  id: number
  /** Human request reference, e.g. PAY000210. */
  requestId: string
  /** Onboarding submission or a lifecycle change request. */
  kind: ApprovalKind
  /** LCR… id for LIFECYCLE rows (null for onboarding). */
  lifecycleRequestId: string | null
  /** SUSPEND | REACTIVATE | RETIRE for LIFECYCLE rows (null for onboarding). */
  action: LifecycleAction | null
  /** Human request type, e.g. "Tenant onboarding" / "Tenant suspension". */
  type: string
  /** Tenant (primary legal entity) name. */
  tenant: string
  payerType: string | null
  submittedBy: string | null
  submittedAt: string | null
  /** Not yet modeled by the API (always null today). */
  priority: string | null
  status: ApprovalStatus
  tenants: number
  documents: number
}

export function toApprovalQueueItem(d: ApprovalQueueItemDTO): ApprovalQueueItem {
  return {
    id: d.id,
    requestId: d.request_id,
    kind: (d.kind as ApprovalKind) ?? "ONBOARDING",
    lifecycleRequestId: d.lifecycle_request_id ?? null,
    action: (d.action as LifecycleAction) ?? null,
    type: d.type || "Tenant onboarding",
    tenant: d.tenant,
    payerType: d.payer_type ?? null,
    submittedBy: d.submitted_by,
    submittedAt: d.submitted_at,
    priority: d.priority,
    status: (d.status as ApprovalStatus) ?? "PENDING",
    tenants: d.tenants ?? 0,
    documents: d.documents ?? 0,
  }
}

/* ------------------------------------------------------ review payload --- */

/** One entry of the review payload's `sections[]` — the persisted per-section
   decision. `decided_by` is the member id as a string. */
export type ReviewSectionDTO = {
  key: string
  label: string
  review_status?: ReviewSectionStatus | string | null
  decided_by?: string | null
  decided_by_name?: string | null
  comment?: string | null
  decided_at?: string | null
}

export type ReviewSection = {
  key: string
  label: string
  status: ReviewSectionStatus
  decidedBy: string | null
  decidedByName: string | null
  comment: string | null
  decidedAt: string | null
}

export function toReviewSection(d: ReviewSectionDTO): ReviewSection {
  return {
    key: d.key,
    label: d.label,
    status: (d.review_status as ReviewSectionStatus) || "PENDING",
    decidedBy: d.decided_by ?? null,
    decidedByName: d.decided_by_name ?? null,
    comment: d.comment ?? null,
    decidedAt: d.decided_at ?? null,
  }
}

/** GET /platform/approvals/{payerId}. Header + review meta + per-section
   decisions (`sections`) + the full payer aggregate. Read defensively — only
   `payer` is relied on for the section content; the meta flags drive gating
   with client-side fallbacks. */
export type ApprovalReviewDTO = {
  id?: number
  request_id?: string
  tenant?: string
  payer_type?: string | null
  submitted_by?: string | null
  submitted_at?: string | null
  status?: ApprovalStatus | string | null
  own_submission?: boolean | null
  provisioning_complete?: boolean | null
  can_decide?: boolean | null
  /** True once every review section is APPROVED — the gate for the final approve. */
  all_sections_approved?: boolean | null
  sections?: ReviewSectionDTO[] | null
  auto_activate_note?: string | null
  payer?: PayerDTO | null
}

export type ApprovalReview = {
  /** Raw payer aggregate — drives the review section content. */
  payer: PayerDTO
  /** Mapped header view (code, name, submittedBy/At). */
  header: Payer
  status: ApprovalStatus | null
  /** Server-resolved separation of duties (null = not provided → use fallback). */
  ownSubmission: boolean | null
  canDecide: boolean | null
  /** Whether every tenant is provisioned (approval gate). */
  provisioningComplete: boolean | null
  /** Whether every review section is APPROVED (the per-section approve gate). */
  allSectionsApproved: boolean
  /** Persisted per-section decisions (drives the checklist; rehydrates on reload). */
  sections: ReviewSection[]
  autoActivateNote: string | null
}

export function toApprovalReview(d: ApprovalReviewDTO): ApprovalReview {
  const payer = (d.payer ?? {}) as PayerDTO
  return {
    payer,
    header: toPayer(payer),
    status: (d.status as ApprovalStatus) ?? null,
    ownSubmission: d.own_submission ?? null,
    canDecide: d.can_decide ?? null,
    provisioningComplete: d.provisioning_complete ?? null,
    allSectionsApproved: d.all_sections_approved ?? false,
    sections: (d.sections ?? []).map(toReviewSection),
    autoActivateNote: d.auto_activate_note ?? null,
  }
}
