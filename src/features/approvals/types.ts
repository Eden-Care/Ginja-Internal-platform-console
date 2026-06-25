/* Approvals domain — the maker-checker gate over submitted payers.

   The queue (GET /platform/approvals) returns lean row DTOs; the review
   (GET /platform/approvals/{payerId}) returns review meta + the full payer
   aggregate. Decisions return a PayerResponse. See API_REFERENCE.md "Approvals". */

import { toPayer, type Payer, type PayerDTO } from "@/features/payers/types"

export type { Payer } from "@/features/payers/types"

/** ApprovalActionRequest — `comment` is optional for approve, mandatory for
   reject / request-info (enforced server-side). */
export type ApprovalActionRequest = { comment?: string }

/** A decision the approver can take on a submitted payer. */
export type ApprovalDecision = "approve" | "reject" | "request-info"

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

/** GET /platform/approvals/{payerId}. Header + review meta + the full payer
   aggregate. Read defensively — only `payer` is relied on for the section
   content; the meta flags drive gating with client-side fallbacks. */
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
    autoActivateNote: d.auto_activate_note ?? null,
  }
}
