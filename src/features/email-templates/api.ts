/* Thin service over the document-service API (email & SMS templates).
   Points the shared client at DOC_BASE_URL via a per-request baseURL override. */

import {
  apiGet,
  apiPost,
  apiPut,
  DOC_BASE_URL,
  NOTIFICATIONS_BASE_URL,
} from "@/lib/api/client"
import type { Paged, PagedDTO } from "@/lib/api/paged"
import { toPaged } from "@/lib/api/paged"
import type { EmailTemplate } from "@/lib/console-data"

import {
  toEmailTemplate,
  toEmailTemplateDetail,
  toEmailVersionCompare,
  type CreateEmailTemplateBody,
  type EmailTemplateDetail,
  type EmailTemplateDTO,
  type EmailVersionCompare,
  type EmailVersionCompareDTO,
  type EmailVersionDTO,
} from "./types"

export type EmailTemplateQuery = {
  page?: number
  size?: number
  archived?: boolean
}

/* A row from GET /email-templates/{id}/versions — version metadata only
   (no subject/html/css content; those live on the single-version GET). */
export type EmailVersionRowDTO = {
  id: number
  version_code: string
  version_number: number
  current: boolean
  status: string | null
  change_note: string | null
  created_at: string | null
  created_by: string | null
}

export type EmailVersionRow = {
  id: number
  versionCode: string
  versionNumber: number
  current: boolean
  /** Raw status from the API (PUBLISHED / ARCHIVED / DRAFT / …). */
  status: string
  changeNote: string
  createdAt: string
  createdBy: string
}

function toEmailVersionRow(d: EmailVersionRowDTO): EmailVersionRow {
  return {
    id: d.id,
    versionCode: d.version_code,
    versionNumber: d.version_number,
    current: !!d.current,
    status: d.status ?? "",
    changeNote: d.change_note ?? "",
    createdAt: d.created_at ?? "",
    createdBy: d.created_by ?? "",
  }
}

/* A row from GET /email-templates/{id}/activity — an append-only, attributed
   event feed (created / published / rolled back / …). */
export type EmailActivityRowDTO = {
  id: number
  activity_code: string
  action: string
  actor: string | null
  occurred_at: string | null
  from_version_number: number | null
  to_version_number: number | null
  summary: string | null
  diffs?: unknown[] | null
}

export type EmailActivityRow = {
  id: number
  activityCode: string
  action: string
  actor: string
  occurredAt: string
  fromVersionNumber: number | null
  toVersionNumber: number | null
  summary: string
  diffs: unknown[]
}

function toEmailActivityRow(d: EmailActivityRowDTO): EmailActivityRow {
  return {
    id: d.id,
    activityCode: d.activity_code,
    action: d.action,
    actor: d.actor ?? "",
    occurredAt: d.occurred_at ?? "",
    fromVersionNumber: d.from_version_number ?? null,
    toVersionNumber: d.to_version_number ?? null,
    summary: d.summary ?? "",
    diffs: d.diffs ?? [],
  }
}

/** GET {document-service}/email-templates?page&size → mapped EmailTemplate rows. */
export async function fetchEmailTemplates(
  q: EmailTemplateQuery = {}
): Promise<Paged<EmailTemplate>> {
  const params: Record<string, string | number | boolean> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  }
  if (q.archived != null) params.archived = q.archived
  const res = await apiGet<PagedDTO<EmailTemplateDTO>>("/email-templates", {
    baseURL: DOC_BASE_URL,
    params,
  })
  console.log("[GET /document-service/api/v1/email-templates]", res)
  return toPaged(res, toEmailTemplate)
}

/** Full detail for the editor: GET /email-templates/{id} (metadata) merged with
   GET /email-templates/{id}/versions/{latest_version_number} (the editable
   content). The get-one response is metadata-only, so the version call supplies
   subject / html / css / sms / merge fields. */
export async function fetchEmailTemplateDetail(
  id: number
): Promise<EmailTemplateDetail> {
  const meta = await apiGet<EmailTemplateDTO>(`/email-templates/${id}`, {
    baseURL: DOC_BASE_URL,
  })
  const versionNumber = meta.latest_version_number ?? 1
  const version = await apiGet<EmailVersionDTO>(
    `/email-templates/${id}/versions/${versionNumber}`,
    { baseURL: DOC_BASE_URL }
  )
  console.log(
    `[GET /document-service/api/v1/email-templates/${id} (+version ${versionNumber})]`,
    {
      meta,
      version,
    }
  )
  return toEmailTemplateDetail(meta, version)
}

/** GET {document-service}/email-templates/{id}/versions?page&size → the version
   history (newest first). Console-only for now; not yet bound to the UI. */
export async function fetchEmailTemplateVersions(
  id: number,
  q: EmailTemplateQuery = {}
): Promise<Paged<EmailVersionRow>> {
  const res = await apiGet<PagedDTO<EmailVersionRowDTO>>(
    `/email-templates/${id}/versions`,
    { baseURL: DOC_BASE_URL, params: { page: q.page ?? 0, size: q.size ?? 20 } }
  )
  console.log(
    `[GET /document-service/api/v1/email-templates/${id}/versions]`,
    res
  )
  return toPaged(res, toEmailVersionRow)
}

/** GET {document-service}/email-templates/{id}/compare?from&to → the two
   versions and their per-field word-by-word diffs (server-computed). */
