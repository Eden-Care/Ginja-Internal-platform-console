/* Insurers ("Claim Clean-up (LAMU)") domain — snake_case DTOs from the API,
 * camelCase client types for the UI, and the mappers between them. Endpoints:
 * base `/platform/insurance-companies` (see Ginja-Console.postman_collection). */

import { format } from "date-fns"

import { initials2 } from "@/lib/console-format"

/* ------------------------------------------------------------------ DTOs */

export type InsurerDTO = {
  id: number
  account_id: string
  name: string
  country: string
  company_type: string
  company_type_label: string
  city: string | null
  registered_address: string | null
  regulator: string | null
  licence_number: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  status: "ACTIVE" | "INACTIVE"
  status_reason: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}

export type DirectoryDTO = {
  summary: { total: number; active: number; inactive: number }
  companies: {
    content: InsurerDTO[]
    page: number
    size: number
    total_elements: number
    total_pages: number
  }
}

export type InsurerAuditDTO = {
  audit_id: string
  actor: string | null
  actor_name: string | null
  actor_role: string | null
  action: string
  module_label: string | null
  entity_id: string | null
  entity_label: string | null
  before: { status?: string | null } | null
  after: { status?: string | null } | null
  reason: string | null
  description: string | null
  created_at: string
}

/* --------------------------------------------------------- client types */

export type InsurerStatusValue = "Active" | "Inactive"

export type Insurer = {
  id: number
  accountId: string
  name: string
  country: string
  /** Machine enum, e.g. HEALTH_INSURER. */
  companyType: string
  /** Display label, e.g. "Health insurer". */
  companyTypeLabel: string
  city: string
  registeredAddress: string
  regulator: string
  licence: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: InsurerStatusValue
  statusReason: string
  createdByName: string
  /** Formatted "12 Jan 2026". */
  created: string
  /** Raw ISO timestamp (for sorting / re-formatting). */
  createdAt: string
}

export type InsurerSummary = { total: number; active: number; inactive: number }

export type InsurerDirectory = {
  summary: InsurerSummary
  companies: Insurer[]
  totalElements: number
  /** Zero-based index of the returned page. */
  page: number
  /** Page size the server applied. */
  size: number
  /** Total number of pages for the current filter set. */
  totalPages: number
}

export type AuditTone = "success" | "warning" | "neutral"

export type InsurerAuditEntry = {
  id: string
  title: string
  /** One-line summary composed from entity_id + after.status (+ reason). */
  detail: string
  by: string
  initials: string
  /** Formatted "12 Jan 2026". */
  when: string
  tone: AuditTone
}

/* ------------------------------------------------------------- mappers */

/** Show a value, or an em-dash placeholder when the API returns null/blank. */
const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—")

function fmtDate(iso: string) {
  try {
    return format(new Date(iso), "dd MMM yyyy")
  } catch {
    return iso
  }
}

export function toInsurer(d: InsurerDTO): Insurer {
  return {
    id: d.id,
    accountId: d.account_id,
    name: d.name,
    country: d.country,
    companyType: d.company_type,
    companyTypeLabel: dash(d.company_type_label),
    city: dash(d.city),
    registeredAddress: dash(d.registered_address),
    regulator: dash(d.regulator),
    licence: dash(d.licence_number),
    contactName: dash(d.contact_name),
    contactEmail: dash(d.contact_email),
    contactPhone: dash(d.contact_phone),
    status: d.status === "ACTIVE" ? "Active" : "Inactive",
    statusReason: dash(d.status_reason),
    createdByName: dash(d.created_by_name),
    created: d.created_at ? fmtDate(d.created_at) : "—",
    createdAt: d.created_at,
  }
}

/** Action enum suffix → the timeline dot tone (icon colour only). */
const AUDIT_TONE: Record<string, AuditTone> = {
  CREATED: "success",
  DEACTIVATED: "warning",
  REACTIVATED: "success",
  UPDATED: "neutral",
}

/** The one-line detail: the API `description` (— if missing) + a "· Status: X"
   suffix from `after.status`. */
function auditDetail(
  afterStatus: InsurerStatusValue | null,
  description: string | null
): string {
  const base = dash(description)
  return afterStatus ? `${base} · Status: ${afterStatus}` : base
}

export function toAuditEntry(d: InsurerAuditDTO): InsurerAuditEntry {
  const suffix = d.action.split("_").pop() ?? ""
  const afterStatus: InsurerStatusValue | null =
    d.after?.status === "ACTIVE"
      ? "Active"
      : d.after?.status === "INACTIVE"
        ? "Inactive"
        : null
  return {
    id: d.audit_id,
    // Label comes straight from `module_label`; "—" if the API omits it.
    title: dash(d.module_label),
    detail: auditDetail(afterStatus, d.description),
    by: dash(d.actor_name),
    initials: d.actor_name ? initials2(d.actor_name) : "—",
    when: d.created_at ? fmtDate(d.created_at) : "—",
    tone: AUDIT_TONE[suffix] ?? "neutral",
  }
}
