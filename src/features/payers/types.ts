/* Tenant accounts (Payers) domain. DTOs mirror the API's snake_case
   `PayerResponse` exactly; the client `Payer` is the camelCase shape the list
   renders. See API_GUIDE.md §8–9. */

import type {
  OnbTeamKey,
  SecStatus,
  TenantStatus,
  TenantType,
} from "@/lib/console-data"

/* API enum → the display strings the existing UI components expect. */
const STATUS_MAP: Record<string, TenantStatus> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  RETIRED: "Retired",
  ARCHIVED: "Retired",
  PENDING_ACTIVATION: "Pending Activation",
  PENDING_REVIEW: "Pending Review",
}

const TYPE_MAP: Record<string, TenantType> = {
  INSURER: "Insurer",
  TPA: "TPA",
  SELF_MANAGED_SCHEME: "Self-managed Scheme",
}

const MODEL_LABEL: Record<string, string> = {
  PMPM: "PMPM",
  PER_CLAIM: "Per claim",
  PCT_GWP: "% of GWP",
}

/** A KYB document row on a tenant (GET payer detail). */
export type DocumentDTO = {
  document_id: string
  category: string
  file_name: string
  status: string
  expiry_date: string | null
}

/** GET …/documents/{id} → metadata + a freshly-issued pre-signed URL (§8.5.1). */
export type DocumentDownloadDTO = {
  document_id: string
  file_id: string
  category: string
  status: string
  file_name: string
  content_type: string | null
  file_size: number | null
  version_number: number | null
  expiry_date: string | null
  file_url: string
}

export type DocumentDownload = {
  documentId: string
  /** Document-service file id — pass it back to `addDocument` to replace this
     document's file in place (§8.5 "replace"). */
  fileId: string
  category: string
  fileName: string
  contentType: string | null
  fileSize: number | null
  /** Time-limited pre-signed URL to open/download the file. */
  url: string
}

export function toDocumentDownload(d: DocumentDownloadDTO): DocumentDownload {
  return {
    documentId: d.document_id,
    fileId: d.file_id,
    category: d.category,
    fileName: d.file_name,
    contentType: d.content_type,
    fileSize: d.file_size,
    url: d.file_url,
  }
}

/** A tenant contact row (GET payer detail). */
export type ContactDTO = {
  contact_id: string
  name: string
  email: string
  role_title: string | null
  receives_invite: boolean
}

export type TenantDTO = {
  id: number
  tenant_code: string
  primary: boolean
  status: string
  subdomain: string | null
  schema_name: string | null
  data_residency_region: string | null
  legal_entity_name: string
  trading_name: string | null
  country: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  tenant_admin_name: string | null
  tenant_admin_email: string | null
  // Echoed back by GET payer detail as of the 2026-06-24 backend update (the
  // mapper now serialises them), so they rehydrate on resume. `bank` stays
  // write-only/encrypted and is never returned.
  tax_vat_number?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  contacts?: ContactDTO[] | null
  documents?: DocumentDTO[] | null
}

/** An entitlement (module access) row on a payer (GET payer detail). */
export type EntitlementDTO = {
  entitlement_id: string
  module_code: string
  submodule_code: string | null
  enabled: boolean
}

/** The subscription snapshot's exact shape isn't pinned in the docs — read it
   defensively (any of these may be present, or it may be null). */
export type SubscriptionDTO = {
  pricing_structure_id?: number | null
  pricing_structure_name?: string | null
  structure_name?: string | null
  subscription_model?: string | null
  billing_frequency?: string | null
  discount_pct?: number | null
  free_trial_days?: number | null
  promotional?: boolean | null
  contract_start?: string | null
  contract_end?: string | null
  /** Frozen copy of the chosen pricing structure at subscription time. The
     structure's human name lives here (`name`) — the only place the API returns
     it; the top-level *_name fields are not populated. Inner keys are camelCase. */
  pricing_snapshot?: { name?: string | null } | null
} | null

