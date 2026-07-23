/* Service Providers (hospitals/clinics) — "Claim Clean-up (LAMU)" domain.
 * snake_case DTOs from the API, camelCase client types for the UI, and the
 * mappers between them. Base path `/platform/service-providers`
 * (see Ginja-Console.postman_collection / API_REFERENCE §8).
 *
 * The URL path param throughout the lifecycle is the **draft_code** (`SPO-…`);
 * `account_id` (`SP-YYYY-NNNN`) is the permanent id generated at submit and is
 * what we show as "Account ID". */

import { format } from "date-fns"

import { initials2 } from "@/lib/console-format"

/* ================================ enums ================================= */
/* Display label ↔ API enum. Labels match the wizard picklists below; the API
 * also returns *_label fields, so mapping is only needed on the write path. */

export const PROVIDER_TYPE_TO_ENUM: Record<string, string> = {
  Hospital: "HOSPITAL",
  "Primary Health Clinic": "PRIMARY_HEALTH_CLINIC",
  "Specialist Clinic": "SPECIALIST_CLINIC",
  Pharmacy: "PHARMACY",
  "Dental Practice": "DENTAL_PRACTICE",
  Optician: "OPTICIAN",
  "Lab Services": "LAB_SERVICES",
  "Imaging Services": "IMAGING_SERVICES",
  "Ambulance Services": "AMBULANCE_SERVICES",
  "Homecare Services": "HOMECARE_SERVICES",
}

export const CLASSIFICATION_TO_ENUM: Record<string, string> = {
  "Tier 1": "TIER_1",
  "Tier 2": "TIER_2",
  "Tier 3": "TIER_3",
  "Tier 4": "TIER_4",
}

export const TIER_TO_ENUM: Record<string, string> = {
  "Top 35": "TOP_35",
  "36–100": "RANK_36_100",
  "100+": "RANK_100_PLUS",
}

export const OWNERSHIP_TO_ENUM: Record<string, string> = {
  "Public (Government)": "PUBLIC",
  "Private (For-profit)": "PRIVATE",
  "Faith-based (FBO)": "FAITH_BASED",
  "NGO / Not-for-profit": "NGO",
}

export const INTEGRATION_TO_ENUM: Record<string, string> = {
  Done: "DONE",
  "In progress": "IN_PROGRESS",
  "Not yet started": "NOT_STARTED",
}

export const SERVICE_TO_ENUM: Record<string, string> = {
  Outpatient: "OUTPATIENT",
  Inpatient: "INPATIENT",
  Surgery: "SURGERY",
  Maternity: "MATERNITY",
  "Emergency / A&E": "EMERGENCY",
  Laboratory: "LABORATORY",
  "Radiology / Imaging": "RADIOLOGY",
  Pharmacy: "PHARMACY",
  Dental: "DENTAL",
  Optical: "OPTICAL",
  "ICU / HDU": "ICU_HDU",
  "Renal / Dialysis": "RENAL_DIALYSIS",
}

/** Wizard doc-slot key → API document-type enum. */
export const DOC_TYPE_TO_ENUM: Record<string, string> = {
  contract: "SIGNED_PARTNERSHIP_CONTRACT",
  license: "FACILITY_OPERATING_LICENCE",
  kra: "KRA_PIN_CERTIFICATE",
  bank: "BANK_MPESA_SETTLEMENT",
  reg: "REGULATORY_REGISTRATION",
  shif: "SHIF_SHA_ACCREDITATION",
}

/** Review-section UI key → API section enum (and back). */
export const SECTION_TO_ENUM: Record<string, string> = {
  profile: "PROVIDER_PROFILE",
  location: "LOCATION_CONTACT",
  systems: "SYSTEMS_INTEGRATION",
  registration: "REGISTRATION",
  documents: "DOCUMENTS",
}
export const SECTION_FROM_ENUM: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_TO_ENUM).map(([k, v]) => [v, k])
)

/* ================================= DTOs ================================= */

