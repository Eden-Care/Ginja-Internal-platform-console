/* Thin service over the document-service SMS templates API (`/sms-templates`).
   Parallel to email-templates; same DOC_BASE_URL + envelope/bearer interceptors. */

import { apiGet, apiPost, apiPut, DOC_BASE_URL } from "@/lib/api/client"
import type { Paged, PagedDTO } from "@/lib/api/paged"
import { toPaged } from "@/lib/api/paged"

import {
  toSmsActivityRow,
  toSmsTemplate,
  toSmsTemplateDetail,
  toSmsVersionCompare,
  toSmsVersionRow,
  type CreateSmsTemplateBody,
  type SmsActivityRow,
  type SmsActivityRowDTO,
  type SmsTemplate,
  type SmsTemplateDetail,
  type SmsTemplateDTO,
  type SmsVersionCompare,
  type SmsVersionCompareDTO,
  type SmsVersionRow,
  type SmsVersionRowDTO,
} from "./types"

const CFG = { baseURL: DOC_BASE_URL }
export type SmsTemplateQuery = {
  page?: number
  size?: number
  archived?: boolean
}

/** GET /sms-templates?page&size&archived → paged rows. */
export async function fetchSmsTemplates(
  q: SmsTemplateQuery = {}
): Promise<Paged<SmsTemplate>> {
  const params: Record<string, string | number | boolean> = {
    page: q.page ?? 0,
    size: q.size ?? 20,
  }
  if (q.archived != null) params.archived = q.archived
  const res = await apiGet<PagedDTO<SmsTemplateDTO>>("/sms-templates", {
    ...CFG,
    params,
  })
  console.log("[GET /document-service/api/v1/sms-templates]", res)
  return toPaged(res, toSmsTemplate)
}

/** GET /sms-templates/{id} → full detail (get-one already carries message + segment info). */
export async function fetchSmsTemplateDetail(
  id: number
): Promise<SmsTemplateDetail> {
  const res = await apiGet<SmsTemplateDTO>(`/sms-templates/${id}`, CFG)
  console.log(`[GET /document-service/api/v1/sms-templates/${id}]`, res)
  return toSmsTemplateDetail(res)
}

/** GET /sms-templates/{id}/versions?page&size → version history (newest first). */
export async function fetchSmsTemplateVersions(
  id: number,
  q: SmsTemplateQuery = {}
): Promise<Paged<SmsVersionRow>> {
  const res = await apiGet<PagedDTO<SmsVersionRowDTO>>(
    `/sms-templates/${id}/versions`,
    { ...CFG, params: { page: q.page ?? 0, size: q.size ?? 20 } }
  )
  console.log(
    `[GET /document-service/api/v1/sms-templates/${id}/versions]`,
    res
  )
  return toPaged(res, toSmsVersionRow)
}

/** GET /sms-templates/{id}/compare?from&to → the two versions + per-field diffs. */
export async function fetchSmsTemplateCompare(
  id: number,
  from: number,
  to: number
): Promise<SmsVersionCompare> {
  const res = await apiGet<SmsVersionCompareDTO>(
    `/sms-templates/${id}/compare`,
    { ...CFG, params: { from, to } }
  )
  console.log(
    `[GET /document-service/api/v1/sms-templates/${id}/compare?from=${from}&to=${to}]`,
    res
  )
  return toSmsVersionCompare(res)
}

/** GET /sms-templates/{id}/activity?page&size → audit feed (newest first). */
export async function fetchSmsTemplateActivity(
  id: number,
  q: SmsTemplateQuery = {}
): Promise<Paged<SmsActivityRow>> {
  const res = await apiGet<PagedDTO<SmsActivityRowDTO>>(
    `/sms-templates/${id}/activity`,
    { ...CFG, params: { page: q.page ?? 0, size: q.size ?? 20 } }
  )
  console.log(
    `[GET /document-service/api/v1/sms-templates/${id}/activity]`,
    res
  )
  return toPaged(res, toSmsActivityRow)
}

/** POST /sms-templates → the created template (v1 DRAFT). */
export async function createSmsTemplate(
  body: CreateSmsTemplateBody
): Promise<SmsTemplate> {
  const res = await apiPost<SmsTemplateDTO>("/sms-templates", body, CFG)
  console.log("[POST /document-service/api/v1/sms-templates]", { body, res })
  return toSmsTemplate(res)
}

/** PUT /sms-templates/{id} → updates as a new version (same body shape as create). */
export async function updateSmsTemplate(
  id: number,
  body: CreateSmsTemplateBody
): Promise<SmsTemplate> {
  const res = await apiPut<SmsTemplateDTO>(`/sms-templates/${id}`, body, CFG)
  console.log(`[PUT /document-service/api/v1/sms-templates/${id}]`, {
    body,
    res,
  })
  return toSmsTemplate(res)
}

/** POST /sms-templates/{id}/publish — publish the latest version. */
export async function publishSmsTemplate(id: number): Promise<void> {
  await apiPost<unknown>(`/sms-templates/${id}/publish`, undefined, CFG)
}

/** POST /sms-templates/{id}/versions/{n}/rollback — restore version n's content
   as a new (draft) version. */
export async function rollbackSmsTemplate(
  id: number,
  versionNumber: number
): Promise<void> {
  await apiPost<unknown>(
    `/sms-templates/${id}/versions/${versionNumber}/rollback`,
    undefined,
    CFG
  )
}

/** POST /sms-templates/{id}/activate | /deactivate — enable/disable. */
export async function setSmsTemplateActive(
  id: number,
  active: boolean
): Promise<void> {
  await apiPost<unknown>(
    `/sms-templates/${id}/${active ? "activate" : "deactivate"}`,
    undefined,
    CFG
  )
}

/** POST /sms-templates/{id}/archive | /unarchive — move to/from the Archived view. */
export async function setSmsTemplateArchived(
  id: number,
  archived: boolean
): Promise<void> {
  const action = archived ? "archive" : "unarchive"
  const res = await apiPost<unknown>(
    `/sms-templates/${id}/${action}`,
    undefined,
    CFG
  )
  console.log(
    `[POST /document-service/api/v1/sms-templates/${id}/${action}]`,
    res
  )
}

/** Duplicate: read detail, POST a copy with a new code. */
export async function duplicateSmsTemplate(id: number): Promise<SmsTemplate> {
  const d = await fetchSmsTemplateDetail(id)
  const placeholders = [
    ...new Set(
      (d.messageText.match(/\{\{\s*(\w+)\s*\}\}/g) ?? []).map((m) =>
        m.replace(/[{}\s]/g, "")
      )
    ),
  ].map((p, i) => ({
    field_key: p,
    label: p,
    data_type: "STRING",
    required: true,
    display_order: i + 1,
  }))
  return createSmsTemplate({
    code: `${d.functionalCode}_COPY`.toUpperCase(),
    name: `${d.name} (copy)`,
    description: d.description || undefined,
    trigger_event: d.triggerEvent,
    used_by: d.usedBy,
    tags: d.tags,
    message_text: d.messageText,
    change_note: `Duplicated from ${d.code}`,
    placeholders,
  })
}
