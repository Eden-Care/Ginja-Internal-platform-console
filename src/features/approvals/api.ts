/* Thin service for the Approvals domain. The queue + review are dedicated
   endpoints; decisions return a PayerResponse mapped to the shared Payer type. */

import { apiGet, apiPost } from "@/lib/api/client"
import { toPayer, type Payer, type PayerDTO } from "@/features/payers/types"

import {
  toApprovalQueueItem,
  toApprovalReview,
  type ApprovalDecision,
  type ApprovalQueueItem,
  type ApprovalQueueItemDTO,
  type ApprovalReview,
  type ApprovalReviewDTO,
} from "./types"

/** GET /platform/approvals?status= → the queue rows (pending | approved | all). */
export async function fetchApprovals(
  status?: "pending" | "approved" | "all"
): Promise<ApprovalQueueItem[]> {
  const params = status && status !== "all" ? { status } : undefined
  const rows = await apiGet<ApprovalQueueItemDTO[]>("/platform/approvals", {
    params,
  })
  return (rows ?? []).map(toApprovalQueueItem)
}

/** GET /platform/approvals/{payerId} → full review payload (meta + aggregate). */
export async function fetchApprovalReview(
  payerId: number
): Promise<ApprovalReview> {
  return toApprovalReview(
    await apiGet<ApprovalReviewDTO>(`/platform/approvals/${payerId}`)
  )
}

/** POST /platform/payers/{payerId}/sections/{sectionKey}/{approve|reject|request-info}
   → record one review section's decision; returns the refreshed review payload
   (its `sections[]` now carry the new review_status). `comment` is mandatory for
   reject / request-info (enforced server-side, 400 otherwise). */
export async function decideSection(
  payerId: number,
  sectionKey: string,
  action: ApprovalDecision,
  comment?: string
): Promise<ApprovalReview> {
  return toApprovalReview(
    await apiPost<ApprovalReviewDTO>(
      `/platform/payers/${payerId}/sections/${sectionKey}/${action}`,
      { comment }
    )
  )
}

/** POST /platform/payers/{payerId}/approve → approve + auto-activate. */
export async function approvePayer(
  payerId: number,
  comment?: string
): Promise<Payer> {
  return toPayer(
    await apiPost<PayerDTO>(`/platform/payers/${payerId}/approve`, { comment })
  )
}

/** POST /platform/payers/{payerId}/reject → reject (comment mandatory). */
export async function rejectPayer(
  payerId: number,
  comment: string
): Promise<Payer> {
  return toPayer(
    await apiPost<PayerDTO>(`/platform/payers/${payerId}/reject`, { comment })
  )
}

/** POST /platform/payers/{payerId}/request-info → send back to submitter
   (comment mandatory). */
export async function requestInfo(
  payerId: number,
  comment: string
): Promise<Payer> {
  return toPayer(
    await apiPost<PayerDTO>(`/platform/payers/${payerId}/request-info`, {
      comment,
    })
  )
}
