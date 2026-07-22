/* Contract rule-extraction domain (Claim Clean-up / LAMU) — snake_case DTOs
   from `/platform/service-providers/{code}/rule-extraction/…`, camelCase
   client types, and the mappers between them. Shapes verified against the
   live dev API (2026-07-17); the Postman collection is the contract. */

import { format } from "date-fns"

import type { BadgeTone } from "@/components/console/tagpill"

/* -------------------------------------------------------------- DTOs */

export type ExtractStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED"
export type RuleReviewStatus = "PENDING" | "APPROVED" | "DISCARDED" | "ARCHIVED"
/** Extraction-level review workflow (assign → start → complete). */
export type ExtractionReviewStatus =
  | "UNASSIGNED"
  | "ASSIGNED"
  | "IN_REVIEW"
  | "COMPLETED"
export type CoverageStatus =
  | "EXTRACTED"
  | "MISSING_FLAGGED"
  | "RECORDED_ABSENT"
  | "SKIPPED"

export type ExtractedRuleDTO = {
  rule_id: string
  payer: string | null
  scheme_category: string | null
  rule_category: string | null
  rule_type: string | null
  description: string
  check_field: string | null
  service_category: string | null
  rule_logic: string | null
  unit_of_application: string | null
  severity: string | null
  source: string | null
  check_ref: string | null
  confidence: number | null
  source_quote: string | null
  review_status: RuleReviewStatus
  review_comment: string | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  manual: boolean
}

export type CoverageCheckDTO = {
  check_id: string
  category: string
  criticality: string
  status: CoverageStatus
  rule_count: number
  note: string | null
}

export type ExtractionMetadataDTO = {
  document_type: string | null
  payer_name: string | null
  healthcare_provider: string | null
  signed_date: string | null
  effective_date: string | null
  duration_term: string | null
  services_covered: string | null
  supersedes: string | null
  linked_master_agreement: string | null
  missing_fields: string[]
}

/** Full extraction — `GET …/rule-extraction/{insurerAccountId}` (current). */
export type ExtractionDTO = {
  id: number
  job_id: string
  account_id: string
  insurer_account_id: string | null
  insurer_name: string | null
  status: ExtractStatus
  current: boolean
  error: string | null
  contract_file_id: string | null
  contract_filename: string | null
  checks_file_id: string | null
  checks_filename: string | null
  model: string | null
  metadata: ExtractionMetadataDTO | null
  rules: ExtractedRuleDTO[] | null
  rule_counts: Partial<Record<RuleReviewStatus, number>> | null
  coverage: CoverageCheckDTO[] | null
  flags: string[] | null
  warnings: string[] | null
  created_by_name: string | null
  created_at: string | null
  started_at: string | null
  completed_at: string | null
  review_status: ExtractionReviewStatus | null
  assignee_id: number | null
  assignee_name: string | null
  assigned_by_name: string | null
  assigned_at: string | null
  review_completed_at: string | null
}

/** Lean row — `GET …/rule-extraction` (overview) and `…/{ins}/history`. */
export type ExtractionSummaryDTO = {
  id: number
  job_id: string
  insurer_account_id: string | null
  insurer_name: string | null
  status: ExtractStatus
  model: string | null
  rule_count: number | null
  contract_filename: string | null
  created_by_name: string | null
  created_at: string | null
  completed_at: string | null
  current: boolean
  review_status: ExtractionReviewStatus | null
  assignee_id: number | null
  assignee_name: string | null
}

/* ------------------------------------------------------- client types */

export type ExtractedRule = {
  ruleId: string
  payer: string
  schemeCategory: string
  category: string
  type: string
  description: string
  checkField: string
  serviceCategory: string
  logic: string
  unit: string
  severity: string
  source: string
  checkRef: string
  confidence: number | null
  quote: string
  reviewStatus: RuleReviewStatus
  reviewComment: string
  reviewedBy: string
  reviewedAt: string
  manual: boolean
}

export type CoverageCheck = {
  checkId: string
  category: string
  criticality: string
  status: CoverageStatus
  ruleCount: number
  note: string
}

export type ExtractionMetadata = {
  documentType: string
  payerName: string
  healthcareProvider: string
  signedDate: string
  effectiveDate: string
  durationTerm: string
  servicesCovered: string
  supersedes: string
  linkedMasterAgreement: string
  missingFields: string[]
}

export type Extraction = {
  id: number
  jobId: string
  accountId: string
  insurerAccountId: string
  insurerName: string
  status: ExtractStatus
  current: boolean
  error: string
  contractFilename: string
  /** Legacy — new jobs upload only the contract (checks come from the
      platform catalogue), so this is null except on old two-file jobs. */
  checksFilename: string | null
  model: string
  metadata: ExtractionMetadata | null
  rules: ExtractedRule[]
  ruleCounts: Partial<Record<RuleReviewStatus, number>>
  coverage: CoverageCheck[]
  flags: string[]
  warnings: string[]
  createdBy: string
  /** Formatted "17 Jul 2026 · 09:19". */
  created: string
  completed: string
  createdAtIso: string
  reviewStatus: ExtractionReviewStatus
  assigneeId: number | null
  assigneeName: string
  assignedBy: string
  /** Formatted, "—" when unassigned. */
  assigned: string
  reviewCompleted: string
}

export type ExtractionSummary = {
  id: number
  jobId: string
  insurerAccountId: string
  insurerName: string
  status: ExtractStatus
  model: string
  ruleCount: number
  contractFilename: string
  createdBy: string
  created: string
  completed: string
  current: boolean
  reviewStatus: ExtractionReviewStatus
  assigneeId: number | null
  assigneeName: string
}

/* ------------------------------------------------------------ mappers */

