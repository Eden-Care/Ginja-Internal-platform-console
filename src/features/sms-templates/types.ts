/* SMS templates (document service). Snake_case DTO ↔ camelCase client types.
   Parallel to email-templates but text-only: `message_text` + `segment_info`
   instead of subject/html/css/plain-text/attachments. */

import { fmtDate } from "@/lib/console-format"

/* --------------------------------------------------------------- list/get-one --- */

export type SmsSegmentInfoDTO = {
  char_count: number | null
  segment_count: number | null
  encoding: string | null
}

export type SmsTemplateDTO = {
  id: number
  template_code: string
  code: string
  name: string
  description: string | null
  trigger_event: string | null
  used_by: string | null
  tags: string[] | null
  status: string
  active: boolean
  archived: boolean
  current_version_id: number | null
  current_version_number: number | null
  current_version_label: string | null
  latest_version_number: number | null
  message_text: string | null
  segment_info: SmsSegmentInfoDTO | null
  created_at: string | null
  updated_at: string | null
  created_by_name: string | null
}

export type SmsStatus = "Published" | "Draft"

/** The list-card shape. */
export type SmsTemplate = {
  /** Business code, e.g. "SMS000002" — the display id. */
  id: string
  /** Numeric id for API calls. */
  templateId: number
  name: string
  trigger: string
  status: SmsStatus
  active: boolean
  archived: boolean
  usedBy: string
  tags: string[]
  message: string
  charCount: number
  segmentCount: number
  encoding: string
  version: string
  updated: string
}

const toStatus = (s: string | null): SmsStatus =>
  (s ?? "").toUpperCase() === "PUBLISHED" ? "Published" : "Draft"

export function toSmsTemplate(d: SmsTemplateDTO): SmsTemplate {
  const msg = d.message_text ?? ""
  return {
    id: d.template_code,
    templateId: d.id,
    name: d.name,
    trigger: d.trigger_event ?? "",
    status: toStatus(d.status),
    active: d.active ?? true,
    archived: !!d.archived,
    usedBy: d.used_by ?? "TENANT_PLATFORMS",
    tags: d.tags ?? [],
    message: msg,
    charCount: d.segment_info?.char_count ?? msg.length,
    segmentCount: d.segment_info?.segment_count ?? 1,
    encoding: d.segment_info?.encoding ?? "",
    version: d.current_version_label
      ? `v${d.current_version_label}`
      : d.latest_version_number != null
        ? `v${d.latest_version_number}`
        : "",
    updated: fmtDate(d.updated_at),
  }
}

/* ----------------------------------------------------------------- full detail --- */

export type SmsSegmentInfo = {
  charCount: number
  segmentCount: number
  encoding: string
}

/** Full template the editor form binds to — get-one already carries the content. */
export type SmsTemplateDetail = {
  templateId: number
  /** Business code, e.g. "SMS000002". */
  code: string
  /** Functional code, e.g. "login_otp". */
  functionalCode: string
  name: string
  description: string
  triggerEvent: string
  usedBy: string
  status: string
  tags: string[]
  messageText: string
  segmentInfo: SmsSegmentInfo
  versionNumber: number
}

export function toSmsTemplateDetail(d: SmsTemplateDTO): SmsTemplateDetail {
  return {
    templateId: d.id,
    code: d.template_code,
    functionalCode: d.code,
    name: d.name,
    description: d.description ?? "",
    triggerEvent: d.trigger_event ?? "",
    usedBy: d.used_by ?? "TENANT_PLATFORMS",
    status: d.status,
    tags: d.tags ?? [],
    messageText: d.message_text ?? "",
    segmentInfo: {
      charCount: d.segment_info?.char_count ?? (d.message_text ?? "").length,
      segmentCount: d.segment_info?.segment_count ?? 1,
      encoding: d.segment_info?.encoding ?? "",
    },
    versionNumber: d.current_version_number ?? d.latest_version_number ?? 1,
  }
}