export type ServiceProviderDTO = {
  id: number
  draft_code: string
  account_id: string | null
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "INACTIVE"
  status_reason: string | null
  name: string
  provider_type: string
  provider_type_label: string
  classification: string
  classification_label: string
  tier: string
  tier_label: string
  ownership: string
  ownership_label: string
  country: string | null
  county_region: string | null
  town_city: string | null
  physical_address: string | null
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  contact_phone: string | null
  hims_name: string | null
  claims_per_month: number | null
  integration_status: string | null
  integration_status_label: string | null
  services_offered: string[]
  service_labels: string[]
  facility_registration_no: string | null
  kra_pin: string | null
  shif_sha_accreditation: string | null
  section_completeness: SectionCompletenessDTO
  created_by_name: string | null
  created_at: string
  submitted_at: string | null
  approved_by_name: string | null
  approved_at: string | null
  updated_at: string | null
}

export type SectionCompletenessDTO = {
  profile: boolean
  location: boolean
  systems: boolean
  registration: boolean
  completed: number
  required: number
  all_required_complete: boolean
}

export type DirectoryDTO = {
  summary: {
    total: number
    active: number
    pending_review: number
    inactive: number
  }
  providers: {
    content: ServiceProviderDTO[]
    page: number
    size: number
    total_elements: number
    total_pages: number
  }
}

export type SpAuditDTO = {
  audit_id: string
  actor_name: string | null
  actor_role: string | null
  action: string
  module_label: string | null
  entity_id: string | null
  entity_label: string | null
  after: { section?: string; status?: string } | null
  reason: string | null
  kind: string | null
  description: string | null
  created_at: string
}

export type SpDocumentDTO = {
  doc_type: string
  label: string
  required: boolean
  uploaded: boolean
  status: string | null
  file_id: string | null
  file_name: string | null
  file_url: string | null
  content_type: string | null
  file_size: number | null
  review_note: string | null
  uploaded_by_name: string | null
  uploaded_at: string | null
}

export type SpReviewDTO = {
  account_id: string | null
  draft_code: string
  name: string
  status: string
  submitted_at: string | null
  reviewed_sections: number
  total_sections: number
  open_remarks: number
  can_approve: boolean
  sections: {
    section: string
    label: string
    reviewed: boolean
    open_remarks: number
  }[]
  remarks: SpRemarkDTO[]
}

export type SpRemarkDTO = {
  remark_id: string
  section: string
  section_label: string
  type: string
  type_label: string
  body: string
  status: "OPEN" | "RESOLVED"
  author_name: string | null
  created_at: string
  resolved_by_name: string | null
  resolved_at: string | null
}

export type SpReviewQueueDTO = {
  stats: {
    awaiting_review: number
    open_remarks: number
    ready_to_activate: number
    approved: number
  }
  queue: {
    account_id: string | null
    draft_code: string
    name: string
    town_city: string | null
    ownership_label: string | null
    submitted_at: string | null
    open_remarks: number
    ready_to_activate: boolean
  }[]
}

/* ============================ client types ============================= */

export type SpStatus = "Active" | "Inactive" | "Pending review" | "Draft"
export type SpBadgeTone = "success" | "warning" | "neutral" | "info" | "error"
export type SpAuditTone = "success" | "warning" | "neutral"

/** Provider profile for the directory row and record page. Display fields
 * (type/cls/tier/ownership/integration/services) carry the API's *_label. */
export type ServiceProvider = {
  /** draft_code (SPO-…) — the URL/API path key + React key. */
  code: string
  accountId: string | null
  /** account_id when present, else the draft_code — shown as "Account ID". */
  displayId: string
  status: SpStatus
  statusReason: string
  name: string
  type: string
  cls: string
  tier: string
  ownership: string
  country: string
  county: string
  town: string
  address: string
  contact: string
  role: string
  email: string
  phone: string
  hims: string
  claimsMonth: number | null
  integration: string
  services: string[]
  reg: string
  kra: string
  shif: string
  completeness: SectionCompletenessDTO
  created: string
  createdBy: string
  submittedAt: string | null
  approvedBy: string | null
  approvedOn: string | null
}

export type SpDirectory = {
  summary: { total: number; active: number; pendingReview: number; inactive: number }
  providers: ServiceProvider[]
  totalElements: number
  page: number
  size: number
  totalPages: number
}

export type SpAuditEntry = {
  id: string
  action: string
  detail: string
  by: string
  initials: string
  when: string
  tone: SpAuditTone
}