export type PayerDTO = {
  id: number
  payer_id: string
  status: string
  payer_type: string
  primary_tenant_id: number | null
  /** Some list views (e.g. the approvals queue) echo the primary's name at the
     top level; used as a fallback when tenants[] isn't expanded. */
  legal_entity_name?: string | null
  submitted_by: string | null
  submitted_at: string | null
  activated_at: string | null
  created_at: string
  tenants?: TenantDTO[] | null
  entitlements?: EntitlementDTO[] | null
  subscription?: SubscriptionDTO
}

export type Payer = {
  id: number
  /** Human-readable payer code, e.g. "PAY000001". */
  code: string
  /** Primary tenant's legal entity name. */
  name: string
  type: TenantType
  status: TenantStatus
  /** Raw API status (e.g. "ACTIVE") — for lifecycle action gating. */
  rawStatus: string
  country: string
  /** Primary tenant's data-residency region. */
  region: string
  subdomain: string
  /** Total tenants under the payer (primary + secondaries). */
  subTenants: number
  /** A short label for the Subscription column ("—" when none). */
  subscriptionLabel: string
  /** ISO timestamp used for the Updated column. */
  updatedAt: string | null
  /** ISO creation timestamp (the draft "Started" time). */
  createdAt: string | null
  primaryTenantId: number | null
  /** Member who submitted for approval; null until submit (approvals queue). */
  submittedBy: string | null
  /** ISO submission timestamp; null until submit (approvals queue). */
  submittedAt: string | null
}

function subscriptionLabel(s: SubscriptionDTO): string {
  if (!s) return "—"
  const name =
    s.pricing_structure_name ?? s.structure_name ?? s.pricing_snapshot?.name
  if (name) return name
  const model = s.subscription_model ? MODEL_LABEL[s.subscription_model] ?? s.subscription_model : null
  return model ?? "—"
}

/* ----------------------------------------- onboarding request DTOs (§8) --- */

export type ContactRequest = {
  name: string
  email: string
  role_title?: string | null
  receives_invite?: boolean
}

/** TenantDetailsRequest — primary & secondary tenants share this shape (§8.1/8.2). */
export type TenantDetailsRequest = {
  legal_entity_name: string
  trading_name?: string | null
  primary_contact_name: string
  primary_contact_email: string
  country: string
  data_residency_region?: string | null
  subdomain?: string | null
  tenant_admin_name: string
  tenant_admin_email: string
  tax_vat_number?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  contacts?: ContactRequest[]
}

export type CreatePayerRequest = {
  payer_type: string
  primary_tenant: TenantDetailsRequest
}

/** PATCH …/tenants/{id} — a partial tenant update on a DRAFT payer. Every field
   is optional; only the keys sent are changed (omitted = left unchanged). Same
   field set as create; `bank` is accepted but never echoed back. */
export type UpdateTenantRequest = Partial<TenantDetailsRequest>

export type EntitlementRequest = { module_code: string; submodule_codes?: string[] }
export type SetEntitlementsRequest = { entitlements: EntitlementRequest[] }

export type SetSubscriptionRequest = {
  pricing_structure_id: number
  subscription_model: string
  billing_frequency: string
  /** Optional commercial terms (§8.4) — omitted when unset. */
  discount_pct?: number
  free_trial_days?: number
  promotional?: boolean
  contract_start?: string
  contract_end?: string
}


/* --------------------------------------------------- payer lifecycle (§) --- */

/** Suspend reason category (API enum). Maps to the v3 SuspendDialog select. */
export type SuspendReason = "NON_PAYMENT" | "COMPLIANCE" | "SECURITY" | "OTHER"

/** Maker-checker lifecycle change. The maker raises a request via
   POST …/suspend|reactivate|retire (payer stays in its current state); a checker
   approves/rejects it via POST …/lifecycle-requests/{id}/approve|reject, which is
   what actually executes the transition. */
export type LifecycleAction = "SUSPEND" | "REACTIVATE" | "RETIRE"
export type LifecycleRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

export type LifecycleRequestDTO = {
  request_id: string
  payer_id: number
  payer_code: string
  action: LifecycleAction | string
  reason: string | null
  note: string | null
  status: LifecycleRequestStatus | string
  requested_by: string | null
  requested_by_name: string | null
  requested_at: string | null
  decided_by: string | null
  decided_by_name: string | null
  decided_at: string | null
  decision_comment: string | null
}

