/* Thin service over the document-service email global-placeholders API.
   Points the shared client at DOC_BASE_URL via a per-request baseURL override. */

import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  DOC_BASE_URL,
} from "@/lib/api/client"
import type { PagedDTO } from "@/lib/api/paged"

import {
  toGlobalPlaceholder,
  type CreateGlobalPlaceholderBody,
  type GlobalPlaceholderDTO,
  type GlobalPlaceholderItem,
  type UpdateGlobalPlaceholderBody,
} from "./types"

const CFG = { baseURL: DOC_BASE_URL }
const BASE = "/email/global-placeholders"

/** GET {document-service}/email/global-placeholders → mapped placeholder rows.
   The list endpoint has no paging params, so it returns a plain array — but we
   tolerate a Spring page envelope just in case. */
export async function fetchGlobalPlaceholders(): Promise<
  GlobalPlaceholderItem[]
> {
  const res = await apiGet<
    GlobalPlaceholderDTO[] | PagedDTO<GlobalPlaceholderDTO>
  >(BASE, CFG)
  console.log("[GET /document-service/api/v1/email/global-placeholders]", res)
  const rows = Array.isArray(res) ? res : (res?.content ?? [])
  return rows.map(toGlobalPlaceholder)
}

/** POST {document-service}/email/global-placeholders → the created placeholder. */
export async function createGlobalPlaceholder(
  body: CreateGlobalPlaceholderBody
): Promise<GlobalPlaceholderItem> {
  const res = await apiPost<GlobalPlaceholderDTO>(BASE, body, CFG)
  return toGlobalPlaceholder(res)
}

/** PUT {document-service}/email/global-placeholders/{id} (omitted fields left
   unchanged) → the updated placeholder. */
export async function updateGlobalPlaceholder(
  id: number,
  body: UpdateGlobalPlaceholderBody
): Promise<GlobalPlaceholderItem> {
  const res = await apiPut<GlobalPlaceholderDTO>(`${BASE}/${id}`, body, CFG)
  return toGlobalPlaceholder(res)
}

/** POST .../{id}/activate | .../{id}/deactivate — toggles a placeholder on/off. */
export async function setGlobalPlaceholderActive(
  id: number,
  active: boolean
): Promise<void> {
  await apiPost<unknown>(
    `${BASE}/${id}/${active ? "activate" : "deactivate"}`,
    undefined,
    CFG
  )
}

/** DELETE {document-service}/email/global-placeholders/{id}. */
export async function deleteGlobalPlaceholder(id: number): Promise<void> {
  await apiDelete<unknown>(`${BASE}/${id}`, CFG)
}
