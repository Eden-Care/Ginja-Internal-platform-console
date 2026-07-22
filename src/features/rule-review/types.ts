/* Rule review dashboard (Claim Clean-up / LAMU) — the signed-in reviewer's
   assignment queue from `GET /platform/rule-review/dashboard`. snake_case DTOs,
   camelCase client types, and the mapper between them. Shape verified against
   the live dev API (2026-07-22); the Postman collection is the contract. */

import { format } from "date-fns"

import type { ExtractionReviewStatus } from "@/features/rule-extraction/types"

/* -------------------------------------------------------------- DTOs */

export type RuleReviewAssignmentDTO = {
  extraction_id: number
  job_id: string
  /** Human contract code — currently null on dev; routing uses the ids below. */
  contract_code: string | null
  provider_account_id: string
  provider_name: string | null
  insurer_account_id: string
  insurer_name: string | null
  review_status: ExtractionReviewStatus
  published: boolean
  contract_filename: string | null
  rules_reviewed: number
  rules_total: number
  assigned_at: string | null
  review_due_at: string | null
  review_completed_at: string | null
}

export type RuleReviewDashboardDTO = {
  assigned_to_me: number
  rules_to_review: number
  completed: number
  assignments: RuleReviewAssignmentDTO[]
}

/* ----------------------------------------------------------- client */

export type RuleReviewAssignment = {
  extractionId: number
  jobId: string
  /** provider display id (SP-…) — the routing key for the review workspace. */
  providerCode: string
  /** Falls back to the provider code until the backend populates the name. */
  providerName: string
  insurerAccountId: string
  insurerName: string
  reviewStatus: ExtractionReviewStatus
  published: boolean
  contractFilename: string
  rulesReviewed: number
  rulesTotal: number
  /** Formatted "dd MMM yyyy", "—" when unset. */
  assignedAt: string
  /** Raw ISO due date (null when the backend hasn't set one) — the page
      derives the "Due in N days" badge from it. */
  dueAt: string | null
  completed: boolean
}

export type RuleReviewDashboard = {
  assignedToMe: number
  rulesToReview: number
  completed: number
  assignments: RuleReviewAssignment[]
}

/* ---------------------------------------------------------- mappers */

const fmtDate = (iso: string | null) => {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM yyyy")
  } catch {
    return "—"
  }
}

export function toRuleReviewAssignment(
  d: RuleReviewAssignmentDTO
): RuleReviewAssignment {
  return {
    extractionId: d.extraction_id,
    jobId: d.job_id,
    providerCode: d.provider_account_id,
    providerName: d.provider_name ?? d.provider_account_id,
    insurerAccountId: d.insurer_account_id,
    insurerName: d.insurer_name ?? "—",
    reviewStatus: d.review_status,
    published: d.published,
    contractFilename: d.contract_filename ?? "—",
    rulesReviewed: d.rules_reviewed ?? 0,
    rulesTotal: d.rules_total ?? 0,
    assignedAt: fmtDate(d.assigned_at),
    dueAt: d.review_due_at,
    completed: d.review_status === "COMPLETED",
  }
}

export function toRuleReviewDashboard(
  d: RuleReviewDashboardDTO
): RuleReviewDashboard {
  return {
    assignedToMe: d.assigned_to_me ?? 0,
    rulesToReview: d.rules_to_review ?? 0,
    completed: d.completed ?? 0,
    assignments: (d.assignments ?? []).map(toRuleReviewAssignment),
  }
}