export type SpDocument = {
  docType: string
  label: string
  required: boolean
  uploaded: boolean
  status: string | null
  fileName: string | null
  fileUrl: string | null
  reviewNote: string | null
  uploadedBy: string | null
  uploadedAt: string | null
}

export type SpReviewRemark = {
  id: string
  section: string
  sectionLabel: string
  type: string
  typeLabel: string
  severity: "action" | "note"
  body: string
  status: "open" | "resolved"
  by: string
  when: string
  resolvedBy: string | null
}

export type SpReviewSection = {
  key: string
  label: string
  reviewed: boolean
  openRemarks: number
}

export type SpReview = {
  code: string
  accountId: string | null
  name: string
  status: SpStatus
  submittedAt: string | null
  reviewedSections: number
  totalSections: number
  openRemarks: number
  canApprove: boolean
  sections: SpReviewSection[]
  remarks: SpReviewRemark[]
}

export type SpQueueItem = {
  code: string
  displayId: string
  name: string
  town: string
  ownershipLabel: string
  submittedAt: string
  openRemarks: number
  readyToActivate: boolean
}

export type SpReviewQueue = {
  stats: {
    awaitingReview: number
    openRemarks: number
    readyToActivate: number
    approved: number
  }
  queue: SpQueueItem[]
}

/* =========================== picklists / tones ========================= */

export type SpTier = { v: string; d: string }
export type SpDoc = { k: string; l: string; req: boolean }

export const SP_TYPES = Object.keys(PROVIDER_TYPE_TO_ENUM)
export const SP_CLASSES = Object.keys(CLASSIFICATION_TO_ENUM)
export const SP_OWNERSHIP = Object.keys(OWNERSHIP_TO_ENUM)
export const SP_INTEGRATION = Object.keys(INTEGRATION_TO_ENUM)
export const SP_SERVICES = Object.keys(SERVICE_TO_ENUM)

export const SP_TIERS: SpTier[] = [
  { v: "Top 35", d: "Top 35 providers by claim volume" },
  { v: "36–100", d: "Ranked 36 to 100 by claim volume" },
  { v: "100+", d: "Ranked beyond the top 100" },
]

export const KE_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu",
  "Kiambu",
  "Machakos",
  "Kakamega",
  "Meru",
  "Nyeri",
]

export const SP_DOCS: SpDoc[] = [
  { k: "contract", l: "Signed partnership contract", req: true },
  { k: "license", l: "Facility operating licence", req: true },
  { k: "kra", l: "KRA PIN certificate", req: true },
  { k: "bank", l: "Bank / M-Pesa settlement details", req: true },
  { k: "reg", l: "Regulatory registration (KMPDC / PPB)", req: false },
  { k: "shif", l: "SHIF / SHA accreditation", req: false },
]

export const SP_STATUS_TONE: Record<SpStatus, SpBadgeTone> = {
  Active: "success",
  Inactive: "neutral",
  "Pending review": "warning",
  Draft: "info",
}

/* ============================== mappers ================================ */

const dash = (v: string | null | undefined) => (v && String(v).trim() ? v : "—")

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM yyyy")
  } catch {
    return iso
  }
}
function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "dd MMM yyyy · HH:mm")
  } catch {
    return iso
  }
}

const STATUS_MAP: Record<ServiceProviderDTO["status"], SpStatus> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
}

export function toStatus(s: string): SpStatus {
  return STATUS_MAP[s as ServiceProviderDTO["status"]] ?? "Draft"
}

export function toServiceProvider(d: ServiceProviderDTO): ServiceProvider {
  return {
    code: d.draft_code,
    accountId: d.account_id,
    displayId: d.account_id ?? d.draft_code,
    status: toStatus(d.status),
    statusReason: dash(d.status_reason),
    name: d.name,
    type: dash(d.provider_type_label),
    cls: dash(d.classification_label),
    tier: dash(d.tier_label),
    ownership: dash(d.ownership_label),
    country: dash(d.country),
    county: dash(d.county_region),
    town: dash(d.town_city),
    address: dash(d.physical_address),
    contact: dash(d.contact_name),
    role: dash(d.contact_role),
    email: dash(d.contact_email),
    phone: dash(d.contact_phone),
    hims: dash(d.hims_name),
    claimsMonth: d.claims_per_month,
    integration: dash(d.integration_status_label),
    services: d.service_labels ?? [],
    reg: dash(d.facility_registration_no),
    kra: dash(d.kra_pin),
    shif: dash(d.shif_sha_accreditation),
    completeness: d.section_completeness,
    created: fmtDate(d.created_at),
    createdBy: dash(d.created_by_name),
    submittedAt: d.submitted_at ? fmtDate(d.submitted_at) : null,
    approvedBy: d.approved_by_name,
    approvedOn: d.approved_at ? fmtDate(d.approved_at) : null,
  }
}

