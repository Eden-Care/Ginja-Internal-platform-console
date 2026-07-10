/* Email & SMS templates (document service). DTO is snake_case as the API
   returns it; mapped onto the existing EmailTemplate UI type. Fields the list
   API doesn't carry (subject/body live on a version; overrides) are left
   blank/undefined and render as dashes. */

import { fmtDate } from "@/lib/console-format"
import type { EmailChannel, EmailTemplate } from "@/lib/console-data"

export type EmailTemplateDTO = {
  id: number
  template_code: string
  tenant_id: number | null
  code: string
  name: string
  description: string | null
  channel: string
  trigger_event: string | null
  used_by: string | null
  tags: string[] | null
  status: string
  active: boolean
  archived?: boolean
  current_version_id: number | null
  latest_version_number: number | null
  /** Template-level merge fields (get-one). The version endpoint's
     `merge_fields` is deprecated — placeholders now live here. */
  placeholders?: EmailMergeFieldDTO[] | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
}

const CHANNEL: Record<string, EmailChannel> = {
  EMAIL: "Email",
  EMAIL_AND_SMS: "Email + SMS",
}

const toStatus = (s: string | null) =>
  (s ?? "").toUpperCase() === "PUBLISHED" ? "Published" : "Draft"

export function toEmailTemplate(d: EmailTemplateDTO): EmailTemplate {
  return {
    id: d.template_code,
    templateId: d.id,
    name: d.name,
    trigger: d.trigger_event ?? "",
    channel: CHANNEL[(d.channel ?? "").toUpperCase()] ?? "Email",
    status: toStatus(d.status),
    version:
      d.latest_version_number != null ? `v${d.latest_version_number}` : "",
    updated: fmtDate(d.updated_at),
    description: d.description ?? "",
    usedBy: d.used_by ?? "TENANT_PLATFORMS",
    active: d.active ?? true,
    archived: d.archived ?? false,
    // Not provided by the list endpoint:
    overrides: undefined,
    subject: "",
    body: "",
  }
}

/* --------------------------------------------------- create request body --- */

export type EmailPlaceholderInput = {
  field_key: string
  label: string
  data_type: string
  required: boolean
  display_order: number
}

export type EmailAttachmentPolicyInput = {
  enabled: boolean
  requirement?: string
  max_attachments?: number
  max_size_per_file_mb?: number
  allowed_file_types?: string[]
}

/** POST /email-templates body (snake_case, as the document service expects). */
export type CreateEmailTemplateBody = {
  code: string
  name: string
  description?: string
  channel: string
  trigger_event: string
  used_by: string
  /** Inbox preview snippet shown after the subject (persisted on the version). */
  preheader_text?: string
  tags: string[]
  subject: string
  html_content: string
  css_content: string
  plain_text_content: string
  change_note: string
  placeholders: EmailPlaceholderInput[]
  attachment_policy: EmailAttachmentPolicyInput
  /** Create the template already published (Save & publish). Omitted ⇒ DRAFT. */
  publish?: boolean
}

/* --------------------------------------------------- full detail (get-one) --- */

/** A version's merge field (placeholder) as the version endpoint returns it. */
export type EmailMergeFieldDTO = {
  merge_field_code?: string
  field_key: string
  label: string
  data_type: string
  required: boolean
  default_value: string | null
  display_order: number
}

/** A version's attachment policy as the version endpoint returns it. */
export type EmailAttachmentPolicyDTO = {
  enabled: boolean
  requirement: string | null
  max_attachments: number | null
  max_size_per_file_mb: number | null
  allowed_file_types: string[] | null
}

/** GET /email-templates/{id}/versions/{n} — the editable content of a version. */
export type EmailVersionDTO = {
  id: number
  version_code: string
  template_id: number
  version_number: number
  current: boolean
  subject: string | null
  preheader_text?: string | null
  html_content: string | null
  css_content: string | null
  plain_text_content?: string | null
  sms_body: string | null
  change_note: string | null
  merge_fields?: EmailMergeFieldDTO[] | null
  attachment_policy?: EmailAttachmentPolicyDTO | null
  attachments?: unknown[] | null
}

export type EmailMergeField = {
  fieldKey: string
  label: string
  dataType: string
  required: boolean
  displayOrder: number
  defaultValue: string | null
}

/** A version's attachment policy, camel-cased for the editor form. */
export type EmailAttachmentPolicy = {
  enabled: boolean
  /** "" | "OPTIONAL" | "MANDATORY". */
  requirement: string
  maxAttachments: number | null
  maxSizePerFileMb: number | null
  allowedFileTypes: string[]
}

/** Full email template the editor form binds to — template metadata (get-one)
   merged with its current version's content (versions/{n}). */
