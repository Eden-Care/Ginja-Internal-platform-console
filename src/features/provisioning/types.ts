/* Tenant provisioning / technical-review queue (PRD step 6).

   DTOs are snake_case exactly as the API returns them; client types are
   camelCase with a toX() mapper at the boundary so snake_case never leaks into
   components. See API_GUIDE.md §10A / API_REFERENCE.md "Tenant Provisioning &
   Technical Review" and the Provisioning folder of the Postman collection. */

/** Subset of MiniBadge's tones used by stage pills. */
type StageTone = "neutral" | "warning" | "success" | "error"

/** Queue stage. Auto-advances AWAITING_START → IN_PROGRESS → READY_TO_ACTIVATE
   (a manual BLOCKED is preserved until changed). */
export type ProvStage =
  | "AWAITING_START"
  | "IN_PROGRESS"
  | "READY_TO_ACTIVATE"
  | "BLOCKED"

/** API config-section key. */
export type ProvSectionCode =
  | "DATABASE"
  | "DOMAINS_SSL"
  | "EMAIL"
  | "SMS"
  | "DATA_MIGRATION"

/** Per-section completion status. */
export type ProvConfigStatus = "NOT_STARTED" | "CONFIGURED" | "TESTED" | "DONE"

/** Per-section technical-review state. */
export type ProvReviewStatus = "PENDING" | "CHANGES_REQUESTED" | "APPROVED"

/** Remark severity + lifecycle. */
export type RemarkSeverity = "ACTION" | "INFO"
export type RemarkStatus = "OPEN" | "RESOLVED"

/** One config section (DATABASE, DOMAINS_SSL, EMAIL, SMS, DATA_MIGRATION). */
export type ProvSectionDTO = {
  config_id: string
  section: ProvSectionCode | string
  status: ProvConfigStatus | string
  config: Record<string, unknown> | null
  last_result: string | null
  last_tested_at: string | null
  review_status?: ProvReviewStatus | string | null
  configured_by?: string | null
  reviewed_by?: string | null
  open_remarks?: number | null
}

export type ProvisioningDTO = {
  provisioning_id: string
  tenant_id: number
  tenant_code: string
  subdomain: string | null
  legal_entity_name: string
  stage: ProvStage | string
  assignee: string | null
  sections_done: number
  sections_total: number
  sections_approved?: number | null
  open_remarks?: number | null
  sections?: ProvSectionDTO[] | null
}

/** A technical-review remark on a config section. */
export type RemarkDTO = {
  remark_id: string
  section: ProvSectionCode | string
  body: string
  severity: RemarkSeverity | string
  status: RemarkStatus | string
  author: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string | null
}

export type ProvSection = {
  configId: string
  section: ProvSectionCode | string
  status: ProvConfigStatus | string
  config: Record<string, unknown> | null
  lastResult: string | null
  lastTestedAt: string | null
  reviewStatus: ProvReviewStatus | string | null
  configuredBy: string | null
  reviewedBy: string | null
  openRemarks: number
}

/** The camelCase queue row the UI renders. */
export type Provisioning = {
  /** Human-readable provisioning id. */
  id: string
  tenantId: number
  tenantCode: string
  subdomain: string
  legalEntityName: string
  stage: ProvStage
  assignee: string | null
  sectionsDone: number
  sectionsTotal: number
  sectionsApproved: number
  openRemarks: number
  sections: ProvSection[]
}

export type Remark = {
  id: string
  section: ProvSectionCode | string
  body: string
  severity: RemarkSeverity
  status: RemarkStatus
  author: string | null
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string | null
}

export function toProvSection(d: ProvSectionDTO): ProvSection {
  return {
    configId: d.config_id,
    section: d.section,
    status: d.status,
    config: d.config ?? null,
    lastResult: d.last_result,
    lastTestedAt: d.last_tested_at,
    reviewStatus: d.review_status ?? null,
    configuredBy: d.configured_by ?? null,
    reviewedBy: d.reviewed_by ?? null,
    openRemarks: d.open_remarks ?? 0,
  }
}

export function toProvisioning(d: ProvisioningDTO): Provisioning {
  return {
    id: d.provisioning_id,
    tenantId: d.tenant_id,
    tenantCode: d.tenant_code,
    subdomain: d.subdomain ?? "",
    legalEntityName: d.legal_entity_name,
    stage: (d.stage as ProvStage) ?? "AWAITING_START",
    assignee: d.assignee,
    sectionsDone: d.sections_done ?? 0,
    sectionsTotal: d.sections_total ?? 0,
    sectionsApproved: d.sections_approved ?? 0,
    openRemarks: d.open_remarks ?? 0,
    sections: (d.sections ?? []).map(toProvSection),
  }
}

export function toRemark(d: RemarkDTO): Remark {
  return {
    id: d.remark_id,
    section: d.section,
    body: d.body,
    severity: (d.severity as RemarkSeverity) ?? "ACTION",
    status: (d.status as RemarkStatus) ?? "OPEN",
    author: d.author,
    resolvedBy: d.resolved_by,
    resolvedAt: d.resolved_at,
    createdAt: d.created_at,
  }
}

/* ------------------------------------------------------- request bodies --- */

export type SaveSectionRequest = {
  config?: Record<string, unknown>
  status?: ProvConfigStatus
}
export type SetStageRequest = { stage: ProvStage }
export type AssignProvisioningRequest = { assignee: string }
export type AddRemarkRequest = { body: string; severity?: RemarkSeverity }

/* --------------------------------------------------------- display maps --- */

/** Human-readable stage label for pills. */
export const PROV_STAGE_LABEL: Record<ProvStage, string> = {
  AWAITING_START: "Awaiting start",
  IN_PROGRESS: "In progress",
  READY_TO_ACTIVATE: "Ready to activate",
  BLOCKED: "Blocked",
}

/** Badge tone per stage (mirrors the status→tone mapping used elsewhere). */
export const PROV_STAGE_TONE: Record<ProvStage, StageTone> = {
  AWAITING_START: "neutral",
  IN_PROGRESS: "warning",
  READY_TO_ACTIVATE: "success",
  BLOCKED: "error",
}