const AUDIT_TONE: Record<string, SpAuditTone> = {
  ACTIVATED: "success",
  APPROVED: "success",
  REACTIVATED: "success",
  CREATED: "neutral",
  SUBMITTED: "neutral",
  UPDATED: "neutral",
  REVIEWED: "neutral",
  DEACTIVATED: "warning",
  ADDED: "warning",
  RESOLVED: "success",
  SENT: "warning",
}

export function toAuditEntry(d: SpAuditDTO): SpAuditEntry {
  const suffix = d.action.split("_").pop() ?? ""
  const detailBits = [
    d.reason,
    d.after?.section ? `Section: ${d.after.section}` : "",
  ].filter(Boolean)
  return {
    id: d.audit_id,
    action: dash(d.description),
    detail: detailBits.length ? detailBits.join(" · ") : dash(d.entity_label),
    by: dash(d.actor_name),
    initials: d.actor_name ? initials2(d.actor_name) : "—",
    when: fmtDateTime(d.created_at),
    tone: AUDIT_TONE[suffix] ?? "neutral",
  }
}

export function toDocument(d: SpDocumentDTO): SpDocument {
  return {
    docType: d.doc_type,
    label: d.label,
    required: d.required,
    uploaded: d.uploaded,
    status: d.status,
    fileName: d.file_name,
    fileUrl: d.file_url,
    reviewNote: d.review_note,
    uploadedBy: d.uploaded_by_name,
    uploadedAt: d.uploaded_at ? fmtDateTime(d.uploaded_at) : null,
  }
}

export function toReviewRemark(d: SpRemarkDTO): SpReviewRemark {
  return {
    id: d.remark_id,
    section: SECTION_FROM_ENUM[d.section] ?? d.section.toLowerCase(),
    sectionLabel: d.section_label,
    type: d.type,
    typeLabel: d.type_label,
    severity: d.type === "ACTION_REQUIRED" ? "action" : "note",
    body: d.body,
    status: d.status === "RESOLVED" ? "resolved" : "open",
    by: dash(d.author_name),
    when: d.resolved_at ? fmtDateTime(d.resolved_at) : fmtDateTime(d.created_at),
    resolvedBy: d.resolved_by_name,
  }
}

export function toReview(d: SpReviewDTO): SpReview {
  return {
    code: d.draft_code,
    accountId: d.account_id,
    name: d.name,
    status: toStatus(d.status),
    submittedAt: d.submitted_at ? fmtDateTime(d.submitted_at) : null,
    reviewedSections: d.reviewed_sections,
    totalSections: d.total_sections,
    openRemarks: d.open_remarks,
    canApprove: d.can_approve,
    sections: d.sections.map((s) => ({
      key: SECTION_FROM_ENUM[s.section] ?? s.section.toLowerCase(),
      label: s.label,
      reviewed: s.reviewed,
      openRemarks: s.open_remarks,
    })),
    remarks: d.remarks.map(toReviewRemark),
  }
}

export function toReviewQueue(d: SpReviewQueueDTO): SpReviewQueue {
  return {
    stats: {
      awaitingReview: d.stats.awaiting_review,
      openRemarks: d.stats.open_remarks,
      readyToActivate: d.stats.ready_to_activate,
      approved: d.stats.approved,
    },
    queue: d.queue.map((q) => ({
      code: q.draft_code,
      displayId: q.account_id ?? q.draft_code,
      name: q.name,
      town: dash(q.town_city),
      ownershipLabel: dash(q.ownership_label),
      submittedAt: q.submitted_at ? fmtDate(q.submitted_at) : "—",
      openRemarks: q.open_remarks,
      readyToActivate: q.ready_to_activate,
    })),
  }
}