export type LifecycleRequest = {
  /** Business id, e.g. "LCR000001". */
  id: string
  payerId: number
  action: LifecycleAction
  /** Suspend reason enum, or free text for retire; null for reactivate. */
  reason: string | null
  note: string | null
  status: LifecycleRequestStatus
  requestedBy: string
  requestedAt: string | null
  decidedBy: string | null
  decidedAt: string | null
  decisionComment: string | null
}

export function toLifecycleRequest(d: LifecycleRequestDTO): LifecycleRequest {
  return {
    id: d.request_id,
    payerId: d.payer_id,
    action: d.action as LifecycleAction,
    reason: d.reason,
    note: d.note,
    status: d.status as LifecycleRequestStatus,
    requestedBy: d.requested_by_name || d.requested_by || "—",
    requestedAt: d.requested_at,
    decidedBy: d.decided_by_name || d.decided_by,
    decidedAt: d.decided_at,
    decisionComment: d.decision_comment,
  }
}

/* ---------------------------------------------- payer activity timeline --- */

/** One row of GET …/{payerId}/activity — the payer's audit trail (newest first,
   paged). `kind` is a server tone hint (e.g. "danger" | "success" | "info"). */
export type PayerActivityDTO = {
  audit_id: string
  actor: string | null
  actor_name: string | null
  actor_role: string | null
  action: string
  module: string | null
  module_label: string | null
  entity_type: string | null
  entity_id: string | null
  entity_label: string | null
  before: unknown
  after: unknown
  changes: unknown
  reason: string | null
  created_at: string | null
  kind: string | null
}

export type PayerActivity = {
  id: string
  /** Display name of who acted (falls back to the raw actor id). */
  actor: string
  actorRole: string | null
  /** Raw action enum, e.g. PAYER_APPROVED (humanised in the UI). */
  action: string
  moduleLabel: string | null
  /** Decision/transition reason, when the action carried one. */
  reason: string | null
  /** Server tone hint for the timeline dot. */
  kind: string | null
  at: string | null
}

export function toPayerActivity(d: PayerActivityDTO): PayerActivity {
  // Some actions stash their reason under `after.reason` (suspend/retire) rather
  // than the top-level `reason`; read both.
  const afterReason =
    d.after && typeof d.after === "object" && "reason" in d.after
      ? String((d.after as { reason?: unknown }).reason ?? "")
      : ""
  return {
    id: d.audit_id,
    actor: d.actor_name || d.actor || "—",
    actorRole: d.actor_role,
    action: d.action,
    moduleLabel: d.module_label,
    reason: d.reason || afterReason || null,
    kind: d.kind,
    at: d.created_at,
  }
}

/** Subset of TenantLookupResponse the wizard needs (§8.0). */
export type TenantLookup = {
  found: boolean
  matchedBy: string[]
  tenant: {
    legalEntityName: string
    tenantCode: string
    country: string | null
    payerStatus: string | null
  } | null
}

export type SubdomainCheck = {
  input: string
  sanitised: string
  reserved: boolean
  valid: boolean
  available: boolean
  suggestions: string[]
}

/* ---------------------------------------- onboarding steps / progress (§8.9) --- */

/** API step status → the SegTrack tone the draft UI renders. */
const STEP_STATUS_MAP: Record<string, SecStatus> = {
  COMPLETE: "complete",
  IN_PROGRESS: "progress",
  NOT_STARTED: "empty",
}

const OWNER_ROLES = new Set<OnbTeamKey>(["profile", "tech", "compliance"])

export type OnboardingStepDTO = {
  step_id: string
  step_key: string
  owner_role: string | null
  sort_order: number
  required: boolean
  status: string
  complete: boolean
  assignee: string | null
  assigned_by: string | null
  completed_by: string | null
  completed_at: string | null
}

export type OnboardingProgressDTO = {
  payer_id: number
  completed: number
  total: number
  progress_pct: number
  required_completed: number
  required_total: number
  all_required_complete: boolean
  ready_to_submit: boolean
  completed_steps: string[]
  incomplete_steps: string[]
  steps: OnboardingStepDTO[]
}

