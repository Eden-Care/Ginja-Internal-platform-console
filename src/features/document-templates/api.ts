/* Thin service over the document-service API (PDF document templates).
   Points the shared client at DOC_BASE_URL via a per-request baseURL override. */

import { apiGet, DOC_BASE_URL } from "@/lib/api/client"
import type { PagedDTO } from "@/lib/api/paged"
import type { DocTemplate } from "@/lib/console-data"

import { toDocumentTemplate, type DocumentTemplateDTO } from "./types"

export type DocumentTemplateQuery = { page?: number; size?: number }

/** GET {document-service}/templates?page&size → mapped DocTemplate rows. */
export async function fetchDocumentTemplates(
  q: DocumentTemplateQuery = {}
): Promise<DocTemplate[]> {
  const res = await apiGet<PagedDTO<DocumentTemplateDTO>>("/templates", {
    baseURL: DOC_BASE_URL,
    params: { page: q.page ?? 0, size: q.size ?? 20 },
  })
  console.log("[GET /document-service/api/v1/templates]", res)
  return (res?.content ?? []).map(toDocumentTemplate)
}