export async function fetchEmailTemplateCompare(
  id: number,
  from: number,
  to: number
): Promise<EmailVersionCompare> {
  const res = await apiGet<EmailVersionCompareDTO>(
    `/email-templates/${id}/compare`,
    { baseURL: DOC_BASE_URL, params: { from, to } }
  )
  console.log(
    `[GET /document-service/api/v1/email-templates/${id}/compare?from=${from}&to=${to}]`,
    res
  )
  return toEmailVersionCompare(res)
}

/** GET {document-service}/email-templates/{id}/activity?page&size → the audit
   feed (newest first). Console-only for now; not yet bound to the UI. */
export async function fetchEmailTemplateActivity(
  id: number,
  q: EmailTemplateQuery = {}
): Promise<Paged<EmailActivityRow>> {
  const res = await apiGet<PagedDTO<EmailActivityRowDTO>>(
    `/email-templates/${id}/activity`,
    { baseURL: DOC_BASE_URL, params: { page: q.page ?? 0, size: q.size ?? 20 } }
  )
  console.log(
    `[GET /document-service/api/v1/email-templates/${id}/activity]`,
    res
  )
  return toPaged(res, toEmailActivityRow)
}

/** POST {document-service}/email-templates → the created template (v1 DRAFT). */
export async function createEmailTemplate(
  body: CreateEmailTemplateBody
): Promise<EmailTemplate> {
  const res = await apiPost<EmailTemplateDTO>("/email-templates", body, {
    baseURL: DOC_BASE_URL,
  })
  console.log("[POST /document-service/api/v1/email-templates]", { body, res })
  return toEmailTemplate(res)
}

/** PUT {document-service}/email-templates/{id} → updates the template as a new
   version. Takes the same body as create; omitted fields carry over server-side. */
export async function updateEmailTemplate(
  id: number,
  body: CreateEmailTemplateBody
): Promise<EmailTemplate> {
  const res = await apiPut<EmailTemplateDTO>(`/email-templates/${id}`, body, {
    baseURL: DOC_BASE_URL,
  })
  console.log(`[PUT /document-service/api/v1/email-templates/${id}]`, {
    body,
    res,
  })
  return toEmailTemplate(res)
}

/** POST .../{id}/publish — publishes the current (latest) version. */
export async function publishEmailTemplate(id: number): Promise<void> {
  await apiPost<unknown>(`/email-templates/${id}/publish`, undefined, {
    baseURL: DOC_BASE_URL,
  })
}

/** POST .../{id}/versions/{n}/rollback — restore version n's content as a new
   (draft) version. Returns nothing meaningful; callers refetch. */
export async function rollbackEmailTemplate(
  id: number,
  versionNumber: number
): Promise<void> {
  await apiPost<unknown>(
    `/email-templates/${id}/versions/${versionNumber}/rollback`,
    undefined,
    { baseURL: DOC_BASE_URL }
  )
}

/** POST .../{id}/activate | .../{id}/deactivate — enable/disable a template. */
export async function setEmailTemplateActive(
  id: number,
  active: boolean
): Promise<void> {
  await apiPost<unknown>(
    `/email-templates/${id}/${active ? "activate" : "deactivate"}`,
    undefined,
    { baseURL: DOC_BASE_URL }
  )
}

/** POST .../{id}/archive | .../{id}/unarchive — move to/from the Archived view. */
export async function setEmailTemplateArchived(
  id: number,
  archived: boolean
): Promise<void> {
  const action = archived ? "archive" : "unarchive"
  const res = await apiPost<unknown>(
    `/email-templates/${id}/${action}`,
    undefined,
    {
      baseURL: DOC_BASE_URL,
    }
  )
  console.log(
    `[POST /document-service/api/v1/email-templates/${id}/${action}]`,
    res
  )
}

/* ------------------------------------------------ send test (notifications) --- */

export type SendTestEmailBody = {
  template_id: number
  to_email: string
  /** Placeholder values used to render the template, keyed by field_key. */
  data: Record<string, string>
  template_code?: string
}

/** POST {notifications}/email/send — queue a templated test email (async, 202). */
export async function sendTestEmail(body: SendTestEmailBody): Promise<unknown> {
  const res = await apiPost<unknown>("/email/send", body, {
    baseURL: NOTIFICATIONS_BASE_URL,
  })
  console.log("[POST /notifications/api/v1/email/send]", { body, res })
  return res
}

/** Duplicate a template: read its full detail, then POST a copy (new code/name).
   The document service has no dedicated duplicate endpoint, so we recreate. */
export async function duplicateEmailTemplate(
  id: number
): Promise<EmailTemplate> {
  const d = await fetchEmailTemplateDetail(id)
  const body: CreateEmailTemplateBody = {
    code: `${d.functionalCode}_COPY`.toUpperCase(),
    name: `${d.name} (copy)`,
    description: d.description || undefined,
    channel: d.channel || "EMAIL",
    trigger_event: d.triggerEvent,
    used_by: d.usedBy,
    tags: d.tags,
    subject: d.subject,
    html_content: d.htmlContent,
    css_content: d.cssContent,
    plain_text_content: d.plainTextContent,
    change_note: `Duplicated from ${d.code}`,
    placeholders: d.mergeFields.map((m, i) => ({
      field_key: m.fieldKey,
      label: m.label,
      data_type: m.dataType,
      required: m.required,
      display_order: m.displayOrder || i + 1,
    })),
    attachment_policy: { enabled: false },
  }
  return createEmailTemplate(body)
}