/* -------------------------------------------------------------------- versions --- */

export type SmsVersionRowDTO = {
  id: number
  version_code: string
  version_label: string | null
  version_number: number
  current: boolean
  status: string | null
  change_note: string | null
  created_at: string | null
  created_by: string | null
  created_by_name: string | null
}

export type SmsVersionRow = {
  id: number
  versionCode: string
  versionLabel: string
  versionNumber: number
  current: boolean
  /** Raw status from the API (PUBLISHED / ARCHIVED / DRAFT / …). */
  status: string
  changeNote: string
  createdAt: string
  createdBy: string
}

export function toSmsVersionRow(d: SmsVersionRowDTO): SmsVersionRow {
  return {
    id: d.id,
    versionCode: d.version_code,
    versionLabel: d.version_label ?? String(d.version_number),
    versionNumber: d.version_number,
    current: !!d.current,
    status: d.status ?? "",
    changeNote: d.change_note ?? "",
    createdAt: d.created_at ?? "",
    createdBy: d.created_by_name || d.created_by || "",
  }
}

/* --------------------------------------------------------------------- compare --- */

export type SmsDiffSegment = { op: "EQUAL" | "DELETE" | "INSERT"; text: string }
export type SmsDiffSegmentDTO = {
  op: "EQUAL" | "DELETE" | "INSERT"
  text: string
}
export type SmsDiffDTO = {
  field: string
  changed: boolean
  segments: SmsDiffSegmentDTO[] | null
}
export type SmsVersionCompareDTO = {
  from: { version_number?: number; version_label?: string } | null
  to: { version_number?: number; version_label?: string } | null
  diffs: SmsDiffDTO[] | null
}

export type SmsDiff = {
  field: string
  changed: boolean
  segments: SmsDiffSegment[]
}
export type SmsVersionCompare = {
  fromVersionNumber: number | null
  toVersionNumber: number | null
  diffs: SmsDiff[]
}

export function toSmsVersionCompare(
  d: SmsVersionCompareDTO
): SmsVersionCompare {
  return {
    fromVersionNumber: d.from?.version_number ?? null,
    toVersionNumber: d.to?.version_number ?? null,
    diffs: (d.diffs ?? []).map((f) => ({
      field: f.field,
      changed: !!f.changed,
      segments: (f.segments ?? []).map((s) => ({
        op: s.op ?? "EQUAL",
        text: s.text ?? "",
      })),
    })),
  }
}

/* -------------------------------------------------------------------- activity --- */

export type SmsActivityRowDTO = {
  id: number
  activity_code: string
  action: string
  occurred_at: string | null
  from_version_number: number | null
  to_version_number: number | null
  summary: string | null
  created_by: string | null
  created_by_name: string | null
}

export type SmsActivityRow = {
  id: number
  activityCode: string
  action: string
  occurredAt: string
  fromVersionNumber: number | null
  toVersionNumber: number | null
  summary: string
  actor: string
}

export function toSmsActivityRow(d: SmsActivityRowDTO): SmsActivityRow {
  return {
    id: d.id,
    activityCode: d.activity_code,
    action: d.action,
    occurredAt: d.occurred_at ?? "",
    fromVersionNumber: d.from_version_number ?? null,
    toVersionNumber: d.to_version_number ?? null,
    summary: d.summary ?? "",
    actor: d.created_by_name || d.created_by || "",
  }
}

/* ------------------------------------------------------------- create/update --- */

export type SmsPlaceholderInput = {
  field_key: string
  label: string
  data_type: string
  required: boolean
  display_order: number
}

/** POST/PUT /sms-templates body (snake_case). No subject/html/attachments. */
export type CreateSmsTemplateBody = {
  code: string
  name: string
  description?: string
  trigger_event: string
  used_by: string
  tags: string[]
  message_text: string
  change_note: string
  placeholders: SmsPlaceholderInput[]
}