export type OnboardingStep = {
  /** primary | secondary | modules | billing | documents | review */
  key: string
  ownerRole: OnbTeamKey | null
  required: boolean
  status: SecStatus
  complete: boolean
  /** Assignee email (or null when nobody owns the step yet). */
  assignee: string | null
  completedAt: string | null
}

export type OnboardingProgress = {
  payerId: number
  completed: number
  total: number
  progressPct: number
  readyToSubmit: boolean
  allRequiredComplete: boolean
  completedSteps: string[]
  incompleteSteps: string[]
  steps: OnboardingStep[]
}

export function toOnboardingProgress(
  d: OnboardingProgressDTO
): OnboardingProgress {
  return {
    payerId: d.payer_id,
    completed: d.completed,
    total: d.total,
    progressPct: d.progress_pct,
    readyToSubmit: d.ready_to_submit,
    allRequiredComplete: d.all_required_complete,
    completedSteps: d.completed_steps ?? [],
    incompleteSteps: d.incomplete_steps ?? [],
    steps: (d.steps ?? []).map((s) => ({
      key: s.step_key,
      ownerRole:
        s.owner_role && OWNER_ROLES.has(s.owner_role as OnbTeamKey)
          ? (s.owner_role as OnbTeamKey)
          : null,
      required: s.required,
      status: STEP_STATUS_MAP[s.status] ?? "empty",
      complete: s.complete,
      assignee: s.assignee,
      completedAt: s.completed_at,
    })),
  }
}

/* ------------------------------------- onboarding drafts (batch) (§8) --- */

/** GET …/onboarding-drafts item: a DRAFT payer's identity + its onboarding
   progress in one object. NOTE `id` is numeric and `payer_id` is the PAY… code
   (unlike the single /steps response, whose `payer_id` is numeric). */
export type OnboardingDraftDTO = {
  id: number
  payer_id: string
  payer_type: string
  legal_entity_name: string | null
  country: string | null
  created_at: string | null
  updated_at: string | null
  completed: number
  total: number
  progress_pct: number
  required_completed: number
  required_total: number
  all_required_complete: boolean
  ready_to_submit: boolean
  completed_steps: string[]
  incomplete_steps: string[]
  steps: OnboardingStepDTO[]
}

/** A DRAFT payer's basics + mapped onboarding progress (drives the drafts strip
   from a single endpoint — no separate payers-list fetch / merge). */
export type OnboardingDraft = {
  id: number
  code: string
  name: string
  country: string | null
  type: TenantType
  createdAt: string | null
  updatedAt: string | null
  progress: OnboardingProgress
}

export function toOnboardingDraft(d: OnboardingDraftDTO): OnboardingDraft {
  return {
    id: d.id,
    code: d.payer_id,
    name: d.legal_entity_name ?? "—",
    type: TYPE_MAP[d.payer_type] ?? (d.payer_type as TenantType),
    country: d.country,
    createdAt: d.created_at ?? null,
    updatedAt: d.updated_at ?? null,
    // The progress sub-shape matches OnboardingProgressDTO except its `payer_id`
    // is the numeric id here — feed that in so the mapper keys it correctly.
    progress: toOnboardingProgress({ ...d, payer_id: d.id }),
  }
}

export function toPayer(d: PayerDTO): Payer {
  const tenants = d.tenants ?? []
  const primary =
    tenants.find((t) => t.primary) ??
    tenants.find((t) => t.id === d.primary_tenant_id) ??
    tenants[0]
  return {
    id: d.id,
    code: d.payer_id,
    name: primary?.legal_entity_name ?? d.legal_entity_name ?? "—",
    type: TYPE_MAP[d.payer_type] ?? (d.payer_type as TenantType),
    status: STATUS_MAP[d.status] ?? "Draft",
    rawStatus: d.status,
    country: primary?.country ?? "—",
    region: primary?.data_residency_region ?? "—",
    subdomain: primary?.subdomain ?? "—",
    subTenants: tenants.length,
    subscriptionLabel: subscriptionLabel(d.subscription ?? null),
    updatedAt: d.activated_at ?? d.submitted_at ?? d.created_at ?? null,
    createdAt: d.created_at ?? null,
    primaryTenantId: d.primary_tenant_id,
    submittedBy: d.submitted_by ?? null,
    submittedAt: d.submitted_at ?? null,
  }
}