const fmtDateTime = (iso: string | null) => {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM yyyy · HH:mm")
  } catch {
    return iso
  }
}

export function toExtractedRule(d: ExtractedRuleDTO): ExtractedRule {
  return {
    ruleId: d.rule_id,
    payer: d.payer ?? "—",
    schemeCategory: d.scheme_category ?? "—",
    category: d.rule_category ?? "Other",
    type: d.rule_type ?? "—",
    description: d.description,
    checkField: d.check_field ?? "—",
    serviceCategory: d.service_category ?? "—",
    logic: d.rule_logic ?? "—",
    unit: d.unit_of_application ?? "—",
    severity: d.severity ?? "—",
    source: d.source ?? "—",
    checkRef: d.check_ref ?? "—",
    confidence: d.confidence,
    quote: d.source_quote ?? "",
    reviewStatus: d.review_status,
    reviewComment: d.review_comment ?? "",
    reviewedBy: d.reviewed_by_name ?? "",
    reviewedAt: d.reviewed_at ? fmtDateTime(d.reviewed_at) : "",
    manual: d.manual,
  }
}

export function toCoverageCheck(d: CoverageCheckDTO): CoverageCheck {
  return {
    checkId: d.check_id,
    category: d.category,
    criticality: d.criticality,
    status: d.status,
    ruleCount: d.rule_count,
    note: d.note ?? "",
  }
}

export function toExtraction(d: ExtractionDTO): Extraction {
  return {
    id: d.id,
    jobId: d.job_id,
    accountId: d.account_id,
    insurerAccountId: d.insurer_account_id ?? "",
    insurerName: d.insurer_name ?? "—",
    status: d.status,
    current: d.current,
    error: d.error ?? "",
    contractFilename: d.contract_filename ?? "—",
    checksFilename: d.checks_filename ?? null,
    model: d.model ?? "",
    metadata: d.metadata
      ? {
          documentType: d.metadata.document_type || "—",
          payerName: d.metadata.payer_name || "—",
          healthcareProvider: d.metadata.healthcare_provider || "—",
          signedDate: d.metadata.signed_date || "—",
          effectiveDate: d.metadata.effective_date || "—",
          durationTerm: d.metadata.duration_term || "—",
          servicesCovered: d.metadata.services_covered || "—",
          supersedes: d.metadata.supersedes || "—",
          linkedMasterAgreement: d.metadata.linked_master_agreement || "—",
          missingFields: d.metadata.missing_fields ?? [],
        }
      : null,
    rules: (d.rules ?? []).map(toExtractedRule),
    ruleCounts: d.rule_counts ?? {},
    coverage: (d.coverage ?? []).map(toCoverageCheck),
    flags: d.flags ?? [],
    warnings: d.warnings ?? [],
    createdBy: d.created_by_name ?? "—",
    created: fmtDateTime(d.created_at),
    completed: fmtDateTime(d.completed_at),
    createdAtIso: d.created_at ?? "",
    reviewStatus: d.review_status ?? "UNASSIGNED",
    assigneeId: d.assignee_id,
    assigneeName: d.assignee_name ?? "",
    assignedBy: d.assigned_by_name ?? "",
    assigned: fmtDateTime(d.assigned_at),
    reviewCompleted: fmtDateTime(d.review_completed_at),
  }
}

export function toExtractionSummary(
  d: ExtractionSummaryDTO
): ExtractionSummary {
  return {
    id: d.id,
    jobId: d.job_id,
    insurerAccountId: d.insurer_account_id ?? "",
    insurerName: d.insurer_name ?? "—",
    status: d.status,
    model: d.model ?? "",
    ruleCount: d.rule_count ?? 0,
    contractFilename: d.contract_filename ?? "—",
    createdBy: d.created_by_name ?? "—",
    created: fmtDateTime(d.created_at),
    completed: fmtDateTime(d.completed_at),
    current: d.current,
    reviewStatus: d.review_status ?? "UNASSIGNED",
    assigneeId: d.assignee_id,
    assigneeName: d.assignee_name ?? "",
  }
}

/* --------------------------------------------------------- tone maps */

export const EXTRACT_STATUS_TONE: Record<ExtractStatus, BadgeTone> = {
  QUEUED: "neutral",
  RUNNING: "warning",
  COMPLETED: "success",
  FAILED: "error",
}

export const EXTRACT_REVIEW_TONE: Record<ExtractionReviewStatus, BadgeTone> = {
  UNASSIGNED: "neutral",
  ASSIGNED: "info",
  IN_REVIEW: "warning",
  COMPLETED: "success",
}

export const EXTRACT_REVIEW_LABEL: Record<ExtractionReviewStatus, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned",
  IN_REVIEW: "In review",
  COMPLETED: "Review complete",
}

export const RULE_REVIEW_TONE: Record<RuleReviewStatus, BadgeTone> = {
  PENDING: "neutral",
  APPROVED: "success",
  DISCARDED: "error",
  ARCHIVED: "neutral",
}

export const SEV_TONE: Record<string, BadgeTone> = {
  CRITICAL: "error",
  HIGH: "warning",
  MEDIUM: "primary",
  LOW: "neutral",
}

export const COV_TONE: Record<CoverageStatus, BadgeTone> = {
  EXTRACTED: "success",
  MISSING_FLAGGED: "error",
  RECORDED_ABSENT: "neutral",
  SKIPPED: "neutral",
}

/** Category display order + icon (glyph names from `HiIcon`). */
export const RULE_CAT_ICON: Record<string, string> = {
  "Claim Submission": "send",
  Documentation: "fileText",
  Exclusions: "ban",
  Preauthorization: "shieldCheck",
  Utilization: "gauge",
  Pricing: "creditCard",
  Pharmacy: "pill",
  Other: "sliders",
}