export type EmailTemplateDetail = {
  id: number
  /** Business code, e.g. "EML000004". */
  code: string
  /** Functional code, e.g. "activation_confirmation". */
  functionalCode: string
  name: string
  description: string
  channel: string
  triggerEvent: string
  /** Which platform the template belongs to, e.g. "TENANT_PLATFORMS". */
  usedBy: string
  status: string
  /** Active / archived lifecycle flags (from get-one meta) — the editor header
     shows an "Archived" badge and the mapper below rebuilds the list card. */
  active: boolean
  archived: boolean
  versionNumber: number
  subject: string
  /** Inbox preview snippet (from the current version). */
  preheaderText: string
  htmlContent: string
  cssContent: string
  /** Not returned by the version endpoint today — kept for completeness. */
  plainTextContent: string
  smsBody: string
  /** Tags from get-one (template-level). */
  tags: string[]
  /** Attachment policy from the current version. */
  attachmentPolicy: EmailAttachmentPolicy
  mergeFields: EmailMergeField[]
}

/** Merge get-one metadata + a version's content into the editor's detail shape. */
export function toEmailTemplateDetail(
  meta: EmailTemplateDTO,
  ver: EmailVersionDTO
): EmailTemplateDetail {
  return {
    id: meta.id,
    code: meta.template_code,
    functionalCode: meta.code,
    name: meta.name,
    description: meta.description ?? "",
    channel: meta.channel ?? "EMAIL",
    triggerEvent: meta.trigger_event ?? "",
    usedBy: meta.used_by ?? "TENANT_PLATFORMS",
    status: meta.status,
    active: meta.active ?? true,
    archived: meta.archived ?? false,
    versionNumber: ver.version_number,
    subject: ver.subject ?? "",
    preheaderText: ver.preheader_text ?? "",
    htmlContent: ver.html_content ?? "",
    cssContent: ver.css_content ?? "",
    plainTextContent: ver.plain_text_content ?? "",
    smsBody: ver.sms_body ?? "",
    tags: meta.tags ?? [],
    attachmentPolicy: {
      enabled: ver.attachment_policy?.enabled ?? false,
      requirement: ver.attachment_policy?.requirement ?? "",
      maxAttachments: ver.attachment_policy?.max_attachments ?? null,
      maxSizePerFileMb: ver.attachment_policy?.max_size_per_file_mb ?? null,
      allowedFileTypes: ver.attachment_policy?.allowed_file_types ?? [],
    },
    // Placeholders now come from the template-level get-one; fall back to the
    // (deprecated) version merge_fields for older responses.
    mergeFields: (meta.placeholders ?? ver.merge_fields ?? []).map((m) => ({
      fieldKey: m.field_key,
      label: m.label,
      dataType: m.data_type,
      required: m.required,
      displayOrder: m.display_order,
      defaultValue: m.default_value,
    })),
  }
}

/** Build the list-card `EmailTemplate` shape from a full detail — used by the
   deep-link route wrapper (EmailEditorPage) to feed the editor's header when
   there's no list object (e.g. on refresh). */
export function detailToEmailTemplate(d: EmailTemplateDetail): EmailTemplate {
  return {
    id: d.code,
    templateId: d.id,
    name: d.name,
    trigger: d.triggerEvent,
    channel: CHANNEL[(d.channel ?? "").toUpperCase()] ?? "Email",
    status: toStatus(d.status),
    version: d.versionNumber != null ? `v${d.versionNumber}` : "",
    updated: "",
    description: d.description,
    usedBy: d.usedBy,
    active: d.active,
    archived: d.archived,
    overrides: undefined,
    subject: "",
    body: "",
  }
}

/* --------------------------------------------------- version compare (diff) --- */

/** A single word-by-word diff segment from /compare (Google diff-match-patch
   style): EQUAL = unchanged, DELETE = removed from `from`, INSERT = added in
   `to`. */
export type EmailDiffSegmentDTO = {
  op: "EQUAL" | "DELETE" | "INSERT"
  text: string
}

/** Per-field diff in the /compare response (subject, html_content, …). */
export type EmailDiffDTO = {
  field: string
  changed: boolean
  segments: EmailDiffSegmentDTO[] | null
}

/** GET /email-templates/{id}/compare?from&to — the two versions + their diffs.
   Only the version labels are needed off `from`/`to`. */
export type EmailVersionCompareDTO = {
  from: { version_number?: number; version_code?: string } | null
  to: { version_number?: number; version_code?: string } | null
  diffs: EmailDiffDTO[] | null
}

export type EmailDiffSegment = {
  op: "EQUAL" | "DELETE" | "INSERT"
  text: string
}
export type EmailDiff = {
  field: string
  changed: boolean
  segments: EmailDiffSegment[]
}
export type EmailVersionCompare = {
  fromVersionNumber: number | null
  fromVersionCode: string
  toVersionNumber: number | null
  toVersionCode: string
  diffs: EmailDiff[]
}

export function toEmailVersionCompare(
  d: EmailVersionCompareDTO
): EmailVersionCompare {
  return {
    fromVersionNumber: d.from?.version_number ?? null,
    fromVersionCode: d.from?.version_code ?? "",
    toVersionNumber: d.to?.version_number ?? null,
    toVersionCode: d.to?.version_code ?? "",
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
