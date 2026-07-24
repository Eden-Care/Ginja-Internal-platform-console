/* Service functions for `/platform/service-providers/{code}/rule-extraction`.
   All return mapped client types — never raw DTOs. */

import { apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api/client"
import {
  toExtraction,
  toExtractionSummary,
  type Extraction,
  type ExtractionDTO,
  type ExtractionSummary,
  type ExtractionSummaryDTO,
  type RuleReviewStatus,
} from "./types"

const base = (code: string) =>
  `/platform/service-providers/${code}/rule-extraction`

/** GET …/rule-extraction — one row per insurer (current extractions). */
export async function fetchExtractionsOverview(
  code: string
): Promise<ExtractionSummary[]> {
  const dto = await apiGet<ExtractionSummaryDTO[]>(base(code))
  return dto.map(toExtractionSummary)
}

/** GET …/rule-extraction/{ins} — the current (latest) full extraction.
    When the pair has none the API replies **200 with a null result** (older
    behaviour was a 404); both are surfaced as `null` = "no contract yet". */
export async function fetchCurrentExtraction(
  code: string,
  insurerAccountId: string
): Promise<Extraction | null> {
  const dto = await apiGet<ExtractionDTO | null>(
    `${base(code)}/${insurerAccountId}`
  )
  return dto ? toExtraction(dto) : null
}

/** GET …/rule-extraction/jobs/{jobId} — one extraction by job id, any
    status (same payload as the current endpoint). Lets superseded history
    rows open read-only. */
export async function fetchExtractionJob(
  code: string,
  jobId: string
): Promise<Extraction> {
  const dto = await apiGet<ExtractionDTO>(`${base(code)}/jobs/${jobId}`)
  return toExtraction(dto)
}

/** GET …/rule-extraction/{ins}/history — all jobs for the pair, newest first. */
export async function fetchExtractionHistory(
  code: string,
  insurerAccountId: string
): Promise<ExtractionSummary[]> {
  const dto = await apiGet<ExtractionSummaryDTO[]>(
    `${base(code)}/${insurerAccountId}/history`
  )
  return dto.map(toExtractionSummary)
}

/** POST …/rule-extraction/{ins} — multipart `contract` only; the backend
    fetches the active Rules Extraction Checks catalogue itself.
    Provider must be ACTIVE. Returns the queued extraction. */
export async function startExtraction(
  code: string,
  insurerAccountId: string,
  files: { contract: File }
): Promise<Extraction> {
  const form = new FormData()
  form.append("contract", files.contract)
  const dto = await apiUpload<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}`,
    form
  )
  return toExtraction(dto)
}

export type RuleReviewAction = "APPROVE" | "DISCARD" | "ARCHIVE"

/** POST …/rules/{ruleId}/review — approve / discard / archive one rule. */
export async function reviewRule(
  code: string,
  insurerAccountId: string,
  ruleId: string,
  action: RuleReviewAction,
  comment?: string
): Promise<Extraction> {
  const dto = await apiPost<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/rules/${ruleId}/review`,
    { action, comment: comment || undefined }
  )
  return toExtraction(dto)
}

export type UpdateRuleInput = {
  description?: string
  rule_category?: string
  rule_type?: string
  check_field?: string
  service_category?: string
  rule_logic?: string
  unit_of_application?: string
  severity?: string
  source?: string
  check_ref?: string
  payer?: string
  scheme_category?: string
  confidence?: number
  source_quote?: string
  comment?: string
}

/** PATCH …/rules/{ruleId} — edit rule fields in place (non-null applied). */
export async function updateRule(
  code: string,
  insurerAccountId: string,
  ruleId: string,
  patch: UpdateRuleInput
): Promise<Extraction> {
  const dto = await apiPatch<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/rules/${ruleId}`,
    patch
  )
  return toExtraction(dto)
}

/** Add-manual-rule body — `description` required, everything else optional
    (same field set as `UpdateRuleInput`). */
export type AddManualRuleInput = { description: string } & UpdateRuleInput

/** POST …/{ins}/rules — add a staff-authored rule to the current extraction.
    The backend creates it APPROVED with a `MANUAL-…` id (audited
    PROVIDER_RULE_ADDED) and returns the full, refreshed extraction.
    ADMIN/APPROVER. */
export async function addManualRule(
  code: string,
  insurerAccountId: string,
  body: AddManualRuleInput
): Promise<Extraction> {
  const dto = await apiPost<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/rules`,
    body
  )
  return toExtraction(dto)
}

/** POST …/{ins}/assign — assign an active member to review the rules
    (review workflow: UNASSIGNED → ASSIGNED). Returns the full extraction. */
export async function assignReviewer(
  code: string,
  insurerAccountId: string,
  memberId: number
): Promise<Extraction> {
  const dto = await apiPost<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/assign`,
    { member_id: memberId }
  )
  return toExtraction(dto)
}

/** POST …/{ins}/review-status — advance the review (IN_REVIEW | COMPLETED).
    Returns the full extraction. NOTE: the backend does not validate
    transitions yet (reported) — callers gate the buttons. */
export async function setReviewStatus(
  code: string,
  insurerAccountId: string,
  status: "IN_REVIEW" | "COMPLETED"
): Promise<Extraction> {
  const dto = await apiPost<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/review-status`,
    { status }
  )
  return toExtraction(dto)
}

/** POST …/{ins}/publish — finalise the reviewed rules as the published rules
    book (In review → Published). Requires the current COMPLETED extraction to
    have every rule decided (no PENDING); 409 when already published.
    ADMIN/APPROVER. Returns the full extraction. */
export async function publishRulesBook(
  code: string,
  insurerAccountId: string
): Promise<Extraction> {
  const dto = await apiPost<ExtractionDTO>(
    `${base(code)}/${insurerAccountId}/publish`
  )
  return toExtraction(dto)
}

/** GET …/{ins}/contract — a short-lived presigned URL for the source contract
    of the current extraction. */
export async function fetchContractUrl(
  code: string,
  insurerAccountId: string
): Promise<string> {
  const dto = await apiGet<{ file_url: string }>(
    `${base(code)}/${insurerAccountId}/contract`
  )
  return dto.file_url
}

/** GET …/rules?review_status= — rules of the current extraction, filtered. */
export async function fetchRules(
  code: string,
  insurerAccountId: string,
  reviewStatus?: RuleReviewStatus
) {
  return apiGet(`${base(code)}/${insurerAccountId}/rules`, {
    params: reviewStatus ? { review_status: reviewStatus } : undefined,
  })
}
